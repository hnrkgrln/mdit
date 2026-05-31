import React from 'react';
import {
  FilePlus,
  FolderOpen,
  Save,
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
  ChevronDown
} from 'lucide-react';
import type { FileMode } from '../types';

interface HeaderProps {
  fileName: string;
  filePath: string | null;
  fileMode: FileMode;
  connectedMachine: string | null;
  isDirty: boolean;
  isSaving: boolean;
  isMenuOpen: boolean;
  autosaveEnabled: boolean;
  isConnected: boolean;
  theme: 'light' | 'dark';
  isSourceMode: boolean;
  showOpenDropdown: boolean;
  showSaveDropdown: boolean;
  onToggleMenu: () => void;
  onNewFile: () => void;
  onOpen: () => void;
  onOpenFileLocal: () => void;
  onOpenRemote: () => void;
  onSave: () => void;
  onSaveLocalAs: () => void;
  onSaveRemoteAs: () => void;
  onToggleSourceMode: () => void;
  onToggleTheme: () => void;
  onToggleAutosave: () => void;
  onSshDisconnect: () => void;
  onShowHelp: () => void;
  onToggleOpenDropdown: () => void;
  onToggleSaveDropdown: () => void;
  openDropdownRef: React.RefObject<HTMLDivElement> | null;
  saveDropdownRef: React.RefObject<HTMLDivElement> | null;
}

export const Header: React.FC<HeaderProps> = ({
  fileName,
  filePath,
  fileMode,
  connectedMachine,
  isDirty,
  isSaving,
  isMenuOpen,
  autosaveEnabled,
  isConnected,
  theme,
  isSourceMode,
  showOpenDropdown,
  showSaveDropdown,
  onToggleMenu,
  onNewFile,
  onOpen,
  onOpenFileLocal,
  onOpenRemote,
  onSave,
  onSaveLocalAs,
  onSaveRemoteAs,
  onToggleSourceMode,
  onToggleTheme,
  onToggleAutosave,
  onSshDisconnect,
  onShowHelp,
  onToggleOpenDropdown,
  onToggleSaveDropdown,
  openDropdownRef,
  saveDropdownRef,
}) => {
  return (
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

      {isConnected && (
        <div className="connection-status">
          <div className="connection-pill">
            <Server size={14} color="var(--c-aqua)" />
            <span className="machine-name">{connectedMachine}</span>
            <button 
              onClick={onSshDisconnect} 
              className="disconnect-btn"
              title={`Disconnect from ${connectedMachine}`}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
      
      <button 
        className="menu-toggle-btn" 
        onClick={onToggleMenu} 
        title="Toggle Menu"
      >
        {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <div className={`actions ${isMenuOpen ? 'menu-open' : ''}`}>
        <button onClick={onNewFile} title="New File (Ctrl+Shift+N)" className="icon-only">
          <FilePlus size={18} />
          <span className="label">New</span>
        </button>
        
        {/* Unified Open Button with Dropdown */}
        <div className="split-button-container" ref={openDropdownRef}>
          <div style={{ display: 'flex', gap: '2px' }}>
            <button 
              onClick={onOpen} 
              className="icon-only"
              title="Open (Ctrl+O)"
              style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
            >
              <FolderOpen size={18} />
              <span className="label">Open</span>
            </button>
            <button 
              onClick={onToggleOpenDropdown}
              title="Open Options"
              className="icon-only"
              style={{ minWidth: '24px !important', width: '24px', borderTopLeftRadius: 0, borderBottomLeftRadius: 0, padding: 0 }}
            >
              <ChevronDown size={14} />
            </button>
          </div>

          {showOpenDropdown && (
            <div className="dropdown-menu">
              <button onClick={onOpenFileLocal}>
                <FolderOpen size={16} />
                <span>Local...</span>
              </button>
              <button onClick={onOpenRemote}>
                {isConnected ? (
                  <HardDrive size={16} color="var(--c-aqua)" />
                ) : (
                  <Server size={16} />
                )}
                <span>Remote...</span>
              </button>
            </div>
          )}
        </div>

        <div className="menu-divider" />

        {/* Unified Save Button with Dropdown */}
        <div className="split-button-container" ref={saveDropdownRef}>
          <div style={{ display: 'flex', gap: '2px' }}>
            <button 
              onClick={onSave} 
              className={`icon-only ${!isDirty ? 'saved' : ''}`}
              disabled={isSaving}
              title={`Save (Ctrl+S)${autosaveEnabled ? ' - Auto-save ON' : ''}`}
              style={{ position: 'relative', borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
            >
              <Save size={18} />
              {autosaveEnabled && filePath && (
                <div style={{ position: 'absolute', top: '6px', right: '6px', width: '6px', height: '6px', background: 'var(--c-aqua)', borderRadius: '50%' }} />
              )}
              <span className="label">{isSaving ? 'Saving...' : !isDirty ? 'Saved' : 'Save'}</span>
            </button>
            <button 
              onClick={onToggleSaveDropdown}
              title="Save Options"
              className="icon-only"
              style={{ minWidth: '24px !important', width: '24px', borderTopLeftRadius: 0, borderBottomLeftRadius: 0, padding: 0 }}
            >
              <ChevronDown size={14} />
            </button>
          </div>

          {showSaveDropdown && (
            <div className="dropdown-menu">
              <button onClick={onSaveLocalAs}>
                <FolderOpen size={16} />
                <span>Local...</span>
              </button>
              <button onClick={onSaveRemoteAs}>
                {isConnected ? (
                  <HardDrive size={16} color="var(--c-aqua)" />
                ) : (
                  <Server size={16} />
                )}
                <span>Remote...</span>
              </button>
              <div className="dropdown-divider" />
              <button onClick={onToggleAutosave} className={autosaveEnabled ? 'active' : ''}>
                <Zap size={16} fill={autosaveEnabled ? "currentColor" : "none"} />
                <span>Auto-save: {autosaveEnabled ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          )}
        </div>

        <div className="menu-divider" />

        <button
          onClick={onToggleSourceMode}
          className={`icon-only ${isSourceMode ? 'active' : ''}`}
          title="Toggle Source Mode (Ctrl+M)"
        >
          {isSourceMode ? <Eye size={18} /> : <Code size={18} />}
          <span className="label">{isSourceMode ? 'Markdown' : 'Source'}</span>
        </button>
        
        <button onClick={onShowHelp} title="Help (Ctrl+H)" className="icon-only round-icon">
          <HelpCircle size={18} />
        </button>

        <button className="theme-toggle icon-only round-icon" onClick={onToggleTheme} title="Toggle Theme (Ctrl+Shift+L)">
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

      </div>
    </header>
  );
};
