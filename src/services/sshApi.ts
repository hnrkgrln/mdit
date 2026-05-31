/**
 * SSH-specific API wrapper
 */
import { apiClient } from './api';
import type { RemoteEntry, SshConfig } from '../types';

const SSH_BASE = '/ssh';

export interface ConnectResponse {
  sessionId: string;
}

export interface ListDirectoryResponse {
  entries: RemoteEntry[];
}

export interface ReadFileResponse {
  content: string;
}

export interface WriteFileResponse {
  success: boolean;
}

export interface DisconnectResponse {
  success: boolean;
}

export class SshApi {
  async connect(config: SshConfig): Promise<ConnectResponse> {
    return apiClient.post<ConnectResponse>(`${SSH_BASE}/connect`, config);
  }

  async listDirectory(sessionId: string, path: string = '.'): Promise<ListDirectoryResponse> {
    return apiClient.get<ListDirectoryResponse>(`${SSH_BASE}/ls`, {
      params: { sessionId, path },
    });
  }

  async readFile(sessionId: string, path: string): Promise<ReadFileResponse> {
    return apiClient.get<ReadFileResponse>(`${SSH_BASE}/read`, {
      params: { sessionId, path },
    });
  }

  async writeFile(sessionId: string, path: string, content: string): Promise<WriteFileResponse> {
    return apiClient.post<WriteFileResponse>(`${SSH_BASE}/write`, {
      sessionId,
      path,
      content,
    });
  }

  async disconnect(sessionId: string): Promise<DisconnectResponse> {
    return apiClient.post<DisconnectResponse>(`${SSH_BASE}/disconnect`, {
      sessionId,
    });
  }
}

export const sshApi = new SshApi();
