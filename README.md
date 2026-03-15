# MDit - Minimalist Markdown Editor

MDit is a focused, offline-first, browser-based Markdown editor designed for distraction-free writing. It features a beautiful Gruvbox-inspired theme, a robust WYSIWYG editing experience powered by Milkdown, and seamless integration with your local file system.

## Features

- 📝 **WYSIWYG & Source Modes:** Instantly toggle between a rich, live-preview editor and a raw plain text Markdown editor (`Ctrl + M`).
- 🎨 **Gruvbox Theme:** Easy on the eyes with carefully tuned Light (`🌑`) and Dark (`☀️`) modes (`Ctrl + L`).
- 💾 **Local File System Access:** Open, edit, and save `.md` files directly on your computer without uploading them to a server.
- ⚡ **Auto-save:** Automatically saves your progress to disk. You'll never lose a draft thanks to built-in IndexedDB backup.
- ⌨️ **Keyboard Driven:** Navigate and manage files quickly using intuitive shortcuts.
- 📱 **Responsive Design:** A clean, full-width mobile experience with a collapsible hamburger menu.
- 🔒 **Privacy First:** Your data never leaves your machine. Everything runs locally in your browser.

## Getting Started

MDit is built using React, TypeScript, and Vite. 

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed (version 18 or higher is recommended).

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/hnrkgrln/mdit.git
   cd mdit
   ```

2. Install the dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
   *(Note: `--legacy-peer-deps` is required due to a known peer dependency conflict between `vite-plugin-pwa` and Vite 8).*

### Running Locally

Start the development server:
```bash
npm run dev
```
Open your browser and navigate to the local URL provided in the terminal (usually `http://localhost:5173/`).

## Keyboard Shortcuts

MDit is designed to be fast and keyboard-friendly:

| Action | Shortcut |
| :--- | :--- |
| **New File** | `Alt + N` |
| **Open File** | `Ctrl + O` |
| **Save File** | `Ctrl + S` |
| **Toggle Auto-save** | `Ctrl + A` |
| **Toggle Source Mode** | `Ctrl + M` |
| **Toggle Theme** | `Ctrl + L` |
| **Markdown Help** | `Ctrl + H` |
| **Close Help Modal** | `Escape` |

*(On macOS, use the `Cmd` key instead of `Ctrl`)*

## Tech Stack

*   **Framework:** React 18
*   **Build Tool:** Vite
*   **Editor Engine:** [Milkdown (Crepe)](https://milkdown.dev/) - A headless, plugin-driven Markdown editor.
*   **File System:** Native HTML5 File System Access API
*   **Styling:** Vanilla CSS with CSS Variables for dynamic theming.
*   **Icons:** Material Icons Outlined

## Building for Production

To create a production-ready build (which also generates the PWA service workers):

```bash
npm run build
```
You can then preview the build using:
```bash
npm run preview
```
