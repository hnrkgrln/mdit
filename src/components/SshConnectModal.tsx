import React, { useState, useEffect } from 'react';
import type { SshConfig } from '../services/SshService';
import { X, Server, User, Lock, Key, Save, Trash2, ChevronDown } from 'lucide-react';

interface SshConnectModalProps {
  onConnect: (config: SshConfig) => Promise<void>;
  onClose: () => void;
}

const SAVED_MACHINES_KEY = 'mdit_ssh_machines';

export const SshConnectModal: React.FC<SshConnectModalProps> = ({ onConnect, onClose }) => {
  const [machineName, setMachineName] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('22');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMachines, setSavedMachines] = useState<SshConfig[]>([]);
  const [showSavedList, setShowSavedList] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(SAVED_MACHINES_KEY);
    if (saved) {
      try {
        setSavedMachines(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved machines');
      }
    }
  }, []);

  const handleSaveMachine = () => {
    if (!host || !username || !machineName) {
      setError('Machine Name, Host and Username are required to save');
      return;
    }

    const newMachine: SshConfig = {
      machineName,
      host,
      port: parseInt(port),
      username,
      password,
      privateKey,
      passphrase
    };

    const updated = [...savedMachines.filter(m => m.machineName !== machineName), newMachine];
    setSavedMachines(updated);
    localStorage.setItem(SAVED_MACHINES_KEY, JSON.stringify(updated));
    setError(null);
  };

  const handleDeleteMachine = () => {
    if (!machineName) return;
    const updated = savedMachines.filter(m => m.machineName !== machineName);
    setSavedMachines(updated);
    localStorage.setItem(SAVED_MACHINES_KEY, JSON.stringify(updated));
    // Clear form after delete
    setMachineName('');
    setHost('');
    setPort('22');
    setUsername('');
    setPassword('');
    setPrivateKey('');
    setPassphrase('');
  };

  const handleLoadMachine = (machine: SshConfig) => {
    setMachineName(machine.machineName || '');
    setHost(machine.host);
    setPort(machine.port?.toString() || '22');
    setUsername(machine.username);
    setPassword(machine.password || '');
    setPrivateKey(machine.privateKey || '');
    setPassphrase(machine.passphrase || '');
    setShowSavedList(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    setError(null);

    try {
      const config: SshConfig = {
        machineName,
        host,
        port: parseInt(port),
        username,
        password: password.trim() || undefined,
        privateKey: privateKey.trim() || undefined,
      };

      if (passphrase && passphrase.trim()) {
        config.passphrase = passphrase.trim();
      }

      await onConnect(config);
    } catch (err: any) {
      setError(err.message || 'Failed to connect');
    } finally {
      setIsConnecting(false);
    }
  };

  const isExistingMachine = savedMachines.some(m => m.machineName === machineName);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content confirm-modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Connect to Remote Server</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ textAlign: 'left', padding: '20px 40px', maxHeight: '60vh' }}>
            
            <div style={{ marginBottom: '20px', position: 'relative' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: 'var(--gb-gray)' }}>
                Saved Machines
              </label>
              <div 
                onClick={() => setShowSavedList(!showSavedList)}
                style={{ 
                  padding: '10px', 
                  background: 'var(--header-bg)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '4px', 
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ color: machineName ? 'var(--text-color)' : 'var(--gb-gray)' }}>
                  {machineName || 'New Machine...'}
                </span>
                <ChevronDown size={16} />
              </div>
              
              {showSavedList && (
                <div style={{ 
                  position: 'absolute', 
                  top: '100%', 
                  left: 0, 
                  right: 0, 
                  background: 'var(--bg-color)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '4px', 
                  zIndex: 100,
                  maxHeight: '200px',
                  overflowY: 'auto',
                  marginTop: '5px'
                }}>
                  <div 
                    onClick={() => { setMachineName(''); setHost(''); setUsername(''); setShowSavedList(false); }}
                    style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', color: 'var(--gb-gray)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(146, 131, 116, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    + New Machine
                  </div>
                  {savedMachines.map((m) => (
                    <div 
                      key={m.machineName}
                      onClick={() => handleLoadMachine(m)}
                      style={{ 
                        padding: '10px', 
                        borderBottom: '1px solid var(--border-color)',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(146, 131, 116, 0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ fontWeight: 'bold' }}>{m.machineName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--gb-gray)' }}>{m.username}@{m.host}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                  Machine Name
                </label>
                <input
                  type="text"
                  value={machineName}
                  onChange={(e) => setMachineName(e.target.value)}
                  placeholder="e.g. My Raspberry Pi"
                  required
                  style={{ width: '100%', padding: '10px', background: 'var(--button-bg)', border: '1px solid var(--border-color)', color: 'var(--text-color)', borderRadius: '4px' }}
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                  <Server size={16} /> Host
                </label>
                <input
                  type="text"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="e.g. 192.168.1.10"
                  required
                  style={{ width: '100%', padding: '10px', background: 'var(--button-bg)', border: '1px solid var(--border-color)', color: 'var(--text-color)', borderRadius: '4px' }}
                />
              </div>
              
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                  Port
                </label>
                <input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  placeholder="22"
                  style={{ width: '100%', padding: '10px', background: 'var(--button-bg)', border: '1px solid var(--border-color)', color: 'var(--text-color)', borderRadius: '4px' }}
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                  <User size={16} /> Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="user"
                  required
                  style={{ width: '100%', padding: '10px', background: 'var(--button-bg)', border: '1px solid var(--border-color)', color: 'var(--text-color)', borderRadius: '4px' }}
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                  <Lock size={16} /> Password (optional)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ width: '100%', padding: '10px', background: 'var(--button-bg)', border: '1px solid var(--border-color)', color: 'var(--text-color)', borderRadius: '4px' }}
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                  <Key size={16} /> Private Key (optional)
                </label>
                <textarea
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  placeholder="-----BEGIN OPENSSH PRIVATE KEY-----..."
                  style={{ width: '100%', height: '80px', padding: '10px', background: 'var(--button-bg)', border: '1px solid var(--border-color)', color: 'var(--text-color)', borderRadius: '4px', resize: 'none', fontFamily: 'monospace', fontSize: '12px' }}
                />
              </div>

              {privateKey && (
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                    <Lock size={16} /> Key Passphrase (optional)
                  </label>
                  <input
                    type="password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="••••••••"
                    style={{ width: '100%', padding: '10px', background: 'var(--button-bg)', border: '1px solid var(--border-color)', color: 'var(--text-color)', borderRadius: '4px' }}
                  />
                </div>
              )}

              {error && (
                <div style={{ color: 'var(--c-red)', fontSize: '14px', marginTop: '10px' }}>
                  {error}
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer" style={{ padding: '20px 40px 40px', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="button" 
                onClick={handleSaveMachine} 
                style={{ background: 'transparent', border: '1px solid var(--gb-gray)', color: 'var(--gb-gray)', minWidth: 'auto' }}
                title={isExistingMachine ? "Update Machine" : "Save Machine"}
              >
                <Save size={16} />
                <span>{isExistingMachine ? "Update" : "Save"}</span>
              </button>
              
              {isExistingMachine && (
                <button 
                  type="button" 
                  onClick={handleDeleteMachine} 
                  style={{ background: 'transparent', border: '1px solid var(--c-red)', color: 'var(--c-red)', minWidth: 'auto' }}
                  title="Remove Machine"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <button type="button" className="cancel-btn" onClick={onClose} disabled={isConnecting}>
                Cancel
              </button>
              <button type="submit" className="confirm-btn" style={{ background: 'var(--c-aqua)', borderColor: 'var(--c-aqua)', minWidth: '120px' }} disabled={isConnecting}>
                {isConnecting ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
