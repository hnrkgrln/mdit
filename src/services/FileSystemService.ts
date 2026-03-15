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
  // ... (rest of class remains similar)

  /**
   * Opens a file picker and returns the file handle and content.
   */
  async openFile(): Promise<FileData> {
    const [handle] = await window.showOpenFilePicker({
      ...this.pickerOptions,
      multiple: false,
    });
    
    // Request readwrite permission immediately
    await handle.requestPermission({ mode: 'readwrite' });
    
    const file = await handle.getFile();
    const content = await file.text();
    
    // Attempt to get the path (some browsers might support this via proprietary APIs or as a hint)
    // Most standard implementations won't give the full system path for security reasons,
    // but we can at least provide the name or any available hint.
    return { handle, content, name: file.name, path: (file as any).webkitRelativePath || file.name };
  }

  /**
   * Saves content to a new file using a file picker.
   */
  async saveFileAs(content: string, suggestedName: string = 'untitled.md'): Promise<FileData> {
    // Ensure .md extension
    const finalName = suggestedName.toLowerCase().endsWith('.md') || suggestedName.toLowerCase().endsWith('.markdown')
      ? suggestedName
      : `${suggestedName}.md`;

    const handle = await window.showSaveFilePicker({
      ...this.pickerOptions,
      suggestedName: finalName,
    });
    await this.writeFile(handle, content);
    return { handle, content, name: handle.name, path: handle.name };
  }

  /**
   * Writes content to an existing file handle.
   */
  async writeFile(handle: FileSystemFileHandle, content: string): Promise<void> {
    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
  }

  /**
   * Check if the File System Access API is supported.
   */
  isSupported(): boolean {
    return 'showOpenFilePicker' in window;
  }
}

export const fileSystemService = new FileSystemService();
