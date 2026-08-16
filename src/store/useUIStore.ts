import { create } from 'zustand';
import type { Theme, FileBrowserMode } from '../types';

export interface UIState {
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

export interface UIActions {
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

export type UIStore = UIState & UIActions;

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
