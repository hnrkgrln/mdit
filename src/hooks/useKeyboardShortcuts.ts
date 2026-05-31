import { useEffect, useCallback } from 'react';
import type { KeyboardAction } from '../types';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: KeyboardAction;
  preventDefault?: boolean;
}

interface UseKeyboardShortcutsProps {
  onAction: (action: KeyboardAction) => void;
  disabled?: boolean;
  shortcuts?: KeyboardShortcut[];
}

const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  { key: 's', ctrlKey: true, action: 'save', preventDefault: true },
  { key: 'o', ctrlKey: true, action: 'open', preventDefault: true },
  { key: 'N', ctrlKey: true, shiftKey: true, action: 'new', preventDefault: true },
  { key: 'h', ctrlKey: true, action: 'help', preventDefault: true },
  { key: 'L', ctrlKey: true, shiftKey: true, action: 'toggleTheme', preventDefault: true },
  { key: 'a', ctrlKey: true, action: 'toggleAutosave', preventDefault: true },
  { key: 'm', ctrlKey: true, action: 'toggleSource', preventDefault: true },
  { key: 'Escape', action: 'close', preventDefault: false },
];

/**
 * Hook to handle keyboard shortcuts
 */
export function useKeyboardShortcuts({
  onAction,
  disabled = false,
  shortcuts = DEFAULT_SHORTCUTS,
}: UseKeyboardShortcutsProps): void {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (disabled) return;

    for (const shortcut of shortcuts) {
      const matches = 
        e.key === shortcut.key &&
        (shortcut.ctrlKey === undefined || e.ctrlKey === shortcut.ctrlKey) &&
        (shortcut.shiftKey === undefined || e.shiftKey === shortcut.shiftKey) &&
        (shortcut.altKey === undefined || e.altKey === shortcut.altKey) &&
        (shortcut.metaKey === undefined || e.metaKey === shortcut.metaKey);

      if (matches) {
        if (shortcut.preventDefault !== false) {
          e.preventDefault();
        }
        onAction(shortcut.action);
        return;
      }
    }
  }, [onAction, disabled, shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
