import { useState, useCallback, useEffect } from 'react';
import { fileSystemService } from '../services/FileSystemService';
import { sshService } from '../services/SshService';
import { get, set, del } from 'idb-keyval';

const DRAFT_KEY = 'mdit_draft_content';
const HANDLE_KEY = 'mdit_file_handle';
const NAME_KEY = 'mdit_file_name';
const PATH_KEY = 'mdit_file_path';
const MODE_KEY = 'mdit_file_mode';
const AUTOSAVE_KEY = 'mdit_autosave_enabled';

export type FileMode = 'local' | 'remote';

export function useFile() {
  const [content, setContent] = useState<string>('');
  const [handle, setHandle] = useState<FileSystemFileHandle | null>(null);
  const [fileMode, setFileMode] = useState<FileMode>('local');
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
        const savedMode = await get(MODE_KEY) as FileMode;

        if (savedContent) setContent(savedContent);
        if (savedName) setFileName(savedName);
        if (savedPath) setFilePath(savedPath);
        if (savedMode) setFileMode(savedMode);

        if (savedMode === 'local' && savedHandle) {
          setHandle(savedHandle);
          setFileName(savedHandle.name);
          await checkPermission(savedHandle);
        } else if (savedMode === 'remote') {
          // Note: Session will need re-authentication if page reloads
          // For now, we just restore the path metadata
          setHasWritePermission(true); 
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
      set(MODE_KEY, fileMode);
      if (filePath) set(PATH_KEY, filePath);
      if (handle) set(HANDLE_KEY, handle);
    }
  }, [content, handle, fileName, filePath, fileMode, isLoading]);

  // Persist autosave preference
  useEffect(() => {
    localStorage.setItem(AUTOSAVE_KEY, String(autosaveEnabled));
  }, [autosaveEnabled]);

  const updateContent = useCallback((newContent: string) => {
    if (newContent.trim() !== content.trim()) {
      setContent(newContent);
      setIsDirty(true);
    }
  }, [content]);

  const needsConfirmation = useCallback(() => {
    return isDirty && !handle && fileMode === 'local' && content.trim() !== '';
  }, [isDirty, handle, fileMode, content]);

  const openFile = useCallback(async () => {
    try {
      const { handle: newHandle, content: newContent, name, path } = await fileSystemService.openFile();
      setFileMode('local');
      setHandle(newHandle);
      setContent(newContent);
      setFileName(name);
      setFilePath(path || name);
      setIsDirty(false);
      setLastExternalUpdate(Date.now());
      await checkPermission(newHandle);
    } catch (e) {
      console.error('Open file cancelled or failed:', e);
    }
  }, []);

  const openRemoteFile = useCallback(async (path: string) => {
    try {
      setIsLoading(true);
      const remoteContent = await sshService.readFile(path);
      const name = path.split('/').pop() || path;
      
      setFileMode('remote');
      setHandle(null);
      setContent(remoteContent);
      setFileName(name);
      setFilePath(path);
      setIsDirty(false);
      setHasWritePermission(true);
      setLastExternalUpdate(Date.now());
    } catch (e) {
      console.error('Failed to open remote file:', e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveRemoteFileAs = useCallback(async (contentToSave: string, path: string) => {
    try {
      setIsSaving(true);
      await sshService.writeFile(path, contentToSave);
      const name = path.split('/').pop() || path;
      
      setFileMode('remote');
      setHandle(null);
      setContent(contentToSave);
      setFileName(name);
      setFilePath(path);
      setIsDirty(false);
      setHasWritePermission(true);
      setAutosaveEnabled(true);
      setLastExternalUpdate(Date.now());
    } catch (e) {
      console.error('Save remote as failed:', e);
      throw e;
    } finally {
      setIsSaving(false);
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
            .replace(/^#+\s*/, '')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/gi, '-')
            .replace(/^-+|-+$/g, '');
            
          if (!suggestedName) suggestedName = 'untitled';
        }
      }

      const { handle: newHandle, name, path } = await fileSystemService.saveFileAs(contentToSave, suggestedName);
      setFileMode('local');
      setHandle(newHandle);
      setFileName(name);
      setFilePath(path || name);
      setIsDirty(false);
      setAutosaveEnabled(true);
      await checkPermission(newHandle);
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
      
      if (fileMode === 'remote' && filePath) {
        await sshService.writeFile(filePath, content);
        setIsDirty(false);
      } else if (fileMode === 'local' && handle) {
        const options = { mode: 'readwrite' as const };
        if ((await handle.queryPermission(options)) !== 'granted') {
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
        setHasWritePermission(true);
      } else if (!isAuto) {
        await saveFileAs(content, fileName);
      }
    } catch (e) {
      console.error('Save file failed:', e);
      if (!isAuto && fileMode === 'local') await saveFileAs(content, fileName);
    } finally {
      setIsSaving(false);
    }
  }, [handle, fileMode, filePath, content, isDirty, isSaving, saveFileAs, fileName]);

  const newFile = useCallback(() => {
    setHandle(null);
    setFileMode('local');
    setContent('');
    setFileName('Untitled');
    setFilePath(null);
    setIsDirty(false);
    setLastExternalUpdate(Date.now());
    del(DRAFT_KEY);
    del(HANDLE_KEY);
    del(NAME_KEY);
    del(PATH_KEY);
    del(MODE_KEY);
  }, []);

  // Debounced auto-save
  useEffect(() => {
    const isReadyToAutoSave = autosaveEnabled && isDirty && !isSaving && (
      (fileMode === 'local' && handle) || 
      (fileMode === 'remote' && filePath && sshService.isConnected())
    );

    if (isReadyToAutoSave) {
      const timer = setTimeout(() => {
        saveFile(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [autosaveEnabled, isDirty, handle, fileMode, filePath, isSaving, saveFile]);

  return {
    content,
    fileName,
    filePath,
    fileMode,
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
    openRemoteFile,
    saveRemoteFileAs,
    saveFile: () => saveFile(false),
    saveFileAs: () => saveFileAs(content, fileName),
    newFile,
  };
}
