/**
 * Zustand Store - Centralized state management for MDit
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Theme, FileMode, FileBrowserMode } from '../types';

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

export const useEditorStore = create<EditorStore>((set) => ({
  ...initialEditorState,
  
  setContent: (content) => set({ content, isDirty: true }),
  setFileName: (fileName) => set({ fileName }),
  setFilePath: (filePath) => set({ filePath }),
  setFileMode: (fileMode) => set({ fileMode }),
  setIsDirty: (isDirty) => set({ isDirty }),
  setIsSaving: (isSaving) => set({ isSaving }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setHasWritePermission: (hasWritePermission) => set({ hasWritePermission }),
  setAutosaveEnabled: (autosaveEnabled) => set({ autosaveEnabled }),
  setLastExternalUpdate: (lastExternalUpdate) => set({ lastExternalUpdate }),
  setFileHandle: (fileHandle) => set({ fileHandle }),
  
  resetEditor: () => set({ ...initialEditorState, isLoading: false }),
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
export const selectTheme = (state: UIStore) => state.theme;
export const selectIsSourceMode = (state: UIStore) => state.isSourceMode;

// Connection selectors
export const selectIsConnected = (state: ConnectionStore) => state.sessionId !== null;
export const selectConnectedMachine = (state: ConnectionStore) => state.connectedMachineName;

// Combined selectors
export const useIsConnected = () => useConnectionStore(selectIsConnected);
export const useTheme = () => useSettingsStore(selectTheme);
