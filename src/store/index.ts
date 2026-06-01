/**
 * Zustand Store - Centralized state management for MDit
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Theme, FileMode, FileBrowserMode } from '../types';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import { fileSystemService } from '../services/FileSystemService';
import { sshService } from '../services/SshService';

const DRAFT_KEY = 'mdit_draft_content';
const HANDLE_KEY = 'mdit_file_handle';
const NAME_KEY = 'mdit_file_name';
const PATH_KEY = 'mdit_file_path';
const MODE_KEY = 'mdit_file_mode';
const AUTOSAVE_KEY = 'mdit_autosave_enabled';

const syncToIndexedDB = (
  content: string,
  fileName: string,
  fileMode: FileMode,
  filePath: string | null,
  fileHandle: FileSystemFileHandle | null
) => {
  idbSet(DRAFT_KEY, content);
  idbSet(NAME_KEY, fileName);
  idbSet(MODE_KEY, fileMode);
  if (filePath) idbSet(PATH_KEY, filePath);
  else idbDel(PATH_KEY);
  if (fileHandle) idbSet(HANDLE_KEY, fileHandle);
  else idbDel(HANDLE_KEY);
};

// ============================================================================
// Editor Store - File content and metadata
// ============================================================================
interface EditorState {
  content: string;
  fileName: string;
  filePath: string | null;
  fileMode: FileMode;
  isDirty: boolean;
  isSaving: boolean;
  isLoading: boolean;
  hasWritePermission: boolean;
  autosaveEnabled: boolean;
  lastExternalUpdate: number;
  fileHandle: FileSystemFileHandle | null;
}

interface EditorActions {
  setContent: (content: string) => void;
  setFileName: (name: string) => void;
  setFilePath: (path: string | null) => void;
  setFileMode: (mode: FileMode) => void;
  setIsDirty: (dirty: boolean) => void;
  setIsSaving: (saving: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setHasWritePermission: (hasPermission: boolean) => void;
  setAutosaveEnabled: (enabled: boolean) => void;
  setLastExternalUpdate: (timestamp: number) => void;
  setFileHandle: (handle: FileSystemFileHandle | null) => void;
  resetEditor: () => void;
  checkPermission: (handle: FileSystemFileHandle | null) => Promise<boolean>;
  openFile: () => Promise<void>;
  openRemoteFile: (path: string) => Promise<void>;
  saveRemoteFileAs: (contentToSave: string, path: string) => Promise<void>;
  saveFileAs: (contentToSave?: string, currentName?: string) => Promise<void>;
  saveFile: (isAuto?: boolean) => Promise<void>;
  newFile: () => void;
  needsConfirmation: () => boolean;
  updateContent: (newContent: string) => void;
  initializeEditor: () => Promise<void>;
}

type EditorStore = EditorState & EditorActions;

const initialEditorState: EditorState = {
  content: '',
  fileName: 'Untitled',
  filePath: null,
  fileMode: 'local',
  isDirty: false,
  isSaving: false,
  isLoading: true,
  hasWritePermission: false,
  autosaveEnabled: true,
  lastExternalUpdate: 0,
  fileHandle: null,
};

export const useEditorStore = create<EditorStore>((set, get) => ({
  ...initialEditorState,
  
  setContent: (content) => set({ content, isDirty: true }),
  setFileName: (fileName) => set({ fileName }),
  setFilePath: (filePath) => set({ filePath }),
  setFileMode: (fileMode) => set({ fileMode }),
  setIsDirty: (isDirty) => set({ isDirty }),
  setIsSaving: (isSaving) => set({ isSaving }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setHasWritePermission: (hasWritePermission) => set({ hasWritePermission }),
  setAutosaveEnabled: (autosaveEnabled) => {
    set({ autosaveEnabled });
    localStorage.setItem(AUTOSAVE_KEY, String(autosaveEnabled));
  },
  setLastExternalUpdate: (lastExternalUpdate) => set({ lastExternalUpdate }),
  setFileHandle: (fileHandle) => set({ fileHandle }),
  
  resetEditor: () => set({ ...initialEditorState, isLoading: false }),

  checkPermission: async (fileHandle) => {
    if (!fileHandle) {
      set({ hasWritePermission: false });
      return false;
    }
    const options = { mode: 'readwrite' as const };
    const permission = await fileHandle.queryPermission(options);
    const hasPerm = permission === 'granted';
    set({ hasWritePermission: hasPerm });
    return hasPerm;
  },

  openFile: async () => {
    try {
      const { handle: newHandle, content: newContent, name, path } = await fileSystemService.openFile();
      set({
        fileMode: 'local',
        fileHandle: newHandle,
        content: newContent,
        fileName: name,
        filePath: path || name,
        isDirty: false,
        lastExternalUpdate: Date.now(),
      });
      await get().checkPermission(newHandle);
      syncToIndexedDB(newContent, name, 'local', path || name, newHandle);
    } catch (e) {
      console.error('Open file cancelled or failed:', e);
    }
  },

  openRemoteFile: async (path: string) => {
    try {
      set({ isLoading: true });
      const remoteContent = await sshService.readFile(path);
      const name = path.split('/').pop() || path;
      
      set({
        fileMode: 'remote',
        fileHandle: null,
        content: remoteContent,
        fileName: name,
        filePath: path,
        isDirty: false,
        hasWritePermission: true,
        lastExternalUpdate: Date.now(),
      });
      syncToIndexedDB(remoteContent, name, 'remote', path, null);
    } catch (e) {
      console.error('Failed to open remote file:', e);
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  saveRemoteFileAs: async (contentToSave: string, path: string) => {
    try {
      set({ isSaving: true });
      await sshService.writeFile(path, contentToSave);
      const name = path.split('/').pop() || path;
      
      set({
        fileMode: 'remote',
        fileHandle: null,
        content: contentToSave,
        fileName: name,
        filePath: path,
        isDirty: false,
        hasWritePermission: true,
        autosaveEnabled: true,
        lastExternalUpdate: Date.now(),
      });
      localStorage.setItem(AUTOSAVE_KEY, 'true');
      syncToIndexedDB(contentToSave, name, 'remote', path, null);
    } catch (e) {
      console.error('Save remote as failed:', e);
      throw e;
    } finally {
      set({ isSaving: false });
    }
  },

  saveFileAs: async (contentToSave?, currentName?) => {
    try {
      set({ isSaving: true });
      const finalContent = contentToSave !== undefined ? contentToSave : get().content;
      const nameToSave = currentName !== undefined ? currentName : get().fileName;
      
      let suggestedName = nameToSave;
      if (nameToSave === 'Untitled') {
        const firstLine = finalContent.split('\n').find(line => line.trim().length > 0);
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

      const { handle: newHandle, name, path } = await fileSystemService.saveFileAs(finalContent, suggestedName);
      set({
        fileMode: 'local',
        fileHandle: newHandle,
        fileName: name,
        filePath: path || name,
        isDirty: false,
        autosaveEnabled: true,
      });
      localStorage.setItem(AUTOSAVE_KEY, 'true');
      await get().checkPermission(newHandle);
      syncToIndexedDB(finalContent, name, 'local', path || name, newHandle);
    } catch (e) {
      console.error('Save as cancelled or failed:', e);
    } finally {
      set({ isSaving: false });
    }
  },

  saveFile: async (isAuto = false) => {
    const { isDirty, isSaving, fileMode, filePath, content, fileHandle, fileName } = get();
    if (!isDirty || isSaving) return;
    
    try {
      set({ isSaving: true });
      
      if (fileMode === 'remote' && filePath) {
        if (!sshService.isConnected()) {
          if (isAuto) {
            set({ isSaving: false });
            return;
          }
          throw new Error('Not connected to remote server. Please connect first.');
        }
        await sshService.writeFile(filePath, content);
        set({ isDirty: false });
        syncToIndexedDB(content, fileName, fileMode, filePath, fileHandle);
      } else if (fileMode === 'local' && fileHandle) {
        const options = { mode: 'readwrite' as const };
        if ((await fileHandle.queryPermission(options)) !== 'granted') {
          if (isAuto) {
            set({ isSaving: false });
            return;
          }
          if ((await fileHandle.requestPermission(options)) !== 'granted') {
            throw new Error('Permission denied');
          }
        }
        
        await fileSystemService.writeFile(fileHandle, content);
        set({ isDirty: false, hasWritePermission: true });
        syncToIndexedDB(content, fileName, fileMode, filePath, fileHandle);
      } else if (!isAuto) {
        await get().saveFileAs(content, fileName);
      }
    } catch (e) {
      console.error('Save file failed:', e);
      if (!isAuto && fileMode === 'local') {
        await get().saveFileAs(content, fileName);
      }
    } finally {
      set({ isSaving: false });
    }
  },

  newFile: () => {
    set({
      fileHandle: null,
      fileMode: 'local',
      content: '',
      fileName: 'Untitled',
      filePath: null,
      isDirty: false,
      lastExternalUpdate: Date.now(),
    });
    idbDel(DRAFT_KEY);
    idbDel(HANDLE_KEY);
    idbDel(NAME_KEY);
    idbDel(PATH_KEY);
    idbDel(MODE_KEY);
  },

  needsConfirmation: () => {
    const { isDirty, fileHandle, fileMode, content } = get();
    return isDirty && !fileHandle && fileMode === 'local' && content.trim() !== '';
  },

  updateContent: (newContent) => {
    const currentContent = get().content;
    if (newContent !== currentContent) {
      set({ content: newContent, isDirty: true });
      idbSet(DRAFT_KEY, newContent);
    }
  },

  initializeEditor: async () => {
    try {
      const savedContent = await idbGet(DRAFT_KEY);
      const savedHandle = await idbGet(HANDLE_KEY);
      const savedName = await idbGet(NAME_KEY);
      const savedPath = await idbGet(PATH_KEY);
      const savedMode = await idbGet(MODE_KEY) as FileMode;
      const savedAutosave = localStorage.getItem(AUTOSAVE_KEY);

      if (savedContent !== undefined) set({ content: savedContent });
      if (savedName) set({ fileName: savedName });
      if (savedPath) set({ filePath: savedPath });
      if (savedMode) set({ fileMode: savedMode });
      if (savedAutosave !== null) set({ autosaveEnabled: savedAutosave === 'true' });

      if (savedMode === 'local' && savedHandle) {
        set({ fileHandle: savedHandle, fileName: savedHandle.name });
        await get().checkPermission(savedHandle);
      } else if (savedMode === 'remote') {
        set({ hasWritePermission: true }); 
      }
      set({ lastExternalUpdate: Date.now() });
    } catch (e) {
      console.error('Failed to load draft:', e);
    } finally {
      set({ isLoading: false });
    }
  },
}));

// ============================================================================
// UI Store - Modal and UI state (not persisted)
// ============================================================================
interface UIState {
  theme: Theme;
  isSourceMode: boolean;
  isMenuOpen: boolean;
  showHelp: boolean;
  showSshConnect: boolean;
  showRemoteBrowser: boolean;
  showOpenDropdown: boolean;
  showSaveDropdown: boolean;
  remoteBrowserMode: FileBrowserMode;
  confirmAction: (() => void) | null;
  confirmMessage: string;
}

interface UIActions {
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setIsSourceMode: (mode: boolean) => void;
  toggleSourceMode: () => void;
  setIsMenuOpen: (open: boolean) => void;
  toggleMenu: () => void;
  setShowHelp: (show: boolean) => void;
  setShowSshConnect: (show: boolean) => void;
  setShowRemoteBrowser: (show: boolean) => void;
  setShowOpenDropdown: (show: boolean) => void;
  setShowSaveDropdown: (show: boolean) => void;
  setRemoteBrowserMode: (mode: FileBrowserMode) => void;
  setConfirmAction: (action: (() => void) | null, message?: string) => void;
  closeAllModals: () => void;
}

type UIStore = UIState & UIActions;

const initialUIState: UIState = {
  theme: 'dark',
  isSourceMode: false,
  isMenuOpen: false,
  showHelp: false,
  showSshConnect: false,
  showRemoteBrowser: false,
  showOpenDropdown: false,
  showSaveDropdown: false,
  remoteBrowserMode: 'open',
  confirmAction: null,
  confirmMessage: '',
};

export const useUIStore = create<UIStore>((set) => ({
  ...initialUIState,
  
  setTheme: (theme) => set({ theme }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
  setIsSourceMode: (isSourceMode) => set({ isSourceMode }),
  toggleSourceMode: () => set((state) => ({ isSourceMode: !state.isSourceMode })),
  setIsMenuOpen: (isMenuOpen) => set({ isMenuOpen }),
  toggleMenu: () => set((state) => ({ isMenuOpen: !state.isMenuOpen })),
  setShowHelp: (showHelp) => set({ showHelp }),
  setShowSshConnect: (showSshConnect) => set({ showSshConnect }),
  setShowRemoteBrowser: (showRemoteBrowser) => set({ showRemoteBrowser }),
  setShowOpenDropdown: (showOpenDropdown) => set({ showOpenDropdown }),
  setShowSaveDropdown: (showSaveDropdown) => set({ showSaveDropdown }),
  setRemoteBrowserMode: (remoteBrowserMode) => set({ remoteBrowserMode }),
  setConfirmAction: (confirmAction: (() => void) | null, confirmMessage: string = '') => set({ confirmAction, confirmMessage }),
  closeAllModals: () => set({
    showHelp: false,
    showSshConnect: false,
    showRemoteBrowser: false,
    showOpenDropdown: false,
    showSaveDropdown: false,
    isMenuOpen: false,
    confirmAction: null,
    confirmMessage: '',
  }),
}));

// ============================================================================
// Connection Store - SSH connection state (persisted in localStorage)
// ============================================================================
interface ConnectionState {
  sessionId: string | null;
  connectedMachineName: string | null;
  machines: Array<{
    machineName: string;
    host: string;
    port?: number;
    username: string;
    // Note: We don't store passwords/keys in localStorage for security
  }>;
}

interface ConnectionActions {
  setSessionId: (sessionId: string | null) => void;
  setConnectedMachineName: (name: string | null) => void;
  addMachine: (machine: { machineName: string; host: string; port?: number; username: string }) => void;
  removeMachine: (machineName: string) => void;
  disconnect: () => void;
}

type ConnectionStore = ConnectionState & ConnectionActions;

const initialConnectionState: ConnectionState = {
  sessionId: null,
  connectedMachineName: null,
  machines: [],
};

export const useConnectionStore = create<ConnectionStore>()(
  persist(
    (set) => ({
      ...initialConnectionState,
      
      setSessionId: (sessionId) => set({ sessionId }),
      setConnectedMachineName: (connectedMachineName) => set({ connectedMachineName }),
      addMachine: (machine) => set((state) => {
        // Remove existing machine with same name/host
        const filtered = state.machines.filter(
          m => m.machineName !== machine.machineName && m.host !== machine.host
        );
        return { machines: [...filtered, machine] };
      }),
      removeMachine: (machineName) => set((state) => ({
        machines: state.machines.filter(m => m.machineName !== machineName),
      })),
      disconnect: () => set({
        sessionId: null,
        connectedMachineName: null,
      }),
    }),
    {
      name: 'mdit-connection-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Don't persist sessionId (it's temporary)
        machines: state.machines,
      }),
    }
  )
);

// ============================================================================
// Settings Store - User preferences (persisted in localStorage)
// ============================================================================
interface SettingsState {
  theme: Theme;
  autosaveEnabled: boolean;
}

interface SettingsActions {
  setTheme: (theme: Theme) => void;
  setAutosaveEnabled: (enabled: boolean) => void;
}

type SettingsStore = SettingsState & SettingsActions;

const initialSettingsState: SettingsState = {
  theme: 'dark',
  autosaveEnabled: true,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...initialSettingsState,
      
      setTheme: (theme) => set({ theme }),
      setAutosaveEnabled: (autosaveEnabled) => set({ autosaveEnabled }),
    }),
    {
      name: 'mdit-settings-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// ============================================================================
// Selectors
// ============================================================================

// Editor selectors
export const selectEditorContent = (state: EditorStore) => state.content;
export const selectFileInfo = (state: EditorStore) => ({
  name: state.fileName,
  path: state.filePath,
  mode: state.fileMode,
  handle: state.fileHandle,
});
export const selectIsDirty = (state: EditorStore) => state.isDirty;

// UI selectors
export const selectTheme = (state: SettingsStore) => state.theme;
export const selectIsSourceMode = (state: UIStore) => state.isSourceMode;

// Connection selectors
export const selectIsConnected = (state: ConnectionStore) => state.sessionId !== null;
export const selectConnectedMachine = (state: ConnectionStore) => state.connectedMachineName;

// Combined selectors
export const useIsConnected = () => useConnectionStore(selectIsConnected);
export const useTheme = () => useSettingsStore(selectTheme);
