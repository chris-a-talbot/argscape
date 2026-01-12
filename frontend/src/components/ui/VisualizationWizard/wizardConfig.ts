// Visualization Wizard Configuration
// Thresholds and settings for the guided visualization setup

export const WIZARD_THRESHOLDS = {
  // Sample recommendations
  LARGE_SAMPLE_COUNT: 100,
  RECOMMENDED_MAX_SAMPLES: 50,
  MIN_SAMPLES: 2,

  // Edge-based performance thresholds (primary metric)
  EDGE_GOOD_PERFORMANCE: 1000,       // <1000 edges = good performance
  EDGE_MODERATE_PERFORMANCE: 3000,   // 1000-3000 edges = moderate performance
  // >3000 edges = poor performance

  // Node recommendations (secondary, for clustering/heatmap suggestions)
  CLUSTERING_RECOMMENDED: 250,
  HEATMAP_RECOMMENDED: 500,
  SKIP_PERFORMANCE_STEP: 100, // Skip performance step if nodes < this

  // Tree recommendations
  MANY_TREES: 100,
  TREE_FILTER_RECOMMENDED: 500,
};

export type VisualizationType = '2d' | '3d' | 'diff';

export type WizardStep = 'scope' | 'region' | 'performance' | 'summary';

export type DataScopeOption = 'full' | 'subset' | 'focal';
export type SubsetMethod = 'random' | 'range' | 'specific';
export type FocalMode = 'subgraph' | 'ancestors';
export type RegionOption = 'full' | 'filtered';
export type PerformanceLevel = 'good' | 'moderate' | 'poor';

export interface WizardSettings {
  // Data scope
  dataScope: DataScopeOption;

  // Sample subset options (when dataScope === 'subset')
  subsetMethod: SubsetMethod;
  sampleCount: number;           // For random method
  sampleRangeStart: number;      // For range method
  sampleRangeEnd: number;        // For range method
  sampleIds: number[];           // For specific method

  // Focal node options (when dataScope === 'focal')
  focalMode: FocalMode;
  focalNodeId: number | null;

  // Region filter
  regionFilter: RegionOption;
  genomicRange: [number, number] | null;
  treeRange: [number, number] | null;
  filterMode: 'base_pairs' | 'tree_indices';

  // Performance options
  enableClustering: boolean;
  enableHeatmap: boolean; // 3D only

  // Time range (passed through from advanced settings)
  temporalRange: [number, number] | null;
}

export interface TreeSequenceStats {
  numNodes: number;
  numEdges: number;
  numSamples: number;
  numTrees: number;
  sequenceLength: number;
  hasTemporal: boolean;
  hasAllSpatial: boolean;
  temporalRange?: { min: number; max: number };
}

export interface ComplexityEstimate {
  estimatedNodes: number;
  estimatedEdges: number;
  level: PerformanceLevel;
  warnings: string[];
  recommendations: string[];
}

/**
 * Estimate visualization complexity based on settings
 */
export function estimateComplexity(
  stats: TreeSequenceStats,
  settings: WizardSettings
): ComplexityEstimate {
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Estimate node count
  let estimatedNodes = stats.numNodes;
  let estimatedEdges = stats.numEdges;

  // Adjust for sample subsetting
  if (settings.dataScope === 'subset') {
    let effectiveSampleCount = stats.numSamples;

    switch (settings.subsetMethod) {
      case 'random':
        effectiveSampleCount = settings.sampleCount;
        break;
      case 'range':
        effectiveSampleCount = Math.max(1, settings.sampleRangeEnd - settings.sampleRangeStart + 1);
        break;
      case 'specific':
        effectiveSampleCount = settings.sampleIds.length || stats.numSamples;
        break;
    }

    if (effectiveSampleCount < stats.numSamples) {
      const sampleRatio = effectiveSampleCount / stats.numSamples;
      // Rough estimate: node count scales somewhat linearly with samples
      estimatedNodes = Math.round(estimatedNodes * sampleRatio * 1.5); // 1.5x for internal nodes
      estimatedEdges = Math.round(estimatedEdges * sampleRatio * 1.2);
    }
  }

  // Adjust for focal node view (much smaller than full ARG)
  if (settings.dataScope === 'focal' && settings.focalNodeId !== null) {
    // Focal views typically show a small portion of the ARG
    // Subgraph shows descendants, ancestors shows path to root
    const focalRatio = settings.focalMode === 'subgraph' ? 0.3 : 0.2;
    estimatedNodes = Math.round(estimatedNodes * focalRatio);
    estimatedEdges = Math.round(estimatedEdges * focalRatio);
  }

  // Adjust for region filtering
  if (settings.regionFilter === 'filtered') {
    let regionRatio = 1;
    if (settings.filterMode === 'tree_indices' && settings.treeRange) {
      const treeSpan = settings.treeRange[1] - settings.treeRange[0];
      regionRatio = treeSpan / stats.numTrees;
    } else if (settings.filterMode === 'base_pairs' && settings.genomicRange) {
      const bpSpan = settings.genomicRange[1] - settings.genomicRange[0];
      regionRatio = bpSpan / stats.sequenceLength;
    }
    // Edges are more affected by region filtering than nodes
    estimatedEdges = Math.round(estimatedEdges * regionRatio);
    // Nodes are somewhat affected
    estimatedNodes = Math.round(estimatedNodes * Math.sqrt(regionRatio));
  }

  // Adjust for clustering (reduces visible nodes)
  if (settings.enableClustering) {
    estimatedNodes = Math.round(estimatedNodes * 0.6); // Rough 40% reduction
  }

  // Determine performance level based on EDGES (primary metric)
  let level: PerformanceLevel = 'good';
  if (estimatedEdges > WIZARD_THRESHOLDS.EDGE_MODERATE_PERFORMANCE) {
    level = 'poor';
    warnings.push(`High complexity with ~${estimatedEdges.toLocaleString()} edges may cause performance issues`);
    warnings.push('Consider filtering by genomic region or enabling node clustering');
  } else if (estimatedEdges > WIZARD_THRESHOLDS.EDGE_GOOD_PERFORMANCE) {
    level = 'moderate';
    warnings.push(`Moderate complexity with ~${estimatedEdges.toLocaleString()} edges`);
  }

  // Add recommendations based on both nodes and edges
  if (estimatedEdges > WIZARD_THRESHOLDS.EDGE_GOOD_PERFORMANCE && !settings.enableClustering) {
    recommendations.push('Enable clustering to reduce edge complexity');
  }
  if (estimatedNodes > WIZARD_THRESHOLDS.CLUSTERING_RECOMMENDED && !settings.enableClustering) {
    recommendations.push('Enable clustering to improve performance');
  }
  if (estimatedNodes > WIZARD_THRESHOLDS.HEATMAP_RECOMMENDED && !settings.enableHeatmap) {
    recommendations.push('Consider heatmap mode for large datasets');
  }
  if (estimatedEdges > WIZARD_THRESHOLDS.EDGE_MODERATE_PERFORMANCE) {
    recommendations.push('Filter by genomic region to reduce visible edges');
  }

  return {
    estimatedNodes,
    estimatedEdges,
    level,
    warnings,
    recommendations,
  };
}

/**
 * Get default wizard settings
 */
export function getDefaultSettings(stats: TreeSequenceStats): WizardSettings {
  const shouldSubset = stats.numSamples > WIZARD_THRESHOLDS.LARGE_SAMPLE_COUNT;

  return {
    dataScope: shouldSubset ? 'subset' : 'full',

    // Subset options
    subsetMethod: 'random',
    sampleCount: Math.min(WIZARD_THRESHOLDS.RECOMMENDED_MAX_SAMPLES, stats.numSamples),
    sampleRangeStart: 0,
    sampleRangeEnd: Math.min(WIZARD_THRESHOLDS.RECOMMENDED_MAX_SAMPLES, stats.numSamples) - 1,
    sampleIds: [],

    // Focal options
    focalMode: 'subgraph',
    focalNodeId: null,

    // Region filter
    regionFilter: 'full',
    genomicRange: null,
    treeRange: null,
    filterMode: 'base_pairs',

    // Performance
    enableClustering: stats.numNodes > WIZARD_THRESHOLDS.CLUSTERING_RECOMMENDED,
    enableHeatmap: false,
    temporalRange: null,
  };
}

/**
 * Determine which steps to show based on visualization type and data
 */
export function getWizardSteps(
  vizType: VisualizationType,
  stats: TreeSequenceStats,
  hasPreConfigured: boolean
): WizardStep[] {
  // If pre-configured, go straight to summary
  if (hasPreConfigured) {
    return ['summary'];
  }

  const steps: WizardStep[] = ['scope'];

  // Always show region step for non-trivial sequences
  if (stats.numTrees > 1) {
    steps.push('region');
  }

  // Show performance step if the ARG is large enough
  // Skip for 'diff' visualization (no performance options available)
  if (vizType !== 'diff' && stats.numNodes >= WIZARD_THRESHOLDS.SKIP_PERFORMANCE_STEP) {
    steps.push('performance');
  }

  steps.push('summary');
  return steps;
}

/**
 * Check if user has pre-configured any advanced settings
 */
export function hasPreConfiguredSettings(
  temporalRange: [number, number] | null,
  genomicRange: [number, number] | null,
  sampleSubsetMode: string,
  focusMode: string,
  enableClustering: boolean,
  heatmapOnlyMode: boolean
): boolean {
  // Check if any non-default settings are configured
  if (temporalRange !== null) return true;
  if (genomicRange !== null) return true;
  if (sampleSubsetMode !== 'even') return true;
  if (focusMode !== 'none') return true;
  if (enableClustering) return true;
  if (heatmapOnlyMode) return true;
  return false;
}
