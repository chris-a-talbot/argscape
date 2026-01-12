/**
 * ShortcutHelpDialog Component
 * 
 * Modal dialog that displays all available keyboard shortcuts.
 * Features:
 * - Categorizes shortcuts by function (Navigation, Filters, Views, etc.)
 * - Shows key combinations with visual indicators
 * - Liquid Glass design system integration
 * - Accessible dialog with proper focus management
 * - Responsive layout
 */

import React, { useEffect, useRef } from 'react';
import { useColorTheme } from '@/context/ColorThemeContext';
import { useKeyboardShortcutContext } from './hooks/KeyboardShortcutProvider';
import type { KeyboardShortcut } from './QuickActionsBar.types';

interface ShortcutHelpDialogProps {
  /** Whether dialog is open (alias: isOpen also accepted) */
  open?: boolean;
  /** Whether dialog is open (alias for open) */
  isOpen?: boolean;
  /** Callback when dialog should close */
  onClose: () => void;
  /** Additional custom shortcuts to display (beyond globally registered ones) */
  customShortcuts?: KeyboardShortcut[];
}

/**
 * Format shortcut key combination for display
 */
function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  const modifiers = shortcut.modifiers || {};

  // Add modifier keys in standard order
  if (modifiers.ctrl) parts.push('Ctrl');
  if (modifiers.alt) parts.push('Alt');
  if (modifiers.shift) parts.push('Shift');
  if (modifiers.meta) parts.push('⌘'); // Mac Command key

  // Add main key
  const key = shortcut.key === ' ' ? 'Space' : shortcut.key;
  parts.push(key.toUpperCase());

  return parts.join(' + ');
}

/**
 * Categorize shortcuts for organized display
 */
function categorizeShortcuts(shortcuts: KeyboardShortcut[]): Record<string, KeyboardShortcut[]> {
  const categories: Record<string, KeyboardShortcut[]> = {
    'Panel Navigation': [],
    'View Controls': [],
    'Filters': [],
    'Selection': [],
    'Actions': [],
    'Help': [],
  };

  shortcuts.forEach((shortcut) => {
    const desc = shortcut.description?.toLowerCase() || '';
    
    if (desc.includes('panel') || desc.includes('tab')) {
      categories['Panel Navigation'].push(shortcut);
    } else if (desc.includes('view') || desc.includes('camera') || desc.includes('layout')) {
      categories['View Controls'].push(shortcut);
    } else if (desc.includes('filter') || desc.includes('range')) {
      categories['Filters'].push(shortcut);
    } else if (desc.includes('select') || desc.includes('node') || desc.includes('edge')) {
      categories['Selection'].push(shortcut);
    } else if (desc.includes('help') || desc.includes('close')) {
      categories['Help'].push(shortcut);
    } else {
      categories['Actions'].push(shortcut);
    }
  });

  // Remove empty categories
  Object.keys(categories).forEach((key) => {
    if (categories[key].length === 0) {
      delete categories[key];
    }
  });

  return categories;
}

export const ShortcutHelpDialog: React.FC<ShortcutHelpDialogProps> = ({
  open,
  isOpen,
  onClose,
  customShortcuts = [],
}) => {
  const { colors, theme } = useColorTheme();
  const { shortcuts: globalShortcuts } = useKeyboardShortcutContext();
  const dialogRef = useRef<HTMLDivElement>(null);

  // Support both prop names
  const isDialogOpen = open ?? isOpen ?? false;

  // Combine global and custom shortcuts
  const allShortcuts = [...globalShortcuts, ...customShortcuts];
  const categorizedShortcuts = categorizeShortcuts(allShortcuts);

  // Handle ESC key to close
  useEffect(() => {
    if (!isDialogOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDialogOpen, onClose]);

  // Focus management - focus dialog when opened
  useEffect(() => {
    if (isDialogOpen && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [isDialogOpen]);

  // Trap focus within dialog
  useEffect(() => {
    if (!isDialogOpen || !dialogRef.current) return;

    const dialog = dialogRef.current;
    const focusableElements = dialog.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    function handleTabKey(event: KeyboardEvent) {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          event.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          event.preventDefault();
          firstFocusable?.focus();
        }
      }
    }

    dialog.addEventListener('keydown', handleTabKey);
    return () => dialog.removeEventListener('keydown', handleTabKey);
  }, [isDialogOpen]);

  if (!isDialogOpen) return null;

  const isLiquid = theme === 'liquid';

  // Styles
  const backdropStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '2rem',
    animation: 'fadeIn 0.2s ease-out',
  };

  const dialogStyle: React.CSSProperties = {
    maxWidth: '800px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    background: isLiquid
      ? 'rgba(255, 255, 255, 0.95)'
      : colors.containerBackground,
    backdropFilter: isLiquid ? 'blur(40px)' : 'none',
    WebkitBackdropFilter: isLiquid ? 'blur(40px)' : 'none',
    borderRadius: '1rem',
    boxShadow: isLiquid
      ? '0 8px 32px rgba(20, 226, 168, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)'
      : '0 8px 32px rgba(0, 0, 0, 0.2)',
    border: `1px solid ${colors.border}`,
    animation: 'slideIn 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
    outline: 'none',
  };

  const headerStyle: React.CSSProperties = {
    padding: '2rem 2rem 1rem',
    borderBottom: `1px solid ${colors.border}`,
    position: 'sticky',
    top: 0,
    background: isLiquid
      ? 'rgba(255, 255, 255, 0.98)'
      : colors.containerBackground,
    backdropFilter: isLiquid ? 'blur(20px)' : 'none',
    WebkitBackdropFilter: isLiquid ? 'blur(20px)' : 'none',
    zIndex: 1,
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: 600,
    color: colors.text,
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  };

  const closeButtonStyle: React.CSSProperties = {
    position: 'absolute',
    top: '1.5rem',
    right: '1.5rem',
    width: '2.5rem',
    height: '2.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    background: 'transparent',
    color: colors.textSecondary,
    cursor: 'pointer',
    borderRadius: '0.5rem',
    transition: 'all 0.15s cubic-bezier(0.4, 0.0, 0.2, 1)',
    fontSize: '1.5rem',
  };

  const contentStyle: React.CSSProperties = {
    padding: '2rem',
  };

  const categoryStyle: React.CSSProperties = {
    marginBottom: '2rem',
  };

  const categoryTitleStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.75rem',
  };

  const shortcutListStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  };

  const shortcutItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1rem',
    background: isLiquid
      ? 'rgba(20, 226, 168, 0.04)'
      : colors.sidebarBackground,
    borderRadius: '0.5rem',
    border: `1px solid ${colors.border}`,
    transition: 'all 0.15s ease',
  };

  const descriptionStyle: React.CSSProperties = {
    color: colors.text,
    fontSize: '0.9375rem',
  };

  const keysStyle: React.CSSProperties = {
    display: 'flex',
    gap: '0.25rem',
  };

  const keyBadgeStyle: React.CSSProperties = {
    padding: '0.25rem 0.625rem',
    background: isLiquid
      ? 'rgba(20, 226, 168, 0.1)'
      : colors.containerBackground,
    border: `1px solid ${isLiquid ? 'rgba(20, 226, 168, 0.2)' : colors.border}`,
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: 600,
    fontFamily: 'monospace',
    color: isLiquid ? '#14E2A8' : colors.text,
    boxShadow: isLiquid
      ? '0 1px 2px rgba(20, 226, 168, 0.1)'
      : 'none',
  };

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div
        ref={dialogRef}
        style={dialogStyle}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="shortcut-dialog-title"
        aria-modal="true"
        tabIndex={-1}
      >
        <div style={headerStyle}>
          <h2 id="shortcut-dialog-title" style={titleStyle}>
            ⌨️ Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            style={closeButtonStyle}
            aria-label="Close dialog"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isLiquid
                ? 'rgba(20, 226, 168, 0.1)'
                : colors.sidebarBackground;
              e.currentTarget.style.color = colors.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = colors.textSecondary;
            }}
          >
            ×
          </button>
        </div>

        <div style={contentStyle}>
          {Object.entries(categorizedShortcuts).length === 0 ? (
            <p style={{ color: colors.textSecondary, textAlign: 'center', padding: '2rem' }}>
              No keyboard shortcuts available.
            </p>
          ) : (
            Object.entries(categorizedShortcuts).map(([category, shortcuts]) => (
              <div key={category} style={categoryStyle}>
                <h3 style={categoryTitleStyle}>{category}</h3>
                <div style={shortcutListStyle}>
                  {shortcuts.map((shortcut, index) => (
                    <div
                      key={`${category}-${index}`}
                      style={shortcutItemStyle}
                    >
                      <span style={descriptionStyle}>{shortcut.description}</span>
                      <div style={keysStyle}>
                        <span style={keyBadgeStyle}>
                          {formatShortcut(shortcut)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes slideIn {
            from {
              opacity: 0;
              transform: scale(0.95) translateY(-10px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            @keyframes fadeIn {
              from, to {
                opacity: 1;
              }
            }

            @keyframes slideIn {
              from, to {
                opacity: 1;
                transform: scale(1) translateY(0);
              }
            }
          }
        `}</style>
      </div>
    </div>
  );
};





