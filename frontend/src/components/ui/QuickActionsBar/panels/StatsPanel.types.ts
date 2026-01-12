/**
 * StatsPanel Type Definitions
 * 
 * Types for the statistics display panel component in Quick Actions Bar
 */

import { ReactNode } from 'react';

/**
 * Node/Edge count statistics showing filtering pipeline
 */
export interface NodeEdgeStats {
  /** Original node count in tree sequence */
  originalNodes: number;
  /** Nodes after subset filtering */
  subsetNodes: number;
  /** Nodes actually displayed (after clustering, etc.) */
  displayedNodes: number;
  /** Original edge count */
  originalEdges: number;
  /** Edges after subset filtering */
  subsetEdges: number;
  /** Edges actually displayed */
  displayedEdges: number;
}

/**
 * Tree sequence metadata statistics
 */
export interface SequenceStats {
  /** Number of sample nodes */
  samples: number;
  /** Sequence length (number of sites) */
  sites: number;
  /** Number of trees in sequence */
  trees: number;
  /** Total mutation count */
  mutations: number;
  /** Number of populations (if applicable) */
  populations?: number;
  /** Number of individuals (if applicable) */
  individuals?: number;
}

/**
 * Population genetics statistics
 */
export interface PopGenStats {
  // Core stats (always shown)
  nucleotide_diversity?: number | null;
  wattersons_theta?: number | null;
  tajimas_d?: number | null;
  segregating_sites?: number | null;
  tmrca?: number | null;

  // Advanced stats (shown in expandable section)
  mean_tree_height?: number | null;
  median_tree_height?: number | null;
  mean_tree_length?: number | null;
  median_tree_length?: number | null;
  mean_tmrca?: number | null;
  median_tmrca?: number | null;
  ne_watterson?: number | null;
  ne_pi?: number | null;
  estimated_recombination_rate?: number | null;
  mean_ld_r2?: number | null;
  median_ld_r2?: number | null;

  // Population structure (only if multiple populations)
  fst?: number | null;
  num_populations?: number | null;
  mean_divergence?: number | null;
}

/**
 * Props for PopGenStatsDisplay component
 */
export interface PopGenStatsDisplayProps {
  /** Full sequence population genetics stats */
  fullStats?: PopGenStats | null;
  /** Window-specific stats (when genomic filtering is active) */
  windowStats?: PopGenStats | null;
  /** Whether window stats are loading */
  windowStatsLoading?: boolean;
  /** Whether genomic filtering is currently active */
  isGenomicFilterActive?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * Performance monitoring statistics
 */
export interface PerformanceStats {
  /** Current frames per second */
  fps: number;
  /** Memory usage in MB (if available) */
  memoryMB?: number;
  /** Render time for last frame in ms */
  lastFrameTime?: number;
  /** Average frame time over recent window */
  avgFrameTime?: number;
}

/**
 * Active filter summary
 */
export interface FilterSummary {
  /** Genomic range filter (if active) */
  genomicRange?: {
    start: number;
    end: number;
    sequenceLength: number;
  };
  /** Tree range filter (if active) */
  treeRange?: {
    startIndex: number;
    endIndex: number;
    totalTrees: number;
  };
  /** Temporal range filter (if active) */
  temporalRange?: {
    min: number;
    max: number;
    originalMin: number;
    originalMax: number;
  };
  /** Filter mode */
  mode: 'subset' | 'highlight';
  /** Population filters (if any) */
  populationFilters?: string[];
  /** Node type filters (if any) */
  nodeTypeFilters?: string[];
}

/**
 * Export format options
 */
export type ExportFormat = 'csv' | 'json' | 'tsv';

/**
 * Export data structure
 */
export interface ExportData {
  /** Timestamp of export */
  timestamp: string;
  /** Node/edge statistics */
  nodeEdgeStats: NodeEdgeStats;
  /** Sequence statistics */
  sequenceStats: SequenceStats;
  /** Performance statistics */
  performanceStats?: PerformanceStats;
  /** Filter summary */
  filterSummary?: FilterSummary;
}

/**
 * Props for StatsPanel component
 */
export interface StatsPanelProps {
  /** Node/edge count statistics */
  nodeEdgeStats: NodeEdgeStats;
  /** Sequence statistics */
  sequenceStats: SequenceStats;
  /** Population genetics statistics (full sequence) */
  popGenStats?: PopGenStats | null;
  /** Population genetics statistics (window only, when genomic filtering active) */
  windowPopGenStats?: PopGenStats | null;
  /** Whether window stats are loading */
  windowStatsLoading?: boolean;
  /** Whether genomic filtering is currently active */
  isGenomicFilterActive?: boolean;
  /** Performance statistics (optional) */
  performanceStats?: PerformanceStats;
  /** Active filter summary (optional) */
  filterSummary?: FilterSummary;
  /** Whether to show export functionality */
  showExport?: boolean;
  /** Handler for export action */
  onExport?: (format: ExportFormat) => void;
  /** Custom className */
  className?: string;
  /** Whether to show performance stats */
  showPerformance?: boolean;
}

/**
 * Props for NodeEdgeCountDisplay component
 */
export interface NodeEdgeCountDisplayProps {
  /** Node/edge statistics */
  stats: NodeEdgeStats;
  /** Custom className */
  className?: string;
  /** Whether to show the pipeline visualization */
  showPipeline?: boolean;
}

/**
 * Props for SequenceStatsDisplay component
 */
export interface SequenceStatsDisplayProps {
  /** Sequence statistics */
  stats: SequenceStats;
  /** Custom className */
  className?: string;
  /** Compact mode (smaller display) */
  compact?: boolean;
}

/**
 * Props for PerformanceStatsDisplay component
 */
export interface PerformanceStatsDisplayProps {
  /** Performance statistics */
  stats: PerformanceStats;
  /** Custom className */
  className?: string;
  /** Update interval in ms (for FPS monitoring) */
  updateInterval?: number;
  /** Whether to show memory usage */
  showMemory?: boolean;
}

/**
 * Props for FilterSummaryDisplay component
 */
export interface FilterSummaryDisplayProps {
  /** Filter summary */
  summary: FilterSummary;
  /** Custom className */
  className?: string;
  /** Whether to show in compact mode */
  compact?: boolean;
  /** Handler to clear all filters */
  onClearFilters?: () => void;
}

/**
 * Stat item for display
 */
export interface StatItem {
  /** Stat label */
  label: string;
  /** Stat value (formatted) */
  value: string | number;
  /** Optional icon */
  icon?: ReactNode;
  /** Optional description/tooltip */
  description?: string;
  /** Whether to emphasize this stat */
  emphasize?: boolean;
}

/**
 * Stat group for organization
 */
export interface StatGroup {
  /** Group title */
  title: string;
  /** Group icon */
  icon?: ReactNode;
  /** Stat items in this group */
  items: StatItem[];
  /** Whether group is collapsible */
  collapsible?: boolean;
  /** Default expanded state (if collapsible) */
  defaultExpanded?: boolean;
}





