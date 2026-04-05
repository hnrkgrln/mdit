export interface RemoteEntry {
  name: string;
  isDirectory: boolean;
  size: number;
  mtime: number;
}

export interface SshConfig {
  machineName?: string;
  host: string;
  port?: number;
  username: string;
  password?: string;
  privateKey?: string;
  passphrase?: string;
}

const API_BASE = 'http://localhost:3002/api/ssh';

class SshService {
  private sessionId: string | null = null;
  private connectedMachineName: string | null = null;

  async connect(config: SshConfig): Promise<string> {
    const response = await fetch(`${API_BASE}/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to connect';
      try {
        const error = await response.json();
        errorMessage = error.error || errorMessage;
      } catch (e) {
        errorMessage = `Server Error (${response.status}): ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const { sessionId } = await response.json();
    this.sessionId = sessionId;
    this.connectedMachineName = config.machineName || config.host;
    return sessionId;
  }

  async listDirectory(path: string = '.'): Promise<RemoteEntry[]> {
    if (!this.sessionId) throw new Error('Not connected');

    const params = new URLSearchParams({ sessionId: this.sessionId, path });
    const response = await fetch(`${API_BASE}/ls?${params}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to list directory');
    }

    const { entries } = await response.json();
    return entries;
  }

  async readFile(path: string): Promise<string> {
    if (!this.sessionId) throw new Error('Not connected');

    const params = new URLSearchParams({ sessionId: this.sessionId, path });
    const response = await fetch(`${API_BASE}/read?${params}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to read file');
    }

    const { content } = await response.json();
    return content;
  }

  async writeFile(path: string, content: string): Promise<void> {
    if (!this.sessionId) throw new Error('Not connected');

    const response = await fetch(`${API_BASE}/write`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: this.sessionId, path, content }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to write file');
    }
  }

  async disconnect(): Promise<void> {
    if (!this.sessionId) return;

    await fetch(`${API_BASE}/disconnect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: this.sessionId }),
    });

    this.sessionId = null;
    this.connectedMachineName = null;
  }

  isConnected(): boolean {
    return this.sessionId !== null;
  }

  getConnectedMachineName(): string | null {
    return this.connectedMachineName;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }
}

export const sshService = new SshService();
