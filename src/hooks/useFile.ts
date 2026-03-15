import { useState, useCallback, useEffect } from 'react';
import { fileSystemService } from '../services/FileSystemService';
import { get, set, del } from 'idb-keyval';

const DRAFT_KEY = 'mdit_draft_content';
const HANDLE_KEY = 'mdit_file_handle';
const NAME_KEY = 'mdit_file_name';
const PATH_KEY = 'mdit_file_path';
const AUTOSAVE_KEY = 'mdit_autosave_enabled';

export function useFile() {
  const [content, setContent] = useState<string>('');
  const [handle, setHandle] = useState<FileSystemFileHandle | null>(null);
  const [fileName, setFileName] = useState<string>('Untitled');
  const [filePath, setFilePath] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasWritePermission, setHasWritePermission] = useState(false);
  const [lastExternalUpdate, setLastExternalUpdate] = useState<number>(0);
  
  const [autosaveEnabled, setAutosaveEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem(AUTOSAVE_KEY);
    return saved === null ? true : saved === 'true';
  });

  // Check permission utility
  const checkPermission = async (fileHandle: FileSystemFileHandle | null) => {
    if (!fileHandle) {
      setHasWritePermission(false);
      return false;
    }
    const options = { mode: 'readwrite' as const };
    const permission = await fileHandle.queryPermission(options);
    const hasPerm = permission === 'granted';
    setHasWritePermission(hasPerm);
    return hasPerm;
  };

  // Initialize from IndexedDB
  useEffect(() => {
    const init = async () => {
      try {
        const savedContent = await get(DRAFT_KEY);
        const savedHandle = await get(HANDLE_KEY);
        const savedName = await get(NAME_KEY);
        const savedPath = await get(PATH_KEY);

        if (savedContent) setContent(savedContent);
        if (savedName) setFileName(savedName);
        if (savedPath) setFilePath(savedPath);

        if (savedHandle) {
          setHandle(savedHandle);
          setFileName(savedHandle.name);
          await checkPermission(savedHandle);
        }
        setLastExternalUpdate(Date.now());
      } catch (e) {
        console.error('Failed to load draft:', e);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  // Auto-save draft and metadata to IndexedDB
  useEffect(() => {
    if (!isLoading) {
      set(DRAFT_KEY, content);
      set(NAME_KEY, fileName);
      if (filePath) set(PATH_KEY, filePath);
      if (handle) set(HANDLE_KEY, handle);
    }
  }, [content, handle, fileName, filePath, isLoading]);

  // Persist autosave preference
  useEffect(() => {
    localStorage.setItem(AUTOSAVE_KEY, String(autosaveEnabled));
  }, [autosaveEnabled]);

  const updateContent = useCallback((newContent: string) => {
    // Trim to avoid "dirty" state on minor formatting differences after load
    if (newContent.trim() !== content.trim()) {
      setContent(newContent);
      setIsDirty(true);
    }
  }, [content]);

  const needsConfirmation = useCallback(() => {
    return isDirty && !handle && content.trim() !== '';
  }, [isDirty, handle, content]);

  const openFile = useCallback(async () => {
    try {
      const { handle: newHandle, content: newContent, name, path } = await fileSystemService.openFile();
      setHandle(newHandle);
      setContent(newContent);
      setFileName(name);
      setFilePath(path || name);
      setIsDirty(false);
      setLastExternalUpdate(Date.now());
      await checkPermission(newHandle); // Check and set permission state
    } catch (e) {
      console.error('Open file cancelled or failed:', e);
    }
  }, []);

  const saveFileAs = useCallback(async (contentToSave: string, currentName: string) => {
    try {
      setIsSaving(true);
      
      let suggestedName = currentName;
      if (currentName === 'Untitled') {
        const firstLine = contentToSave.split('\n').find(line => line.trim().length > 0);
        if (firstLine) {
          suggestedName = firstLine
            .replace(/^#+\s*/, '') // Remove leading markdown heading hashes
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/gi, '-') // Replace special chars and spaces with hyphens
            .replace(/^-+|-+$/g, ''); // Trim leading/trailing hyphens
            
          if (!suggestedName) suggestedName = 'untitled';
        }
      }

      const { handle: newHandle, name, path } = await fileSystemService.saveFileAs(contentToSave, suggestedName);
      setHandle(newHandle);
      setFileName(name);
      setFilePath(path || name);
      setIsDirty(false);
      setAutosaveEnabled(true);
      await checkPermission(newHandle); // Check and set permission state
    } catch (e) {
      console.error('Save as cancelled or failed:', e);
    } finally {
      setIsSaving(false);
    }
  }, []);

  const saveFile = useCallback(async (isAuto = false) => {
    if (!isDirty || isSaving) return;
    try {
      setIsSaving(true);
      if (handle) {
        const options = { mode: 'readwrite' as const };
        if ((await handle.queryPermission(options)) !== 'granted') {
          // If auto-saving and no permission, just stop to avoid annoying the user
          if (isAuto) {
            setIsSaving(false);
            return;
          }
          if ((await handle.requestPermission(options)) !== 'granted') {
            throw new Error('Permission denied');
          }
        }
        
        await fileSystemService.writeFile(handle, content);
        setIsDirty(false);
        setHasWritePermission(true); // Since it succeeded, we have permission
      } else if (!isAuto) {
        // Only trigger "Save As" picker if the user explicitly clicked Save
        await saveFileAs(content, fileName);
      }
    } catch (e) {
      console.error('Save file failed:', e);
      if (!isAuto) await saveFileAs(content, fileName);
    } finally {
      setIsSaving(false);
    }
  }, [handle, content, isDirty, isSaving, saveFileAs, fileName]);

  const newFile = useCallback(() => {
    setHandle(null);
    setContent('');
    setFileName('Untitled');
    setFilePath(null);
    setIsDirty(false);
    setLastExternalUpdate(Date.now());
    del(DRAFT_KEY);
    del(HANDLE_KEY);
    del(NAME_KEY);
    del(PATH_KEY);
  }, []);

  // Debounced auto-save to the actual file
  useEffect(() => {
    // Only trigger if enabled, file exists, has changes, and isn't currently saving
    if (autosaveEnabled && isDirty && handle && !isSaving) {
      const timer = setTimeout(() => {
        saveFile(true); // Pass isAuto = true
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [autosaveEnabled, isDirty, handle, isSaving, saveFile, content]);

  return {
    content,
    fileName,
    filePath,
    isDirty,
    isSaving,
    isLoading,
    hasWritePermission,
    lastExternalUpdate,
    autosaveEnabled,
    setAutosaveEnabled,
    needsConfirmation,
    updateContent,
    openFile,
    saveFile: () => saveFile(false),
    saveFileAs: () => saveFileAs(content, fileName),
    newFile,
  };
}
