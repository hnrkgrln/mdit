import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { useEditorStore, useUIStore, useConnectionStore } from './store';
import { sshService } from './services/SshService';
import { useFile } from './hooks/useFile';
import { useKeyboardShortcuts, useClickOutside } from './hooks';
import { Header } from './components/Header';
import { EditorArea } from './components/EditorArea';
import { MarkdownHelp } from './components/MarkdownHelp';
import { ConfirmModal } from './components/ConfirmModal';
import { SshConnectModal } from './components/SshConnectModal';
import { RemoteFileBrowser } from './components/RemoteFileBrowser';
import { ErrorBoundary } from './components/ErrorBoundary';
import type { SshConfig } from './types';
import './styles/App.css';

const App: React.FC = () => {
  // Refs
  const saveDropdownRef = useRef<HTMLDivElement>(null);
  const openDropdownRef = useRef<HTMLDivElement>(null);

  // Get state from stores
  const {
    content,
    fileName,
    filePath,
    fileMode,
    isDirty,
    isSaving,
    isLoading,
    autosaveEnabled,
    lastExternalUpdate,
    setContent,
    setIsDirty,
    setAutosaveEnabled,
    resetEditor,
  } = useEditorStore();

  const {
    theme,
    isSourceMode,
    isMenuOpen,
    showHelp,
    showSshConnect,
    showRemoteBrowser,
    showOpenDropdown,
    showSaveDropdown,
    remoteBrowserMode,
    confirmAction,
    confirmMessage,
    toggleTheme,
    toggleSourceMode,
    toggleMenu,
    setShowHelp,
    setShowSshConnect,
    setShowRemoteBrowser,
    setShowOpenDropdown,
    setShowSaveDropdown,
    setRemoteBrowserMode,
    setConfirmAction,
    closeAllModals,
  } = useUIStore();

  const {
    sessionId,
    connectedMachineName,
    setSessionId,
    setConnectedMachineName,
    disconnect: disconnectStore,
  } = useConnectionStore();

  // Sync store with sshService
  const isConnected = sshService.isConnected();
  const connectedMachine = sshService.getConnectedMachineName();

  // Get file operations from useFile hook
  const {
    openFile,
    openRemoteFile,
    saveRemoteFileAs,
    saveFile,
    saveFileAs,
    newFile: newFileHook,
    needsConfirmation,
    updateContent,
  } = useFile();

  // Sync useFile state with store
  useEffect(() => {
    if (content !== useEditorStore.getState().content) {
      setContent(content);
    }
  }, [content, setContent]);

  // Handler functions - defined before hooks that use them
  const handleNewFile = useCallback(() => {
    if (needsConfirmation()) {
      setConfirmMessage("You have unsaved content in this untitled document. Are you sure you want to discard it and start a new file?");
      setConfirmAction(() => () => {
        newFileHook();
        resetEditor();
        setConfirmAction(null, '');
      });
    } else {
      newFileHook();
      resetEditor();
    }
    setShowHelp(false);
    setShowSshConnect(false);
    setShowRemoteBrowser(false);
    setIsMenuOpen(false);
  }, [needsConfirmation, newFileHook, resetEditor, setConfirmAction, setShowHelp, setShowSshConnect, setShowRemoteBrowser, setIsMenuOpen]);

  const handleOpenFileLocal = useCallback(() => {
    if (needsConfirmation()) {
      setConfirmMessage("You have unsaved content in this untitled document. Are you sure you want to discard it and open a different file?");
      setConfirmAction(() => () => {
        openFile();
        setConfirmAction(null, '');
      });
    } else {
      openFile();
    }
    setShowOpenDropdown(false);
    setIsMenuOpen(false);
  }, [needsConfirmation, openFile, setConfirmAction, setShowOpenDropdown, setIsMenuOpen]);

  const handleOpenRemote = useCallback(() => {
    setRemoteBrowserMode('open');
    if (isConnected) {
      setShowRemoteBrowser(true);
    } else {
      setShowSshConnect(true);
    }
    setShowOpenDropdown(false);
    setIsMenuOpen(false);
  }, [isConnected, setRemoteBrowserMode, setShowRemoteBrowser, setShowSshConnect, setShowOpenDropdown, setIsMenuOpen]);

  const handleSave = useCallback(async () => {
    if (!filePath) {
      setShowSaveDropdown(true);
    } else {
      try {
        await saveFile();
      } catch (err: any) {
        if (err.message.includes('Not connected')) {
          setShowSshConnect(true);
        } else {
          console.error('Save failed:', err);
        }
      }
    }
    setIsMenuOpen(false);
  }, [filePath, saveFile, setShowSaveDropdown, setShowSshConnect, setIsMenuOpen]);

  const handleSaveLocalAs = useCallback(() => {
    saveFileAs();
    setShowSaveDropdown(false);
  }, [saveFileAs, setShowSaveDropdown]);

  const handleSaveRemoteAs = useCallback(() => {
    setRemoteBrowserMode('save');
    if (isConnected) {
      setShowRemoteBrowser(true);
    } else {
      setShowSshConnect(true);
    }
    setShowSaveDropdown(false);
  }, [isConnected, setRemoteBrowserMode, setShowRemoteBrowser, setShowSshConnect, setShowSaveDropdown]);

  const handleSshConnect = useCallback(async (config: SshConfig) => {
    try {
      await sshService.connect(config);
      setConnectedMachineName(sshService.getConnectedMachineName());
      setSessionId(sshService.getSessionId());
      setShowSshConnect(false);
      setShowRemoteBrowser(true);
    } catch (error) {
      console.error('SSH connection failed:', error);
    }
  }, [setConnectedMachineName, setSessionId, setShowSshConnect, setShowRemoteBrowser]);

  const handleSshDisconnect = useCallback(async () => {
    await sshService.disconnect();
    disconnectStore();
    if (fileMode === 'remote') {
      newFileHook();
      resetEditor();
    }
    setIsMenuOpen(false);
  }, [disconnectStore, fileMode, newFileHook, resetEditor, setIsMenuOpen]);

  const handleRemoteFileAction = useCallback(async (path: string) => {
    if (remoteBrowserMode === 'open') {
      if (needsConfirmation()) {
        setConfirmMessage("You have unsaved content. Are you sure you want to discard it and open a remote file?");
        setConfirmAction(() => () => {
          openRemoteFile(path);
          setShowRemoteBrowser(false);
          setConfirmAction(null, '');
        });
      } else {
        await openRemoteFile(path);
        setShowRemoteBrowser(false);
      }
    } else {
      await saveRemoteFileAs(content, path);
      setShowRemoteBrowser(false);
    }
    setIsMenuOpen(false);
  }, [content, needsConfirmation, openRemoteFile, remoteBrowserMode, saveRemoteFileAs, setConfirmAction, setIsMenuOpen, setShowRemoteBrowser]);

  const handleContentChange = useCallback((newContent: string) => {
    updateContent(newContent);
    setContent(newContent);
    if (newContent !== useEditorStore.getState().content) {
      setIsDirty(true);
    }
  }, [updateContent, setContent, setIsDirty]);

  const handleOpen = useCallback(() => {
    if (fileMode === 'remote') {
      handleOpenRemote();
    } else {
      handleOpenFileLocal();
    }
    setIsMenuOpen(false);
  }, [fileMode, handleOpenRemote, handleOpenFileLocal, setIsMenuOpen]);

  // Click outside handler for dropdowns
  useClickOutside(
    [saveDropdownRef, openDropdownRef],
    () => {
      setShowSaveDropdown(false);
      setShowOpenDropdown(false);
    }
  );

  // Keyboard shortcuts
  const handleKeyboardAction = useCallback((action: string) => {
    switch (action) {
      case 'new':
        handleNewFile();
        break;
      case 'open':
        setShowOpenDropdown(true);
        break;
      case 'save':
        handleSave();
        break;
      case 'toggleSource':
        toggleSourceMode();
        break;
      case 'toggleTheme':
        toggleTheme();
        break;
      case 'toggleAutosave':
        setAutosaveEnabled(!autosaveEnabled);
        break;
      case 'help':
        setShowHelp(true);
        break;
      case 'close':
        closeAllModals();
        setIsMenuOpen(false);
        break;
    }
  }, [
    handleNewFile,
    handleSave,
    toggleSourceMode,
    toggleTheme,
    autosaveEnabled,
    setAutosaveEnabled,
    setShowHelp,
    closeAllModals,
    setIsMenuOpen,
    setShowOpenDropdown,
  ]);

  useKeyboardShortcuts({
    onAction: handleKeyboardAction,
    disabled: !!confirmAction || showSshConnect || showRemoteBrowser || showOpenDropdown || showSaveDropdown,
  });

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mdit_theme', theme);
  }, [theme]);

  // Initialize sshService with store values
  useEffect(() => {
    if (sessionId && connectedMachineName) {
      // This is a bit of a hack - we need to sync the singleton
      // In a better architecture, we'd inject the service
    }
  }, [sessionId, connectedMachineName]);

  return (
    <div className="app-container">
      <Header
        fileName={fileName}
        filePath={filePath}
        fileMode={fileMode}
        connectedMachine={connectedMachine}
        isDirty={isDirty}
        isSaving={isSaving}
        isMenuOpen={isMenuOpen}
        autosaveEnabled={autosaveEnabled}
        isConnected={isConnected}
        theme={theme}
        isSourceMode={isSourceMode}
        showOpenDropdown={showOpenDropdown}
        showSaveDropdown={showSaveDropdown}
        onToggleMenu={toggleMenu}
        onNewFile={handleNewFile}
        onOpen={handleOpen}
        onOpenFileLocal={handleOpenFileLocal}
        onOpenRemote={handleOpenRemote}
        onSave={handleSave}
        onSaveLocalAs={handleSaveLocalAs}
        onSaveRemoteAs={handleSaveRemoteAs}
        onToggleSourceMode={toggleSourceMode}
        onToggleTheme={toggleTheme}
        onToggleAutosave={() => setAutosaveEnabled(!autosaveEnabled)}
        onSshDisconnect={handleSshDisconnect}
        onShowHelp={() => { setShowHelp(true); toggleMenu(); }}
        onToggleOpenDropdown={() => setShowOpenDropdown(!showOpenDropdown)}
        onToggleSaveDropdown={() => setShowSaveDropdown(!showSaveDropdown)}
        openDropdownRef={openDropdownRef}
        saveDropdownRef={saveDropdownRef}
      />

      <ErrorBoundary
        onError={(error) => {
          console.error('Editor error:', error);
        }}
      >
        <EditorArea
          isLoading={isLoading}
          isSourceMode={isSourceMode}
          content={content}
          fileMode={fileMode}
          lastExternalUpdate={lastExternalUpdate}
          onChange={handleContentChange}
        />
      </ErrorBoundary>

      {/* Modals */}
      {showHelp && <MarkdownHelp onClose={() => setShowHelp(false)} />}
      
      {showSshConnect && (
        <SshConnectModal 
          onConnect={handleSshConnect} 
          onClose={() => setShowSshConnect(false)}
        />
      )}

      {showRemoteBrowser && (
        <RemoteFileBrowser 
          mode={remoteBrowserMode}
          onFileSelect={handleRemoteFileAction} 
          onClose={() => setShowRemoteBrowser(false)} 
          suggestedName={fileName}
        />
      )}

      {confirmAction && (
        <ConfirmModal 
          message={confirmMessage} 
          onConfirm={confirmAction} 
          onCancel={() => setConfirmAction(null, '')}
        />
      )}
    </div>
  );
};

export default App;
