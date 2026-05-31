import { sshApi } from './sshApi';
import type { RemoteEntry, SshConfig } from '../types';

// Session persistence keys
const SESSION_ID_KEY = 'mdit_ssh_session_id';
const MACHINE_NAME_KEY = 'mdit_ssh_machine_name';

/**
 * SshService - Manages SSH connections and file operations
 * Uses the sshApi client for HTTP requests
 */
class SshService {
  private sessionId: string | null = null;
  private connectedMachineName: string | null = null;

  constructor() {
    // Try to restore session from localStorage
    this.restoreSession();
  }

  /**
   * Restore session from localStorage if available
   */
  private restoreSession(): void {
    const savedSessionId = localStorage.getItem(SESSION_ID_KEY);
    const savedMachineName = localStorage.getItem(MACHINE_NAME_KEY);
    
    if (savedSessionId && savedMachineName) {
      this.sessionId = savedSessionId;
      this.connectedMachineName = savedMachineName;
    }
  }

  /**
   * Persist session to localStorage
   */
  private persistSession(): void {
    if (this.sessionId) {
      localStorage.setItem(SESSION_ID_KEY, this.sessionId);
    } else {
      localStorage.removeItem(SESSION_ID_KEY);
    }
    
    if (this.connectedMachineName) {
      localStorage.setItem(MACHINE_NAME_KEY, this.connectedMachineName);
    } else {
      localStorage.removeItem(MACHINE_NAME_KEY);
    }
  }

  /**
   * Clear session from localStorage
   */
  private clearSession(): void {
    localStorage.removeItem(SESSION_ID_KEY);
    localStorage.removeItem(MACHINE_NAME_KEY);
  }

  /**
   * Connect to an SSH server
   */
  async connect(config: SshConfig): Promise<string> {
    const response = await sshApi.connect(config);
    
    this.sessionId = response.sessionId;
    this.connectedMachineName = config.machineName || config.host;
    this.persistSession();
    
    return response.sessionId;
  }

  /**
   * List directory contents on remote server
   */
  async listDirectory(path: string = '.'): Promise<RemoteEntry[]> {
    if (!this.sessionId) throw new Error('Not connected');

    const response = await sshApi.listDirectory(this.sessionId, path);
    return response.entries;
  }

  /**
   * Read file contents from remote server
   */
  async readFile(path: string): Promise<string> {
    if (!this.sessionId) throw new Error('Not connected');

    const response = await sshApi.readFile(this.sessionId, path);
    return response.content;
  }

  /**
   * Write file contents to remote server
   */
  async writeFile(path: string, content: string): Promise<void> {
    if (!this.sessionId) throw new Error('Not connected');

    await sshApi.writeFile(this.sessionId, path, content);
  }

  /**
   * Disconnect from SSH server
   */
  async disconnect(): Promise<void> {
    if (!this.sessionId) return;

    try {
      await sshApi.disconnect(this.sessionId);
    } catch (error) {
      console.error('Failed to disconnect:', error);
    } finally {
      this.sessionId = null;
      this.connectedMachineName = null;
      this.clearSession();
    }
  }

  /**
   * Check if connected to an SSH server
   */
  isConnected(): boolean {
    return this.sessionId !== null;
  }

  /**
   * Get the connected machine name
   */
  getConnectedMachineName(): string | null {
    return this.connectedMachineName;
  }

  /**
   * Get the current session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Validate SSH config before connecting
   */
  static validateConfig(config: SshConfig): { valid: boolean; error?: string } {
    if (!config.host || config.host.trim() === '') {
      return { valid: false, error: 'Host is required' };
    }
    
    if (!config.username || config.username.trim() === '') {
      return { valid: false, error: 'Username is required' };
    }

    // Validate host format
    const host = config.host.trim();
    const hostPattern = /^([a-zA-Z0-9.-]+|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/;
    if (!hostPattern.test(host)) {
      return { valid: false, error: 'Invalid host format' };
    }

    // Validate port if provided
    if (config.port && (config.port < 1 || config.port > 65535)) {
      return { valid: false, error: 'Port must be between 1 and 65535' };
    }

    return { valid: true };
  }

  /**
   * Sanitize file path to prevent directory traversal
   */
  static sanitizePath(path: string): string {
    // Remove leading slashes and normalize
    let sanitized = path.replace(/^\/+/, '');
    
    // Prevent directory traversal
    sanitized = sanitized.replace(/\.\.\//g, '');
    sanitized = sanitized.replace(/\.\./g, '');
    
    // Remove any null bytes
    sanitized = sanitized.replace(/\x00/g, '');
    
    return sanitized;
  }
}

export const sshService = new SshService();
