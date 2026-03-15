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
  const [lastExternalUpdate, setLastExternalUpdate] = useState<number>(0);
  
  const [autosaveEnabled, setAutosaveEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem(AUTOSAVE_KEY);
    return saved === null ? true : saved === 'true';
  });

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
          // Keep the handle even if we don't have permission yet
          // We will request permission when the user actually tries to save
          setHandle(savedHandle);
          setFileName(savedHandle.name);
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
    if (newContent !== content) {
      setContent(newContent);
      setIsDirty(true);
    }
  }, [content]);

  const openFile = useCallback(async () => {
    try {
      const { handle, content, name, path } = await fileSystemService.openFile();
      setHandle(handle);
      setContent(content);
      setFileName(name);
      setFilePath(path || name);
      setIsDirty(false);
      setLastExternalUpdate(Date.now());
      setAutosaveEnabled(true);
    } catch (e) {
      console.error('Open file cancelled or failed:', e);
    }
  }, []);

  const saveFileAs = useCallback(async (contentToSave: string, currentName: string) => {
    try {
      setIsSaving(true);
      const { handle, name, path } = await fileSystemService.saveFileAs(contentToSave, currentName);
      setHandle(handle);
      setFileName(name);
      setFilePath(path || name);
      setIsDirty(false);
      setAutosaveEnabled(true);
    } catch (e) {
      console.error('Save as cancelled or failed:', e);
    } finally {
      setIsSaving(false);
    }
  }, []);

  const saveFile = useCallback(async () => {
    if (!isDirty || isSaving) return;
    try {
      setIsSaving(true);
      if (handle) {
        // Check if we still have permission (e.g. after a reload)
        const options = { mode: 'readwrite' as const };
        if ((await handle.queryPermission(options)) !== 'granted') {
          // If not, request it specifically for this file
          if ((await handle.requestPermission(options)) !== 'granted') {
            throw new Error('Permission denied');
          }
        }
        
        await fileSystemService.writeFile(handle, content);
        setIsDirty(false);
        setAutosaveEnabled(true);
      } else {
        await saveFileAs(content, fileName);
      }
    } catch (e) {
      console.error('Save file failed:', e);
      // If saving to the existing handle failed (e.g. permission denied or handle invalid),
      // we fall back to Save As to ensure data isn't lost.
      if (handle) await saveFileAs(content, fileName);
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
    if (autosaveEnabled && isDirty && handle && !isSaving) {
      const timer = setTimeout(() => {
        saveFile();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [content, handle, isDirty, isSaving, saveFile, autosaveEnabled]);

  return {
    content,
    fileName,
    filePath,
    isDirty,
    isSaving,
    isLoading,
    lastExternalUpdate,
    autosaveEnabled,
    setAutosaveEnabled,
    updateContent,
    openFile,
    saveFile,
    saveFileAs: () => saveFileAs(content, fileName),
    newFile,
  };
}
