/**
 * KeyboardShortcutProvider Component
 * 
 * Global keyboard shortcut management system that:
 * - Provides centralized shortcut registration/management
 * - Works across all visualizers and components
 * - Prevents conflicts between shortcut sources
 * - Enables/disables shortcuts based on context
 * - Tracks all registered shortcuts for help display
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { KeyboardShortcut } from '../QuickActionsBar.types';

interface KeyboardShortcutContextValue {
  /** Register a keyboard shortcut */
  registerShortcut: (shortcut: KeyboardShortcut) => void;
  /** Unregister a keyboard shortcut by key */
  unregisterShortcut: (key: string, modifiers?: KeyboardShortcut['modifiers']) => void;
  /** Enable/disable all shortcuts */
  setEnabled: (enabled: boolean) => void;
  /** Current enabled state */
  enabled: boolean;
  /** All currently registered shortcuts */
  shortcuts: KeyboardShortcut[];
  /** Clear all shortcuts (used when unmounting visualizers) */
  clearShortcuts: () => void;
}

// Default context value for when no provider exists
const defaultContextValue: KeyboardShortcutContextValue = {
  registerShortcut: () => {},
  unregisterShortcut: () => {},
  setEnabled: () => {},
  enabled: false,
  shortcuts: [],
  clearShortcuts: () => {},
};

const KeyboardShortcutContext = createContext<KeyboardShortcutContextValue>(defaultContextValue);

/**
 * Hook to access keyboard shortcut context
 * Returns a default no-op value if used outside of provider (graceful degradation)
 */
export function useKeyboardShortcutContext(): KeyboardShortcutContextValue {
  return useContext(KeyboardShortcutContext);
}

/**
 * Check if event target is an input element where we should ignore shortcuts
 */
function isInputElement(element: EventTarget | null): boolean {
  if (!element || !(element instanceof HTMLElement)) {
    return false;
  }

  const tagName = element.tagName.toLowerCase();
  const contentEditable = element.getAttribute('contenteditable');

  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    contentEditable === 'true' ||
    contentEditable === 'plaintext-only'
  );
}

/**
 * Check if keyboard event matches shortcut definition
 */
function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  // Check modifier keys
  const modifiers = shortcut.modifiers || {};
  if (Boolean(modifiers.ctrl) !== event.ctrlKey) return false;
  if (Boolean(modifiers.shift) !== event.shiftKey) return false;
  if (Boolean(modifiers.alt) !== event.altKey) return false;
  if (Boolean(modifiers.meta) !== event.metaKey) return false;

  // Check key (case insensitive)
  return event.key.toLowerCase() === shortcut.key.toLowerCase();
}

/**
 * Generate unique key for shortcut (for deduplication)
 */
function getShortcutKey(shortcut: KeyboardShortcut): string {
  const modifiers = shortcut.modifiers || {};
  const parts: string[] = [];
  
  if (modifiers.ctrl) parts.push('ctrl');
  if (modifiers.shift) parts.push('shift');
  if (modifiers.alt) parts.push('alt');
  if (modifiers.meta) parts.push('meta');
  parts.push(shortcut.key.toLowerCase());
  
  return parts.join('+');
}

interface KeyboardShortcutProviderProps {
  children: React.ReactNode;
  /** Initial enabled state */
  initialEnabled?: boolean;
}

/**
 * Provider component that manages global keyboard shortcuts
 */
export const KeyboardShortcutProvider: React.FC<KeyboardShortcutProviderProps> = ({
  children,
  initialEnabled = true,
}) => {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);
  
  // Use refs to avoid stale closures in event listener
  const shortcutsRef = useRef<KeyboardShortcut[]>([]);
  const enabledRef = useRef(enabled);

  // Keep refs in sync
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  /**
   * Register a new keyboard shortcut
   */
  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    setShortcuts((current) => {
      const newKey = getShortcutKey(shortcut);
      
      // Remove existing shortcut with same key combination
      const filtered = current.filter(
        (s) => getShortcutKey(s) !== newKey
      );
      
      return [...filtered, shortcut];
    });
  }, []);

  /**
   * Unregister a keyboard shortcut
   */
  const unregisterShortcut = useCallback((
    key: string,
    modifiers?: KeyboardShortcut['modifiers']
  ) => {
    setShortcuts((current) => {
      const targetKey = getShortcutKey({ key, modifiers });
      return current.filter((s) => getShortcutKey(s) !== targetKey);
    });
  }, []);

  /**
   * Clear all shortcuts
   */
  const clearShortcuts = useCallback(() => {
    setShortcuts([]);
  }, []);

  /**
   * Handle keyboard events globally
   */
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Don't trigger shortcuts if disabled
      if (!enabledRef.current) return;

      // Don't trigger shortcuts when typing in input fields
      if (isInputElement(event.target)) return;

      // Find matching shortcut
      const matchedShortcut = shortcutsRef.current.find((shortcut) =>
        matchesShortcut(event, shortcut)
      );

      if (matchedShortcut) {
        event.preventDefault();
        event.stopPropagation();
        matchedShortcut.action();
      }
    }

    // Add event listener
    document.addEventListener('keydown', handleKeyDown, { capture: true });

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, []); // Empty deps - using refs to avoid recreating listener

  const value: KeyboardShortcutContextValue = {
    registerShortcut,
    unregisterShortcut,
    setEnabled,
    enabled,
    shortcuts,
    clearShortcuts,
  };

  return (
    <KeyboardShortcutContext.Provider value={value}>
      {children}
    </KeyboardShortcutContext.Provider>
  );
};





