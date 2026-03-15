/**
 * FileSystemService handles local file operations using the File System Access API.
 * It provides methods to open, save, and update .md files.
 */

export interface FileData {
  handle: FileSystemFileHandle | null;
  content: string;
  name: string;
  path?: string;
}

class FileSystemService {
  private readonly pickerOptions = {
    types: [
      {
        description: 'Markdown Files',
        accept: {
          'text/markdown': ['.md', '.markdown'],
        },
      },
    ],
  };

  /**
   * Opens a file picker and returns the file handle and content.
   */
  async openFile(): Promise<FileData> {
    if (this.isSupported()) {
      const [handle] = await window.showOpenFilePicker({
        ...this.pickerOptions,
        multiple: false,
      });
      
      const file = await handle.getFile();
      const content = await file.text();
      
      return { handle, content, name: file.name, path: (file as any).webkitRelativePath || file.name };
    } else {
      // Fallback for browsers/contexts that don't support the File System Access API
      return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.md,.markdown,text/markdown';
        
        input.onchange = async (e: Event) => {
          const target = e.target as HTMLInputElement;
          const file = target.files?.[0];
          if (!file) {
            reject(new Error('No file selected'));
            return;
          }
          const content = await file.text();
          resolve({ handle: null, content, name: file.name, path: file.name });
        };
        
        // Handle cancellation (partially works in modern browsers)
        input.oncancel = () => {
          reject(new Error('File selection cancelled'));
        };
        
        input.click();
      });
    }
  }

  /**
   * Saves content to a new file using a file picker.
   */
  async saveFileAs(content: string, suggestedName: string = 'untitled.md'): Promise<FileData> {
    // Ensure .md extension
    const finalName = suggestedName.toLowerCase().endsWith('.md') || suggestedName.toLowerCase().endsWith('.markdown')
      ? suggestedName
      : `${suggestedName}.md`;

    if (this.isSupported()) {
      const handle = await window.showSaveFilePicker({
        ...this.pickerOptions,
        suggestedName: finalName,
      });
      await this.writeFile(handle, content);
      return { handle, content, name: handle.name, path: handle.name };
    } else {
      // Fallback: trigger a traditional file download
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = finalName;
      a.style.display = 'none';
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      
      return { handle: null, content, name: finalName, path: finalName };
    }
  }

  /**
   * Writes content to an existing file handle.
   */
  async writeFile(handle: FileSystemFileHandle, content: string): Promise<void> {
    if (!this.isSupported() || !handle) {
      throw new Error('File System API not supported or invalid handle');
    }
    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
  }

  /**
   * Check if the File System Access API is supported.
   */
  isSupported(): boolean {
    return 'showOpenFilePicker' in window && 'showSaveFilePicker' in window;
  }
}

export const fileSystemService = new FileSystemService();
