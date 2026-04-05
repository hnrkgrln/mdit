import React, { useState, useEffect, useMemo } from 'react';
import { sshService } from '../services/SshService';
import type { RemoteEntry } from '../services/SshService';
import { X, Folder, FileText, ChevronLeft, HardDrive, Search } from 'lucide-react';

interface RemoteFileBrowserProps {
  onFileSelect: (path: string) => void;
  onClose: () => void;
}

export const RemoteFileBrowser: React.FC<RemoteFileBrowserProps> = ({ onFileSelect, onClose }) => {
  const [currentPath, setCurrentPath] = useState('.');
  const [entries, setEntries] = useState<RemoteEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchEntries = async (path: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await sshService.listDirectory(path);
      setEntries(list);
      setCurrentPath(path);
      setSearchQuery(''); // Clear search when changing directories
    } catch (err: any) {
      setError(err.message || 'Failed to list directory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries('.');
  }, []);

  const handleEntryClick = (entry: RemoteEntry) => {
    const newPath = currentPath === '.' ? entry.name : `${currentPath}/${entry.name}`;
    if (entry.isDirectory) {
      fetchEntries(newPath);
    } else if (entry.name.endsWith('.md')) {
      onFileSelect(newPath);
    }
  };

  const handleBack = () => {
    if (currentPath === '.') return;
    const parts = currentPath.split('/');
    parts.pop();
    const parentPath = parts.length === 0 ? '.' : parts.join('/');
    fetchEntries(parentPath);
  };

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const query = searchQuery.toLowerCase();
    return entries.filter(entry => 
      entry.name.toLowerCase().includes(query)
    );
  }, [entries, searchQuery]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content confirm-modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <HardDrive size={20} />
            <h3 style={{ margin: 0 }}>Remote Files</h3>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <div style={{ padding: '15px 20px', background: 'var(--header-bg)', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              onClick={handleBack} 
              disabled={currentPath === '.'}
              style={{ padding: '5px 10px', height: 'auto', minWidth: 'auto', background: 'transparent' }}
            >
              <ChevronLeft size={20} />
            </button>
            <span style={{ fontSize: '14px', color: 'var(--gb-gray)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {currentPath}
            </span>
          </div>
          
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gb-gray)', pointerEvents: 'none' }}>
              <Search size={16} />
            </div>
            <input 
              type="text"
              placeholder="Search files and folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '8px 10px 8px 35px', 
                background: 'var(--bg-color)', 
                border: '1px solid var(--border-color)', 
                borderRadius: '4px', 
                color: 'var(--text-color)',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        <div className="modal-body" style={{ padding: '0', maxHeight: '400px', overflowY: 'auto' }}>
          {isLoading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
          ) : error ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--c-red)' }}>{error}</div>
          ) : (
            <div className="entry-list">
              {filteredEntries.map((entry) => (
                <div 
                  key={entry.name}
                  onClick={() => handleEntryClick(entry)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    padding: '12px 20px', 
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border-color)',
                    transition: 'background 0.2s',
                    opacity: !entry.isDirectory && !entry.name.endsWith('.md') ? 0.5 : 1,
                    pointerEvents: !entry.isDirectory && !entry.name.endsWith('.md') ? 'none' : 'auto'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(146, 131, 116, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {entry.isDirectory ? <Folder size={18} color="var(--c-yellow)" /> : <FileText size={18} color="var(--c-blue)" />}
                  <span style={{ flex: 1, textAlign: 'left' }}>{entry.name}</span>
                  {!entry.isDirectory && <span style={{ fontSize: '12px', color: 'var(--gb-gray)' }}>{(entry.size / 1024).toFixed(1)} KB</span>}
                </div>
              ))}
              {filteredEntries.length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gb-gray)' }}>
                  {searchQuery ? `No results for "${searchQuery}"` : 'No items found'}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="modal-footer" style={{ padding: '15px 20px' }}>
          <button className="cancel-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};
