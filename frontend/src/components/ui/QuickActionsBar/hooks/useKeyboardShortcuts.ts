/**
 * useKeyboardShortcuts Hook
 * 
 * Manages keyboard shortcuts for Quick Actions Bar:
 * - Registers/unregisters shortcuts
 * - Handles keyboard events globally
 * - Respects input focus (doesn't trigger when typing in text fields)
 * - Provides shortcuts list for help dialog
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { KeyboardShortcut, UseKeyboardShortcutsReturn } from '../QuickActionsBar.types';

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
 * Hook for managing keyboard shortcuts
 */
export function useKeyboardShortcuts(
  initialEnabled: boolean = true
): UseKeyboardShortcutsReturn {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);
  
  // Use ref to avoid stale closures in event listener
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
      // Remove existing shortcut with same key combination
      const filtered = current.filter(
        (s) =>
          s.key !== shortcut.key ||
          JSON.stringify(s.modifiers) !== JSON.stringify(shortcut.modifiers)
      );
      return [...filtered, shortcut];
    });
  }, []);

  /**
   * Unregister a keyboard shortcut by key
   */
  const unregisterShortcut = useCallback((key: string) => {
    setShortcuts((current) => current.filter((s) => s.key.toLowerCase() !== key.toLowerCase()));
  }, []);

  /**
   * Handle keyboard events
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
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // Empty deps - using refs to avoid recreating listener

  return {
    registerShortcut,
    unregisterShortcut,
    setEnabled,
    enabled,
    shortcuts,
  };
}

