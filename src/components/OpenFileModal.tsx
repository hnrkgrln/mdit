import React from 'react';
import { X, FolderOpen, HardDrive, Server } from 'lucide-react';

interface OpenFileModalProps {
  isConnected: boolean;
  onOpenLocal: () => void;
  onOpenRemote: () => void;
  onConnectRemote: () => void;
  onClose: () => void;
}

export const OpenFileModal: React.FC<OpenFileModalProps> = ({ 
  isConnected, 
  onOpenLocal, 
  onOpenRemote, 
  onConnectRemote, 
  onClose 
}) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content confirm-modal" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Open File</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <div className="modal-body" style={{ padding: '20px 40px 40px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <button 
              onClick={() => { onOpenLocal(); onClose(); }}
              style={{ 
                width: '100%', 
                height: '60px', 
                justifyContent: 'flex-start', 
                padding: '0 20px',
                fontSize: '18px'
              }}
            >
              <FolderOpen size={24} />
              <span>Local File System</span>
            </button>

            <div style={{ height: '1px', background: 'var(--border-color)', margin: '5px 0' }} />

            {isConnected ? (
              <button 
                onClick={() => { onOpenRemote(); onClose(); }}
                style={{ 
                  width: '100%', 
                  height: '60px', 
                  justifyContent: 'flex-start', 
                  padding: '0 20px',
                  fontSize: '18px'
                }}
              >
                <HardDrive size={24} color="var(--c-aqua)" />
                <span>Remote SSH Files</span>
              </button>
            ) : (
              <button 
                onClick={() => { onConnectRemote(); onClose(); }}
                style={{ 
                  width: '100%', 
                  height: '60px', 
                  justifyContent: 'flex-start', 
                  padding: '0 20px',
                  fontSize: '18px'
                }}
              >
                <Server size={24} />
                <span>Connect to Remote...</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
