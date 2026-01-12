/**
 * QuickActionsBar Type Definitions
 * 
 * Defines all TypeScript interfaces and types for the Quick Actions Bar system,
 * following the UI Refactor Proposal for simplified & accessible visualization controls.
 */

import { ReactNode } from 'react';

/**
 * Tab identifiers for the Quick Actions Bar
 */
export type QuickActionTab =
  | 'filter'
  | 'nodes'
  | 'edges'
  | 'mutations'
  | 'layout'
  | 'stats'
  | 'export'
  // 3D-specific tabs
  | 'camera'
  | 'spatial'
  // Diff-specific tabs
  | 'diff';

/**
 * Panel visibility state
 */
export type PanelState = 'open' | 'closed' | 'minimized';

/**
 * Individual tab configuration
 */
export interface TabConfig {
  /** Unique tab identifier */
  id: QuickActionTab;
  /** Display label */
  label: string;
  /** Icon component or element (optional - tabs can be text-only) */
  icon?: ReactNode;
  /** Keyboard shortcut (single letter) */
  shortcut: string;
  /** Whether tab is disabled */
  disabled?: boolean;
  /** Optional badge content (e.g., count of active filters) */
  badge?: string | number;
  /** ARIA label for accessibility */
  ariaLabel?: string;
}

/**
 * Panel content configuration
 */
export interface PanelConfig {
  /** Associated tab ID */
  tabId: QuickActionTab;
  /** Panel content */
  content: ReactNode;
  /** Whether panel can be minimized */
  minimizable?: boolean;
  /** Default height (in pixels or 'auto') */
  defaultHeight?: number | 'auto';
  /** Maximum height constraint */
  maxHeight?: number;
  /** Custom panel header (optional) */
  header?: ReactNode;
}

/**
 * Props for QuickActionsBar component
 */
export interface QuickActionsBarProps {
  /** Array of tab configurations */
  tabs: TabConfig[];
  /** Array of panel configurations */
  panels: PanelConfig[];
  /** Currently active tab */
  activeTab: QuickActionTab | null;
  /** Handler when tab is clicked or activated via keyboard */
  onTabChange: (tabId: QuickActionTab | null) => void;
  /** Whether keyboard shortcuts are enabled */
  enableKeyboardShortcuts?: boolean;
  /** Whether to show keyboard shortcut hints on tabs */
  showShortcutHints?: boolean;
  /** Custom className for styling */
  className?: string;
  /** Whether to show help button */
  showHelpButton?: boolean;
  /** Handler for help button click */
  onHelpClick?: () => void;
  /** Whether the bar is in compact mode (reduced spacing) */
  compact?: boolean;
  /** Additional content to render on the right side of tabs (e.g., settings button) */
  rightContent?: ReactNode;
  /** Whether the bar floats over the visualization instead of being a separate row */
  floating?: boolean;
}

/**
 * Props for TabPanel component
 */
export interface TabPanelProps {
  /** Tab configuration */
  tab: TabConfig;
  /** Whether this tab is currently active */
  isActive: boolean;
  /** Click handler */
  onClick: () => void;
  /** Custom className */
  className?: string;
  /** Whether to show keyboard shortcut hint badge */
  showShortcutHint?: boolean;
}

/**
 * Props for Panel content wrapper
 */
export interface PanelContentProps {
  /** Panel configuration */
  panel: PanelConfig;
  /** Whether panel is visible */
  isOpen: boolean;
  /** Panel state (open/closed/minimized) */
  state: PanelState;
  /** Handler to toggle minimize state */
  onToggleMinimize?: () => void;
  /** Handler to close panel */
  onClose: () => void;
  /** Custom className */
  className?: string;
}

/**
 * Keyboard shortcut mapping
 */
export interface KeyboardShortcut {
  /** Key to trigger shortcut */
  key: string;
  /** Action to perform */
  action: () => void;
  /** Description for help dialog */
  description: string;
  /** Optional modifier keys */
  modifiers?: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
  };
}

/**
 * Panel animation configuration
 */
export interface PanelAnimationConfig {
  /** Animation duration in milliseconds */
  duration: number;
  /** CSS easing function */
  easing: string;
  /** Whether to use reduced motion (respects user preference) */
  reducedMotion?: boolean;
}

/**
 * Quick Actions Bar configuration state
 */
export interface QuickActionsBarState {
  /** Currently active tab */
  activeTab: QuickActionTab | null;
  /** Panel state for each tab */
  panelStates: Record<QuickActionTab, PanelState>;
  /** Whether keyboard shortcuts are enabled */
  keyboardShortcutsEnabled: boolean;
  /** Whether help dialog is visible */
  helpDialogOpen: boolean;
}

/**
 * Context Panel Types (for Phase 2)
 */

export type ContextPanelType = 'node-inspector' | 'edge-inspector' | 'cluster-details' | 'diff-details';

export interface ContextPanelConfig {
  /** Panel type identifier */
  type: ContextPanelType;
  /** Panel title */
  title: string;
  /** Panel content */
  content: ReactNode;
  /** Width in pixels or percentage */
  width?: number | string;
  /** Whether panel can be closed */
  closable?: boolean;
  /** Z-index for stacking */
  zIndex?: number;
}

export interface ContextPanelProps {
  /** Panel configuration */
  panel: ContextPanelConfig;
  /** Whether panel is visible */
  isOpen: boolean;
  /** Handler to close panel */
  onClose: () => void;
  /** Custom className */
  className?: string;
}

/**
 * Hook return types
 */

export interface UsePanelStateReturn {
  /** Current active tab */
  activeTab: QuickActionTab | null;
  /** Set active tab */
  setActiveTab: (tab: QuickActionTab | null) => void;
  /** Toggle tab (open if closed, close if open) */
  toggleTab: (tab: QuickActionTab) => void;
  /** Close all panels */
  closeAllPanels: () => void;
  /** Panel states */
  panelStates: Record<QuickActionTab, PanelState>;
  /** Set panel state */
  setPanelState: (tab: QuickActionTab, state: PanelState) => void;
}

export interface UseKeyboardShortcutsReturn {
  /** Register a keyboard shortcut */
  registerShortcut: (shortcut: KeyboardShortcut) => void;
  /** Unregister a keyboard shortcut */
  unregisterShortcut: (key: string) => void;
  /** Enable/disable keyboard shortcuts globally */
  setEnabled: (enabled: boolean) => void;
  /** Whether keyboard shortcuts are enabled */
  enabled: boolean;
  /** All registered shortcuts (for help dialog) */
  shortcuts: KeyboardShortcut[];
}

