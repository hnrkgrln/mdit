import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Theme } from '../types';

export interface SettingsState {
  theme: Theme;
  autosaveEnabled: boolean;
}

export interface SettingsActions {
  setTheme: (theme: Theme) => void;
  setAutosaveEnabled: (enabled: boolean) => void;
}

export type SettingsStore = SettingsState & SettingsActions;

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
