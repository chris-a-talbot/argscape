/**
 * FilterPanel Type Definitions
 * 
 * Types for the unified filter panel component in Quick Actions Bar
 */

import { ReactNode } from 'react';

/**
 * Filter mode - controls how filtering affects visualization
 */
export type FilterMode = 'subset' | 'highlight';

/**
 * Tree interval structure for tree range filtering
 */
export interface TreeInterval {
  index: number;
  left: number;
  right: number;
}

/**
 * Configuration for genomic range filtering
 */
export interface GenomicFilterConfig {
  /** Whether genomic filtering is available */
  enabled: boolean;
  /** Sequence length (max value for slider) */
  sequenceLength: number;
  /** Current genomic range [start, end] */
  value: [number, number];
  /** Handler for genomic range changes */
  onChange: (value: [number, number]) => void;
  /** Custom formatter for genomic positions */
  formatValue?: (value: number) => string;
}

/**
 * Configuration for tree range filtering
 */
export interface TreeFilterConfig {
  /** Whether tree filtering is available */
  enabled: boolean;
  /** Array of tree intervals */
  treeIntervals: TreeInterval[];
  /** Current tree range [start_idx, end_idx] */
  value: [number, number];
  /** Handler for tree range changes */
  onChange: (value: [number, number]) => void;
}

/**
 * Configuration for temporal range filtering
 */
export interface TemporalFilterConfig {
  /** Whether temporal filtering is available */
  enabled: boolean;
  /** Minimum time value */
  min: number;
  /** Maximum time value */
  max: number;
  /** Current temporal range [start, end] */
  value: [number, number];
  /** Handler for temporal range changes */
  onChange: (value: [number, number]) => void;
  /** Custom formatter for time values */
  formatValue?: (value: number) => string;
  /** Vertical slider height (default: 400px) */
  height?: number;
}

/**
 * Filter type - genomic position or tree index
 */
export type FilterType = 'genomic' | 'tree';

/**
 * Props for FilterPanel component
 */
export interface FilterPanelProps {
  /** Genomic filtering configuration */
  genomicFilter?: GenomicFilterConfig;
  /** Tree filtering configuration */
  treeFilter?: TreeFilterConfig;
  /** Temporal filtering configuration */
  temporalFilter?: TemporalFilterConfig;
  /** Current filter type (genomic or tree) - mutually exclusive */
  filterType?: FilterType;
  /** Handler for filter type changes */
  onFilterTypeChange?: (type: FilterType) => void;
  /** Whether genomic/tree filter is enabled (shows slider alongside viz) */
  spatialFilterEnabled?: boolean;
  /** Handler for spatial filter toggle */
  onSpatialFilterToggle?: (enabled: boolean) => void;
  /** Whether temporal filter is enabled (shows slider alongside viz) */
  temporalFilterEnabled?: boolean;
  /** Handler for temporal filter toggle */
  onTemporalFilterToggle?: (enabled: boolean) => void;
  /** Current spatial filter mode (subset or highlight) for genomic/tree */
  filterMode: FilterMode;
  /** Handler for spatial filter mode changes */
  onFilterModeChange: (mode: FilterMode) => void;
  /** Dim opacity for spatial highlight mode (0-1) */
  dimOpacity: number;
  /** Handler for spatial opacity changes */
  onDimOpacityChange: (opacity: number) => void;
  /** Current temporal filter mode (subset or highlight) */
  temporalFilterMode?: FilterMode;
  /** Handler for temporal filter mode changes */
  onTemporalFilterModeChange?: (mode: FilterMode) => void;
  /** Dim opacity for temporal highlight mode (0-1) */
  temporalDimOpacity?: number;
  /** Handler for temporal opacity changes */
  onTemporalDimOpacityChange?: (opacity: number) => void;
  /** Custom className */
  className?: string;
  /** Whether to show the mode toggle */
  showModeToggle?: boolean;
}

/**
 * Props for FilterGroup component
 */
export interface FilterGroupProps {
  /** Group label */
  label: string;
  /** Group icon (optional) */
  icon?: ReactNode;
  /** Group content */
  children: ReactNode;
  /** Whether group is collapsible */
  collapsible?: boolean;
  /** Whether group is expanded by default (if collapsible) */
  defaultExpanded?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * Props for FilterModeToggle component
 */
export interface FilterModeToggleProps {
  /** Current mode */
  value: FilterMode;
  /** Handler for mode changes */
  onChange: (mode: FilterMode) => void;
  /** Whether toggle is disabled */
  disabled?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * Props for OpacitySlider component
 */
export interface OpacitySliderProps {
  /** Current opacity value (0-1) */
  value: number;
  /** Handler for opacity changes */
  onChange: (value: number) => void;
  /** Whether slider is disabled */
  disabled?: boolean;
  /** Custom label */
  label?: string;
  /** Custom className */
  className?: string;
}





