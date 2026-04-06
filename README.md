# MDit - Minimalist Markdown Editor

MDit is a focused, offline-first, browser-based Markdown editor designed for distraction-free writing. It features a beautiful Gruvbox-inspired theme, a robust WYSIWYG editing experience, and seamless integration with both your **local file system** and **remote SSH servers**.

## Features

- 📝 **Dual Editing Modes:** Instantly toggle between a rich WYSIWYG live-preview and a rock-solid raw source editor (`Ctrl + M`).
- 🌐 **Remote SSH Editing:** Connect to remote machines via SSH/SFTP to open, edit, and save files directly on your servers.
- 💾 **Unified Storage Controls:** Streamlined "Open" and "Save" split-buttons for quick actions or explicit Local/Remote choices.
- 🎨 **Pro Gruvbox Theme:** High-contrast Light and Dark modes with specialized syntax highlighting for code blocks.
- ⚡ **Auto-save (Default):** Your work is protected by default. Changes are automatically saved to your chosen location, with background draft backup in IndexedDB.
- 🔗 **Connection Status:** A dedicated header "pill" shows exactly which remote machine you're connected to, with a one-click disconnect.
- 🖥️ **Machine Manager:** Save and switch between multiple named remote configurations effortlessly.
- ⌨️ **Keyboard Optimized:** Efficient shortcuts for almost every action, including a custom Tab-supported source editor.

## Getting Started

### Prerequisites

- **Node.js:** Version 18 or higher.
- **SSH Server:** For remote editing, ensure your machine has SFTP enabled.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/hnrkgrln/mdit.git
   cd mdit
   ```

2. Install root dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
   *(Note: `--legacy-peer-deps` is required for certain Milkdown plugins).*

3. Install backend dependencies:
   ```bash
   cd server
   npm install
   cd ..
   ```

### Running Locally (Development)

Start both the frontend and the SSH backend:
```bash
npm run dev:all
```
The editor will be available at `http://localhost:5173`. The backend runs on port `3002`.

## Production Setup

1. **Build the Frontend:**
   ```bash
   npm run build
   ```

2. **Run the Production Server:**
   ```bash
   npm start
   ```
   The backend serves both the API and the assets on port `3002` (configurable via `PORT` env var).

## Keyboard Shortcuts

| Action | Shortcut |
| :--- | :--- |
| **New File** | `Ctrl + Shift + N` |
| **Open Menu** | `Ctrl + O` |
| **Save / Quick Save** | `Ctrl + S` |
| **Toggle Auto-save** | `Ctrl + A` |
| **Toggle Source Mode** | `Ctrl + M` |
| **Toggle Theme** | `Ctrl + Shift + L` |
| **Markdown Help** | `Ctrl + H` |
| **Close Modals/Menus** | `Escape` |

## Tech Stack

*   **Frontend:** React 18, TypeScript, Vite.
*   **Editor:** [Milkdown (Crepe)](https://milkdown.dev/).
*   **Backend:** Node.js, Express, `ssh2` (SFTP).
*   **Storage:** HTML5 File System Access API & IndexedDB (idb-keyval).

## Privacy & Security

*   **Local Files:** Handled entirely via browser APIs; never touched by the backend.
*   **Remote Files:** Credentials are sent to **your** local Node.js backend to establish the SSH tunnel. No third-party servers involved.
*   **Persistent Config:** Machine metadata is stored locally in your browser's `localStorage`.
