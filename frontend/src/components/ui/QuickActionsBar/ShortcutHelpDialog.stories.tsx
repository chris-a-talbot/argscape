/**
 * ShortcutHelpDialog Storybook Stories
 * 
 * Demonstrates all states and use cases for the keyboard shortcuts help dialog.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ShortcutHelpDialog } from './ShortcutHelpDialog';
import { KeyboardShortcutProvider } from './hooks/KeyboardShortcutProvider';
import type { KeyboardShortcut } from './QuickActionsBar.types';

const meta: Meta<typeof ShortcutHelpDialog> = {
  title: 'UI/QuickActionsBar/ShortcutHelpDialog',
  component: ShortcutHelpDialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Modal dialog that displays all available keyboard shortcuts, organized by category.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '100vw', height: '100vh', padding: '2rem' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ShortcutHelpDialog>;

/**
 * Interactive wrapper for stories
 */
function InteractiveWrapper({ 
  initialShortcuts = [],
  customShortcuts = [],
}: { 
  initialShortcuts?: KeyboardShortcut[];
  customShortcuts?: KeyboardShortcut[];
}) {
  const [open, setOpen] = useState(true);

  return (
    <KeyboardShortcutProvider>
      <MockShortcutRegistration shortcuts={initialShortcuts} />
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: '0.75rem 1.5rem',
          background: '#14E2A8',
          color: 'white',
          border: 'none',
          borderRadius: '0.5rem',
          fontSize: '1rem',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Show Keyboard Shortcuts (? or click)
      </button>
      <ShortcutHelpDialog
        open={open}
        onClose={() => setOpen(false)}
        customShortcuts={customShortcuts}
      />
    </KeyboardShortcutProvider>
  );
}

/**
 * Helper component to register shortcuts for demo
 */
function MockShortcutRegistration({ shortcuts }: { shortcuts: KeyboardShortcut[] }) {
  const { registerShortcut } = useKeyboardShortcutContext();
  
  React.useEffect(() => {
    shortcuts.forEach((shortcut) => {
      registerShortcut(shortcut);
    });
  }, [shortcuts, registerShortcut]);

  return null;
}

// Need to import this for the helper component
import React from 'react';
import { useKeyboardShortcutContext } from './hooks/KeyboardShortcutProvider';

/**
 * Default story with basic shortcuts
 */
export const Default: Story = {
  render: () => (
    <InteractiveWrapper
      initialShortcuts={[
        { key: 'f', action: () => {}, description: 'Toggle Filter panel' },
        { key: 'v', action: () => {}, description: 'Toggle View panel' },
        { key: 's', action: () => {}, description: 'Toggle Style panel' },
        { key: 'a', action: () => {}, description: 'Toggle Advanced panel' },
        { key: 'i', action: () => {}, description: 'Toggle Stats panel' },
        { key: 'Escape', action: () => {}, description: 'Close all panels' },
        { key: '?', action: () => {}, description: 'Show keyboard shortcuts help', modifiers: { shift: true } },
      ]}
    />
  ),
};

/**
 * Complete shortcuts from all visualizer features
 */
export const CompleteShortcuts: Story = {
  render: () => (
    <InteractiveWrapper
      initialShortcuts={[
        // Panel Navigation
        { key: 'f', action: () => {}, description: 'Toggle Filter panel' },
        { key: 'v', action: () => {}, description: 'Toggle View panel' },
        { key: 's', action: () => {}, description: 'Toggle Style panel' },
        { key: 'a', action: () => {}, description: 'Toggle Advanced panel' },
        { key: 'i', action: () => {}, description: 'Toggle Stats panel' },
        
        // View Controls
        { key: '1', action: () => {}, description: 'Camera preset: Fit to view' },
        { key: '2', action: () => {}, description: 'Camera preset: Medium distance' },
        { key: '3', action: () => {}, description: 'Camera preset: Far view' },
        { key: '4', action: () => {}, description: 'Camera preset: Top view' },
        { key: '5', action: () => {}, description: 'Camera preset: Side view' },
        { key: '6', action: () => {}, description: 'Camera preset: Isometric' },
        
        // Filters
        { key: 'g', action: () => {}, description: 'Toggle genomic range filter' },
        { key: 't', action: () => {}, description: 'Toggle temporal filter' },
        { key: 'h', action: () => {}, description: 'Toggle highlight mode' },
        
        // Selection
        { key: 'Enter', action: () => {}, description: 'View SubARG for selected node' },
        { key: 'Shift+Enter', action: () => {}, description: 'View ancestors for selected node', modifiers: { shift: true } },
        { key: 'Delete', action: () => {}, description: 'Clear selection' },
        
        // Actions
        { key: ' ', action: () => {}, description: 'Play/pause animation' },
        { key: 'r', action: () => {}, description: 'Reset view/camera' },
        { key: 'Ctrl+z', action: () => {}, description: 'Undo last action', modifiers: { ctrl: true } },
        { key: 'Ctrl+Shift+z', action: () => {}, description: 'Redo last action', modifiers: { ctrl: true, shift: true } },
        
        // Help
        { key: 'Escape', action: () => {}, description: 'Close panels/dialogs' },
        { key: '?', action: () => {}, description: 'Show this help', modifiers: { shift: true } },
      ]}
    />
  ),
};

/**
 * With modifier keys (Ctrl, Alt, Shift, Meta)
 */
export const WithModifiers: Story = {
  render: () => (
    <InteractiveWrapper
      initialShortcuts={[
        { key: 's', action: () => {}, description: 'Save current view', modifiers: { ctrl: true } },
        { key: 'o', action: () => {}, description: 'Open file', modifiers: { ctrl: true } },
        { key: 'p', action: () => {}, description: 'Print', modifiers: { ctrl: true } },
        { key: 'z', action: () => {}, description: 'Undo', modifiers: { ctrl: true } },
        { key: 'z', action: () => {}, description: 'Redo', modifiers: { ctrl: true, shift: true } },
        { key: 'Tab', action: () => {}, description: 'Next element', modifiers: { shift: true } },
        { key: 'ArrowLeft', action: () => {}, description: 'Jump to start', modifiers: { alt: true } },
        { key: 'ArrowRight', action: () => {}, description: 'Jump to end', modifiers: { alt: true } },
        { key: ',', action: () => {}, description: 'Open settings', modifiers: { meta: true } },
      ]}
    />
  ),
};

/**
 * Custom shortcuts passed as prop
 */
export const WithCustomShortcuts: Story = {
  render: () => (
    <InteractiveWrapper
      initialShortcuts={[
        { key: 'f', action: () => {}, description: 'Toggle Filter panel' },
        { key: 'v', action: () => {}, description: 'Toggle View panel' },
      ]}
      customShortcuts={[
        { key: 'Ctrl+c', action: () => {}, description: 'Copy selection', modifiers: { ctrl: true } },
        { key: 'Ctrl+v', action: () => {}, description: 'Paste', modifiers: { ctrl: true } },
        { key: 'Ctrl+x', action: () => {}, description: 'Cut selection', modifiers: { ctrl: true } },
      ]}
    />
  ),
};

/**
 * Empty state (no shortcuts registered)
 */
export const EmptyState: Story = {
  render: () => <InteractiveWrapper initialShortcuts={[]} />,
};

/**
 * Single category
 */
export const SingleCategory: Story = {
  render: () => (
    <InteractiveWrapper
      initialShortcuts={[
        { key: 'f', action: () => {}, description: 'Toggle Filter panel' },
        { key: 'v', action: () => {}, description: 'Toggle View panel' },
        { key: 's', action: () => {}, description: 'Toggle Style panel' },
      ]}
    />
  ),
};

/**
 * Light theme
 */
export const LightTheme: Story = {
  render: () => (
    <div style={{ background: 'white', padding: '2rem', minHeight: '100vh' }}>
      <InteractiveWrapper
        initialShortcuts={[
          { key: 'f', action: () => {}, description: 'Toggle Filter panel' },
          { key: 'v', action: () => {}, description: 'Toggle View panel' },
          { key: 's', action: () => {}, description: 'Toggle Style panel' },
          { key: 'Escape', action: () => {}, description: 'Close all panels' },
        ]}
      />
    </div>
  ),
};

/**
 * Dark theme
 */
export const DarkTheme: Story = {
  render: () => (
    <div style={{ background: '#1a1a1a', padding: '2rem', minHeight: '100vh' }}>
      <InteractiveWrapper
        initialShortcuts={[
          { key: 'f', action: () => {}, description: 'Toggle Filter panel' },
          { key: 'v', action: () => {}, description: 'Toggle View panel' },
          { key: 's', action: () => {}, description: 'Toggle Style panel' },
          { key: 'Escape', action: () => {}, description: 'Close all panels' },
        ]}
      />
    </div>
  ),
};

/**
 * Keyboard navigation demo
 */
export const KeyboardNavigationTest: Story = {
  render: () => (
    <div>
      <p style={{ marginBottom: '1rem', color: '#666' }}>
        <strong>Test keyboard navigation:</strong>
        <br />
        1. Click "Show Keyboard Shortcuts" button
        <br />
        2. Press Tab to navigate through dialog
        <br />
        3. Press Escape to close
        <br />
        4. Focus returns to button
      </p>
      <InteractiveWrapper
        initialShortcuts={[
          { key: 'f', action: () => {}, description: 'Toggle Filter panel' },
          { key: 'v', action: () => {}, description: 'Toggle View panel' },
          { key: 's', action: () => {}, description: 'Toggle Style panel' },
          { key: 'Escape', action: () => {}, description: 'Close all panels' },
        ]}
      />
    </div>
  ),
};

/**
 * Accessibility test
 */
export const AccessibilityTest: Story = {
  render: () => (
    <div>
      <p style={{ marginBottom: '1rem', color: '#666' }}>
        <strong>Accessibility features:</strong>
        <br />
        ✓ ARIA labels on all elements
        <br />
        ✓ Focus trap within dialog
        <br />
        ✓ ESC key to close
        <br />
        ✓ Tab navigation
        <br />
        ✓ Screen reader friendly
      </p>
      <InteractiveWrapper
        initialShortcuts={[
          { key: 'f', action: () => {}, description: 'Toggle Filter panel' },
          { key: 'v', action: () => {}, description: 'Toggle View panel' },
          { key: 's', action: () => {}, description: 'Toggle Style panel' },
        ]}
      />
    </div>
  ),
};





