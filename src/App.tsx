import React, { useState } from 'react';
import { useFile } from './hooks/useFile';
import { MilkdownEditor } from './components/MilkdownEditor';
import { SourceEditor } from './components/SourceEditor';
import { MarkdownHelp } from './components/MarkdownHelp';
import './styles/App.css';

const App: React.FC = () => {
  const [showHelp, setShowHelp] = useState(false);
  const [isSourceMode, setIsSourceMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('mdit_theme') as 'light' | 'dark') || 'dark';
  });

  const {
    content,
    fileName,
    filePath,
    isDirty,
    isSaving,
    isLoading,
    lastExternalUpdate,
    autosaveEnabled,
    setAutosaveEnabled,
    updateContent,
    openFile,
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

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;

      if (isMod && e.key === 's') {
        e.preventDefault();
        saveFile();
      } else if (isMod && e.key === 'o') {
        e.preventDefault();
        openFile();
      } else if (isMod && e.key === 'n') {
        e.preventDefault();
        newFile();
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
  }, [saveFile, openFile, newFile, setAutosaveEnabled]);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="file-info">
          <span className="file-name">{fileName}</span>
          <div className={`dirty-indicator ${isDirty ? 'visible' : ''}`} title="Unsaved changes" />
        </div>
        
        <button 
          className="menu-toggle-btn" 
          onClick={toggleMenu} 
          title="Toggle Menu"
        >
          {isMenuOpen ? '✕' : '☰'}
        </button>

        <div className={`actions ${isMenuOpen ? 'menu-open' : ''}`}>
          <button onClick={() => { newFile(); setIsMenuOpen(false); }}>New</button>
          <button onClick={() => { openFile(); setIsMenuOpen(false); }}>Open</button>
          <button 
            onClick={() => { saveFile(); setIsMenuOpen(false); }} 
            className={!isDirty ? 'saved' : ''}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : !isDirty ? 'Saved' : 'Save'}
          </button>
          <button onClick={() => { saveFileAs(); setIsMenuOpen(false); }}>Save As</button>
          
          <button 
            onClick={toggleAutosave} 
            className={autosaveEnabled && filePath ? 'active' : ''}
            title="Toggle Auto-save (Ctrl+A)"
          >
            Auto-save: {autosaveEnabled && filePath ? 'ON' : 'OFF'}
          </button>

          <button 
            onClick={() => { toggleSourceMode(); setIsMenuOpen(false); }}
            className={isSourceMode ? 'active' : ''}
            title="Toggle Source Mode (Ctrl+M)"
          >
            {isSourceMode ? 'WYSIWYG' : 'Source'}
          </button>

          <button onClick={() => { setShowHelp(true); setIsMenuOpen(false); }}>Help</button>
          <button className="theme-toggle" onClick={() => { toggleTheme(); setIsMenuOpen(false); }} title="Toggle Theme (Ctrl+L)">
            {theme === 'light' ? '🌑' : '☀️'}
          </button>
        </div>
      </header>

      <main className="editor-container">
        {isLoading ? (
           <div className="loading-overlay">Initializing MDit...</div>
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
    </div>
  );
};

export default App;
