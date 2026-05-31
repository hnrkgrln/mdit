import { useState, useEffect, useCallback } from 'react';
import { sshService } from '../services/SshService';
import type { ConnectionStatus } from '../types';

/**
 * Hook to manage SSH connection status synchronization
 */
export function useConnectionStatus(): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>(() => ({
    isConnected: sshService.isConnected(),
    machineName: sshService.getConnectedMachineName(),
    sessionId: sshService.getSessionId(),
  }));

  const updateStatus = useCallback(() => {
    setStatus({
      isConnected: sshService.isConnected(),
      machineName: sshService.getConnectedMachineName(),
      sessionId: sshService.getSessionId(),
    });
  }, []);

  useEffect(() => {
    // Listen for storage events (if session is persisted)
    const onStorageChange = () => updateStatus();
    window.addEventListener('storage', onStorageChange);
    
    return () => window.removeEventListener('storage', onStorageChange);
  }, [updateStatus]);

  return status;
}
