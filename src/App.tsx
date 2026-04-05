import React, { useState } from 'react';
import { 
  FilePlus, 
  FolderOpen, 
  Save, 
  FileOutput, 
  Zap, 
  Code, 
  Eye, 
  HelpCircle, 
  Sun, 
  Moon, 
  Menu, 
  X,
  Server,
  HardDrive,
  LogOut
} from 'lucide-react';
import { useFile } from './hooks/useFile';
import { MilkdownEditor } from './components/MilkdownEditor';
import { SourceEditor } from './components/SourceEditor';
import { MarkdownHelp } from './components/MarkdownHelp';
import { ConfirmModal } from './components/ConfirmModal';
import { SshConnectModal } from './components/SshConnectModal';
import { RemoteFileBrowser } from './components/RemoteFileBrowser';
import { sshService } from './services/SshService';
import type { SshConfig } from './services/SshService';
import './styles/App.css';

const App: React.FC = () => {
  const [showHelp, setShowHelp] = useState(false);
  const [isSourceMode, setIsSourceMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState<string>('');
  const [showSshConnect, setShowSshConnect] = useState(false);
  const [showRemoteBrowser, setShowRemoteBrowser] = useState(false);
  const [isConnected, setIsConnected] = useState(sshService.isConnected());
  const [connectedMachine, setConnectedMachine] = useState<string | null>(sshService.getConnectedMachineName());

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('mdit_theme') as 'light' | 'dark') || 'dark';
  });

  const {
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
    saveFile,
    saveFileAs,
    newFile,
  } = useFile();

  // Apply theme to document
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mdit_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const toggleAutosave = () => {
    setAutosaveEnabled(prev => !prev);
  };

  const toggleSourceMode = () => {
    setIsSourceMode(prev => !prev);
  };

  const toggleMenu = () => {
    setIsMenuOpen(prev => !prev);
  };

  const handleNewFile = () => {
    if (needsConfirmation()) {
      setConfirmMessage("You have unsaved content in this untitled document. Are you sure you want to discard it and start a new file?");
      setConfirmAction(() => () => {
        newFile();
        setConfirmAction(null);
      });
    } else {
      newFile();
    }
    setIsMenuOpen(false);
  };

  const handleOpenFile = () => {
    if (needsConfirmation()) {
      setConfirmMessage("You have unsaved content in this untitled document. Are you sure you want to discard it and open a different file?");
      setConfirmAction(() => () => {
        openFile();
        setConfirmAction(null);
      });
    } else {
      openFile();
    }
    setIsMenuOpen(false);
  };

  const handleSshConnect = async (config: SshConfig) => {
    await sshService.connect(config);
    setIsConnected(true);
    setConnectedMachine(sshService.getConnectedMachineName());
    setShowSshConnect(false);
    setShowRemoteBrowser(true);
  };

  const handleSshDisconnect = async () => {
    await sshService.disconnect();
    setIsConnected(false);
    setConnectedMachine(null);
    if (fileMode === 'remote') {
      newFile();
    }
    setIsMenuOpen(false);
  };

  const handleRemoteFileSelect = async (path: string) => {
    if (needsConfirmation()) {
      setConfirmMessage("You have unsaved content. Are you sure you want to discard it and open a remote file?");
      setConfirmAction(() => () => {
        openRemoteFile(path);
        setShowRemoteBrowser(false);
        setConfirmAction(null);
      });
    } else {
      await openRemoteFile(path);
      setShowRemoteBrowser(false);
    }
    setIsMenuOpen(false);
  };

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (confirmAction || showSshConnect || showRemoteBrowser) return;

      const isMod = e.ctrlKey || e.metaKey;

      if (isMod && e.key === 's') {
        e.preventDefault();
        saveFile();
      } else if (isMod && e.key === 'o') {
        e.preventDefault();
        handleOpenFile();
      } else if (e.altKey && e.key === 'n') {
        e.preventDefault();
        handleNewFile();
      } else if (isMod && e.key === 'h') {
        e.preventDefault();
        setShowHelp(prev => !prev);
      } else if (isMod && e.key === 'l') {
        e.preventDefault();
        toggleTheme();
      } else if (isMod && e.key === 'a') {
        e.preventDefault();
        toggleAutosave();
      } else if (isMod && e.key === 'm') {
        e.preventDefault();
        toggleSourceMode();
      } else if (e.key === 'Escape') {
        setShowHelp(false);
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveFile, openFile, newFile, setAutosaveEnabled, needsConfirmation, confirmAction, showSshConnect, showRemoteBrowser]);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="file-info" title={filePath || fileName}>
          <div className="file-name-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span className="file-name" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {fileMode === 'remote' && <Server size={16} color="var(--c-aqua)" />}
              {fileName}
            </span>
            {fileMode === 'remote' && connectedMachine && (
              <span className="machine-info" style={{ fontSize: '11px', color: 'var(--gb-gray)', marginTop: '2px' }}>
                Connected to: {connectedMachine}
              </span>
            )}
          </div>
          <div className={`dirty-indicator ${isDirty ? 'visible' : ''}`} title="Unsaved changes" />
        </div>
        
        <button 
          className="menu-toggle-btn" 
          onClick={toggleMenu} 
          title="Toggle Menu"
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className={`actions ${isMenuOpen ? 'menu-open' : ''}`}>
          <button onClick={handleNewFile} title="New File (Alt+N)" className="icon-only">
            <FilePlus size={18} />
            <span className="label">New</span>
          </button>
          
          <button onClick={handleOpenFile} title="Open Local File (Ctrl+O)" className="icon-only">
            <FolderOpen size={18} />
            <span className="label">Open Local</span>
          </button>

          {!isConnected ? (
            <button onClick={() => { setShowSshConnect(true); setIsMenuOpen(false); }} title="Connect to Remote Server" className="icon-only">
              <Server size={18} />
              <span className="label">Connect Remote</span>
            </button>
          ) : (
            <>
              <button onClick={() => { setShowRemoteBrowser(true); setIsMenuOpen(false); }} title="Browse Remote Files" className="icon-only">
                <HardDrive size={18} color="var(--c-aqua)" />
                <span className="label">Open Remote</span>
              </button>
              <button onClick={handleSshDisconnect} title="Disconnect SSH" className="icon-only danger-btn">
                <LogOut size={18} />
                <span className="label">Disconnect</span>
              </button>
            </>
          )}

          <div className="menu-divider" />

          <button 
            onClick={() => { saveFile(); setIsMenuOpen(false); }} 
            className={`icon-only ${!isDirty ? 'saved' : ''}`}
            disabled={isSaving}
            title="Save (Ctrl+S)"
          >
            <Save size={18} />
            <span className="label">{isSaving ? 'Saving...' : !isDirty ? 'Saved' : 'Save'}</span>
          </button>
          
          <button onClick={() => { saveFileAs(); setIsMenuOpen(false); }} title="Save As" className="icon-only">
            <FileOutput size={18} />
            <span className="label">Save As</span>
          </button>
          
          <button
            onClick={toggleAutosave}
            className={`icon-only ${autosaveEnabled && filePath && hasWritePermission ? 'active' : ''}`}
            style={autosaveEnabled && filePath && !hasWritePermission ? { borderColor: 'var(--c-orange)', color: 'var(--c-orange)' } : {}}
            title="Toggle Auto-save (Ctrl+A)"
          >
            <Zap size={18} fill={autosaveEnabled && filePath && hasWritePermission ? "currentColor" : "none"} />
            <span className="label">Autosave</span>
          </button>

          <div className="menu-divider" />

          <button
            onClick={() => { toggleSourceMode(); setIsMenuOpen(false); }}
            className={`icon-only ${isSourceMode ? 'active' : ''}`}
            title="Toggle Source Mode (Ctrl+M)"
          >
            {isSourceMode ? <Eye size={18} /> : <Code size={18} />}
            <span className="label">{isSourceMode ? 'Markdown' : 'Source'}</span>
          </button>
          
          <button onClick={() => { setShowHelp(true); setIsMenuOpen(false); }} title="Help (Ctrl+H)" className="icon-only">
            <HelpCircle size={18} />
            <span className="label">Help</span>
          </button>
          
          <button className="theme-toggle icon-only" onClick={() => { toggleTheme(); setIsMenuOpen(false); }} title="Toggle Theme (Ctrl+L)">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </header>

      <main className="editor-container">
        {isLoading ? (
           <div className="loading-overlay">Loading MDit v2...</div>
        ) : isSourceMode ? (
          <SourceEditor content={content} onChange={updateContent} />
        ) : (
          <MilkdownEditor 
            content={content} 
            onChange={updateContent} 
            forceSync={lastExternalUpdate}
          />
        )}
      </main>

      {showHelp && <MarkdownHelp onClose={() => setShowHelp(false)} />}
      
      {showSshConnect && (
        <SshConnectModal 
          onConnect={handleSshConnect} 
          onClose={() => setShowSshConnect(false)} 
        />
      )}

      {showRemoteBrowser && (
        <RemoteFileBrowser 
          onFileSelect={handleRemoteFileSelect} 
          onClose={() => setShowRemoteBrowser(false)} 
        />
      )}

      {confirmAction && (
        <ConfirmModal 
          message={confirmMessage} 
          onConfirm={confirmAction} 
          onCancel={() => setConfirmAction(null)} 
        />
      )}
    </div>
  );
};

export default App;
