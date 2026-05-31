// File and Editor Types
export type FileMode = 'local' | 'remote';

export interface FileData {
  handle: FileSystemFileHandle | null;
  content: string;
  name: string;
  path?: string;
}

// SSH Types
export interface RemoteEntry {
  name: string;
  isDirectory: boolean;
  size: number;
  mtime: number;
}

export interface SshConfig {
  machineName?: string;
  host: string;
  port?: number;
  username: string;
  password?: string;
  privateKey?: string;
  passphrase?: string;
}

// API Types
export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  error?: string;
}

export interface ApiError {
  error: string;
}

// Connection Types
export interface ConnectionStatus {
  isConnected: boolean;
  machineName: string | null;
  sessionId: string | null;
}

// Editor Types
export interface EditorState {
  content: string;
  fileName: string;
  filePath: string | null;
  fileMode: FileMode;
  isDirty: boolean;
  isSaving: boolean;
  isLoading: boolean;
  hasWritePermission: boolean;
  autosaveEnabled: boolean;
}

// UI Types
export interface ModalState {
  showHelp: boolean;
  showSshConnect: boolean;
  showRemoteBrowser: boolean;
  showOpenDropdown: boolean;
  showSaveDropdown: boolean;
  confirmAction: (() => void) | null;
  confirmMessage: string;
}

// Theme Types
export type Theme = 'light' | 'dark';

// File Browser Types
export type FileBrowserMode = 'open' | 'save';

// Keyboard shortcut actions
export type KeyboardAction = 
  | 'new'
  | 'open'
  | 'openLocal'
  | 'openRemote'
  | 'save'
  | 'saveLocal'
  | 'saveRemote'
  | 'toggleSource'
  | 'toggleTheme'
  | 'toggleAutosave'
  | 'help'
  | 'close';
