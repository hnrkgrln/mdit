export * from './useEditorStore';
export * from './useUIStore';
export * from './useConnectionStore';
export * from './useSettingsStore';

import { useEditorStore } from './useEditorStore';
import { useUIStore } from './useUIStore';
import { useConnectionStore } from './useConnectionStore';
import { useSettingsStore } from './useSettingsStore';

// Editor selectors
export const selectEditorContent = (state: ReturnType<typeof useEditorStore.getState>) => state.content;
export const selectFileInfo = (state: ReturnType<typeof useEditorStore.getState>) => ({
  name: state.fileName,
  path: state.filePath,
  mode: state.fileMode,
  handle: state.fileHandle,
});
export const selectIsDirty = (state: ReturnType<typeof useEditorStore.getState>) => state.isDirty;

// UI selectors
export const selectTheme = (state: ReturnType<typeof useSettingsStore.getState>) => state.theme;
export const selectIsSourceMode = (state: ReturnType<typeof useUIStore.getState>) => state.isSourceMode;

// Connection selectors
export const selectIsConnected = (state: ReturnType<typeof useConnectionStore.getState>) => state.sessionId !== null;
export const selectConnectedMachine = (state: ReturnType<typeof useConnectionStore.getState>) => state.connectedMachineName;

// Combined selectors
export const useIsConnected = () => useConnectionStore(selectIsConnected);
export const useTheme = () => useSettingsStore(selectTheme);
