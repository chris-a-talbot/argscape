/**
 * QuickActionsBar Module Exports
 * 
 * Central export file for all Quick Actions Bar components, hooks, and types.
 */

// Main Components
export { QuickActionsBar } from './QuickActionsBar';
export { TabPanel } from './TabPanel';
export { ContextPanel } from './ContextPanel';
export { ShortcutHelpDialog } from './ShortcutHelpDialog';

// Hooks
export { usePanelState } from './hooks/usePanelState';
export { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
export { 
  KeyboardShortcutProvider, 
  useKeyboardShortcutContext 
} from './hooks/KeyboardShortcutProvider';

// Panel Components

// Style Panel (Phase 1: Task 1.2c) ✅ COMPLETE
export {
  StylePanel,
  UnifiedSlider,
  ColorBySelector,
  ThemeToggle,
  SizePreview,
} from './panels';

// Filter Panel components (Phase 1: Task 1.2a - In Progress)
// export { FilterPanel, FilterGroup, FilterModeToggle, OpacitySlider } from './panels';

// View Panel components (Phase 1: Task 1.2b - In Progress)
// export { ViewPanel, CameraPresetPicker, LayoutPresetPicker, ViewModeToggles, AnimationControls } from './panels';

// Stats Panel components (Phase 1: Task 1.2d - In Progress)
// export { StatsPanel, NodeEdgeCountDisplay, SequenceStatsDisplay, PerformanceStatsDisplay, FilterSummaryDisplay } from './panels';

// Types
export type {
  QuickActionTab,
  PanelState,
  TabConfig,
  PanelConfig,
  QuickActionsBarProps,
  TabPanelProps,
  PanelContentProps,
  KeyboardShortcut,
  PanelAnimationConfig,
  QuickActionsBarState,
  ContextPanelType,
  ContextPanelConfig,
  ContextPanelProps,
  UsePanelStateReturn,
  UseKeyboardShortcutsReturn,
} from './QuickActionsBar.types';

// Style Panel types (Phase 1: Task 1.2c) ✅ COMPLETE
export type {
  SliderConfig,
  ColorByMode,
  ColorBySelectorProps,
  ThemeToggleProps,
  UnifiedSliderProps,
  StylePanelProps,
  SizePreviewProps,
} from './panels';

// Filter Panel types (Phase 1: Task 1.2a - In Progress)
export type {
  FilterMode,
  TreeInterval,
} from './panels';

