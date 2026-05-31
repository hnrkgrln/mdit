import { renderHook, act } from '@testing-library/react';
import { useFile } from './useFile';
import { fileSystemService } from '../services/FileSystemService';
import { sshService } from '../services/SshService';

// Mock services
vi.mock('../services/FileSystemService');
vi.mock('../services/SshService');

describe('useFile hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useFile());
    
    expect(result.current.content).toBe('');
    expect(result.current.fileName).toBe('Untitled');
    expect(result.current.filePath).toBeNull();
    expect(result.current.fileMode).toBe('local');
    expect(result.current.isDirty).toBe(false);
    expect(result.current.isSaving).toBe(false);
    expect(result.current.isLoading).toBe(true);
  });

  it('should update content', () => {
    const { result } = renderHook(() => useFile());
    
    act(() => {
      result.current.updateContent('Hello World');
    });
    
    expect(result.current.content).toBe('Hello World');
    expect(result.current.isDirty).toBe(true);
  });

  it('should check if confirmation is needed for unsaved changes', () => {
    const { result } = renderHook(() => useFile());
    
    // No confirmation needed for clean state
    expect(result.current.needsConfirmation()).toBe(false);
    
    // Add content
    act(() => {
      result.current.updateContent('Some content');
    });
    
    // Confirmation needed for dirty state without handle
    expect(result.current.needsConfirmation()).toBe(true);
  });

  it('should handle openFile', async () => {
    const mockContent = 'File content';
    const mockHandle = {} as FileSystemFileHandle;
    const mockFile = { name: 'test.md', text: () => Promise.resolve(mockContent) } as File;
    
    vi.mocked(fileSystemService.openFile).mockResolvedValue({
      handle: mockHandle,
      content: mockContent,
      name: 'test.md',
      path: '/path/to/test.md',
    });

    const { result } = renderHook(() => useFile());
    
    // Wait for initial loading to finish
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    await act(async () => {
      await result.current.openFile();
    });
    
    expect(result.current.content).toBe(mockContent);
    expect(result.current.fileName).toBe('test.md');
    expect(result.current.filePath).toBe('/path/to/test.md');
  });

  it('should handle newFile', async () => {
    const { result } = renderHook(() => useFile());
    
    // Add some content
    act(() => {
      result.current.updateContent('Some content');
    });
    
    // Wait for initial loading
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    act(() => {
      result.current.newFile();
    });
    
    expect(result.current.content).toBe('');
    expect(result.current.fileName).toBe('Untitled');
    expect(result.current.filePath).toBeNull();
    expect(result.current.isDirty).toBe(false);
  });
});
