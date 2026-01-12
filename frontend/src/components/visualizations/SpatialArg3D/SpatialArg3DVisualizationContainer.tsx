import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import SpatialArg3DVisualization from './SpatialArg3DVisualization';
import { SpatialArg3DControls } from './SpatialArg3DControls';
import { SpatialArg3DLegend } from './SpatialArg3DLegend';
import { SpatialArg3DAnimationPopout } from './SpatialArg3DAnimationPopout';
import { GraphData, GraphNode, TreeInterval, GeographicShape } from '../ForceDirectedGraph/ForceDirectedGraph.types';
import { RangeSlider } from '../../ui/range-slider';
import { TreeRangeSlider } from '../../ui/tree-range-slider';
import { TemporalRangeSlider } from '../../ui/temporal-range-slider';
import { api } from '../../../lib/api';
import { useColorTheme } from '../../../context/ColorThemeContext';
import { useTreeSequence } from '../../../context/TreeSequenceContext';
import { TemporalSpacingMode, NodeIdSettings, EdgeMutationSettings, AncestryHeatmapSettings } from './SpatialArg3DVisualization.types';
import { KeyboardShortcutProvider } from '@/components/ui/QuickActionsBar/hooks/KeyboardShortcutProvider';
import type { GeographicMode as QuickActionsGeographicMode, CameraPreset } from '@/components/ui/QuickActionsBar/panels';
import { getDescendants, getAncestors, isRootNode } from '../../../utils/graphTraversal';
import { formatGenomicPosition } from '../../../utils/colorUtils';
import { convertTreeIntervals, validateSpatialData, initializeTemporalState } from '../../../utils/dataHelpers';
import { useElapsedTime, formatElapsedTime } from '../../../hooks/useElapsedTime';
import { useWindowStats } from '../../../hooks/useWindowStats';
import { isRailway } from '../../../config/constants';

type ViewMode = 'full' | 'subgraph' | 'ancestors';
type FilterMode = 'genomic' | 'tree';
type TemporalFilterMode = 'hide' | 'planes' | 'hybrid';
type GeographicMode = 'unit_grid' | 'eastern_hemisphere' | 'custom';

interface SpatialArg3DVisualizationContainerProps {
  filename: string;
  max_samples: number;
  temporalStart?: number;
  temporalEnd?: number;
  genomicStart?: number;
  genomicEnd?: number;
  treeStartIdx?: number;
  treeEndIdx?: number;
  initialHeatmapMode?: boolean; // Start with heatmap enabled and nodes hidden
}

// Constants
const CONTAINER_CONSTANTS = {
  DEFAULT_DIMENSIONS: { width: 800, height: 600 },
  DEBOUNCE_DELAY: 500,
  GENOMIC_STEP_DIVISOR: 1000,
  PERCENTAGE_PRECISION: 1,
  TIME_PRECISION: 3,
  TEMPORAL_STEP_DIVISOR: 1000,
  TEMPORAL_SLIDER_HEIGHT: 350,
  UNIT_GRID_SIZE: 10
};

const DEFAULT_VISUAL_SETTINGS = {
  temporalSpacing: 10,
  spatialSpacing: 160,
  temporalGridOpacity: 0,
  geographicShapeOpacity: 100,
  nodeSizes: {
    sample: 10,
    root: 12,
    other: 10
  },
  nodeIdSettings: {
    showSampleIds: true,
    showRootIds: true,
    showInternalIds: false
  },
  edgeLabelSettings: {
    showEdgeLabels: false,
    labelFontSize: 3
  },
  edgeMutationSettings: {
    showMutationMarkers: true,
    markerSize: 18
  },
  edgeThickness: 1.0,
  edgeOpacity: 60,
  isFilterSectionCollapsed: true,
  temporalSpacingMode: 'equal' as TemporalSpacingMode,
  heatmapSettings: {
    enabled: false,
    timeDepth: 60, // Default time depth for temporal slider mode (60% from top layer toward present)
    timeRangeMin: 0, // 0% = present (samples)
    timeRangeMax: 5, // 5% = default range for ground mode
    opacity: 80,
    resolution: 25,
    nodeVisibility: 'all' as 'all' | 'samples' | 'none',
    weightByTime: false // Down-weight older nodes as less spatially informative
  }
};

/**
 * Calculate default temporal spacing based on number of layers
 * @param numLayers - Number of unique time layers in the ARG
 * @returns Default temporal spacing value
 */
const calculateDefaultTemporalSpacing = (numLayers: number): number => {
  if (numLayers >= 125) return 2;
  if (numLayers >= 80) return 3;
  if (numLayers >= 40) return 4;
  if (numLayers >= 20) return 5;
  return 6;
};

const createFilterOptions = (
  filterState: any,
  metadata: any,
  maxSamples: number,
  genomicFilterMode: 'subset' | 'dim' = 'dim',
  treeFilterMode: 'subset' | 'dim' = 'dim',
  sampleSubsetMode?: string,
  sampleIds?: number[],
  sampleRange?: [number, number] | null,
  randomSeed?: number | null,
  selectedPopulations?: number[]
) => {
  const options: any = { maxSamples };

  // Add sample subsetting parameters
  if (sampleSubsetMode) options.sampleSubsetMode = sampleSubsetMode;
  if (sampleIds) options.sampleIds = sampleIds;
  if (sampleRange) {
    options.sampleRangeStart = sampleRange[0];
    options.sampleRangeEnd = sampleRange[1];
  }
  if (randomSeed !== undefined) options.randomSeed = randomSeed;
  if (selectedPopulations) options.samplePopulations = selectedPopulations;

  // Only apply API-level filtering when in 'subset' mode
  // In 'dim' mode, we fetch all data and apply opacity changes client-side
  if (filterState.mode === 'genomic' && genomicFilterMode === 'subset' &&
      (filterState.genomicRange[0] !== 0 || filterState.genomicRange[1] !== metadata.sequenceLength)) {
    options.genomicStart = filterState.genomicRange[0];
    options.genomicEnd = filterState.genomicRange[1];
  } else if (filterState.mode === 'tree' && treeFilterMode === 'subset' &&
             (filterState.treeRange[0] !== 0 || filterState.treeRange[1] !== metadata.treeIntervals.length - 1)) {
    options.treeStartIdx = filterState.treeRange[0];
    options.treeEndIdx = filterState.treeRange[1];
  }

  return options;
};

const filterDataByViewMode = (
  data: GraphData,
  viewMode: ViewMode,
  selectedNode: GraphNode | null
): GraphData => {
  if (!selectedNode) return data;

  const getFilteredNodesAndEdges = (nodeIds: Set<number>) => {
    const filteredNodes = data.nodes.filter(node => nodeIds.has(node.id));
    const filteredEdges = data.edges.filter(edge => {
      const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
      const targetId = typeof edge.target === 'number' ? edge.target : edge.target.id;
      return nodeIds.has(sourceId) && nodeIds.has(targetId);
    });
    
    return {
      ...data,
      nodes: filteredNodes,
      edges: filteredEdges,
      metadata: { ...data.metadata, is_subset: true }
    };
  };

  switch (viewMode) {
    case 'subgraph': {
      const descendants = getDescendants(selectedNode, data.nodes, data.edges);
      descendants.add(selectedNode.id);
      return getFilteredNodesAndEdges(descendants);
    }
    case 'ancestors': {
      const ancestors = getAncestors(selectedNode, data.nodes, data.edges);
      ancestors.add(selectedNode.id);
      return getFilteredNodesAndEdges(ancestors);
    }
    default:
      return data;
  }
};

const applyTemporalFiltering = (
  data: GraphData,
  temporalState: any,
  temporalFilterEnabled: boolean,
  temporalFilterMode: 'subset' | 'dim'
): GraphData => {
  // Only apply filtering that removes nodes when:
  // 1. Layer reveal is active with 'hide' or 'hybrid' mode, OR
  // 2. Temporal filter is enabled with 'subset' mode
  const shouldFilterForLayerReveal = temporalState.isActive && (temporalState.mode === 'hide' || temporalState.mode === 'hybrid');
  const shouldFilterForSubsetMode = temporalFilterEnabled && temporalFilterMode === 'subset';

  if (!shouldFilterForLayerReveal && !shouldFilterForSubsetMode) return data;

  const [minTimeFilter, maxTimeFilter] = temporalState.range;
  const isFullTimeRange = minTimeFilter === temporalState.minTime && maxTimeFilter === temporalState.maxTime;

  if (isFullTimeRange) return data;

  const filteredNodes = data.nodes.filter(node =>
    node.time >= minTimeFilter && node.time <= maxTimeFilter
  );
  const nodeIds = new Set(filteredNodes.map(node => node.id));
  const filteredEdges = data.edges.filter(edge => {
    const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
    const targetId = typeof edge.target === 'number' ? edge.target : edge.target.id;
    return nodeIds.has(sourceId) && nodeIds.has(targetId);
  });

  return {
    ...data,
    nodes: filteredNodes,
    edges: filteredEdges,
    metadata: { ...data.metadata, is_subset: true }
  };
};

const getViewTitle = (
  viewMode: ViewMode,
  selectedNode: GraphNode | null,
  filterState: any,
  data: GraphData | null
): string => {
  let title = '';
  switch (viewMode) {
    case 'subgraph':
      title = `3D SubARG at Root ${selectedNode?.id}`;
      break;
    case 'ancestors':
      title = `3D Parent ARG of Node ${selectedNode?.id}`;
      break;
    default:
      title = '3D Full ARG';
  }
  
  if (filterState.isActive && data?.metadata.genomic_start !== undefined && data?.metadata.genomic_end !== undefined) {
    title += ` (${formatGenomicPosition(data.metadata.genomic_start)} - ${formatGenomicPosition(data.metadata.genomic_end)})`;
  }
  
  return title;
};

// Simplified wrapper component
const Spatial3DWrapper: React.FC<{
  data: GraphData | null;
  originalData?: GraphData | null; // Original unfiltered data for coordinate transform in unit grid mode
  onNodeClick: (node: GraphNode) => void;
  onNodeRightClick: (node: GraphNode) => void;
  selectedNode: GraphNode | null;
  temporalRange?: [number, number] | null;
  showTemporalPlanes?: boolean;
  temporalFilterMode?: TemporalFilterMode | null;
  temporalSpacing?: number;
  temporalSpacingMode?: TemporalSpacingMode;
  spatialSpacing?: number;
  geographicShape?: GeographicShape | null;
  geographicMode?: GeographicMode;
  temporalGridOpacity?: number;
  geographicShapeOpacity?: number;
  nodeSizes?: { sample: number; root: number; other: number };
  nodeIdSettings?: NodeIdSettings;
  edgeThickness?: number;
  edgeOpacity?: number;
  edgeLabelSettings?: { showEdgeLabels: boolean; labelFontSize: number };
  edgeMutationSettings?: EdgeMutationSettings;
  colorByPopulation?: boolean;
  heatmapSettings?: AncestryHeatmapSettings;
  onViewStateChange?: (viewState: any) => void;
  viewState?: any;
  // Spatial filter props for dim mode
  genomicRange?: [number, number] | null;
  genomicDimOpacity?: number;
  treeRange?: [number, number] | null;
  treeIntervals?: TreeInterval[];
  treeDimOpacity?: number;
  temporalDimOpacity?: number;
}> = ({ 
  data, 
  originalData,
  onNodeClick, 
  onNodeRightClick, 
  selectedNode, 
  temporalRange, 
  showTemporalPlanes, 
  temporalFilterMode, 
  temporalSpacing,
  temporalSpacingMode,
  spatialSpacing, 
  geographicShape, 
  geographicMode, 
  temporalGridOpacity, 
  geographicShapeOpacity, 
  nodeSizes,
  nodeIdSettings,
  edgeThickness,
  edgeOpacity,
  edgeLabelSettings,
  edgeMutationSettings,
  colorByPopulation,
  heatmapSettings,
  onViewStateChange,
  viewState,
  genomicRange,
  genomicDimOpacity,
  treeRange,
  treeIntervals,
  treeDimOpacity,
  temporalDimOpacity
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState(CONTAINER_CONSTANTS.DEFAULT_DIMENSIONS);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setDimensions({
          width: clientWidth || CONTAINER_CONSTANTS.DEFAULT_DIMENSIONS.width,
          height: clientHeight || CONTAINER_CONSTANTS.DEFAULT_DIMENSIONS.height
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    let resizeObserver: ResizeObserver | null = null;
    if (window.ResizeObserver && containerRef.current) {
      resizeObserver = new ResizeObserver(updateDimensions);
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateDimensions);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full">
      <SpatialArg3DVisualization
        data={data}
        originalData={originalData}
        width={dimensions.width}
        height={dimensions.height}
        onNodeClick={onNodeClick}
        onNodeRightClick={onNodeRightClick}
        selectedNode={selectedNode}
        temporalRange={temporalRange}
        showTemporalPlanes={showTemporalPlanes}
        temporalFilterMode={temporalFilterMode}
        temporalSpacing={temporalSpacing}
        spatialSpacing={spatialSpacing}
        geographicShape={geographicShape}
        geographicMode={geographicMode}
        temporalGridOpacity={temporalGridOpacity}
        geographicShapeOpacity={geographicShapeOpacity}
        nodeSizes={nodeSizes}
        nodeIdSettings={nodeIdSettings}
        edgeThickness={edgeThickness}
        edgeOpacity={edgeOpacity}
        edgeLabelSettings={edgeLabelSettings}
        edgeMutationSettings={edgeMutationSettings}
        colorByPopulation={colorByPopulation}
        heatmapSettings={heatmapSettings}
        onViewStateChange={onViewStateChange}
        externalViewState={viewState}
        temporalSpacingMode={temporalSpacingMode}
        genomicRange={genomicRange}
        genomicDimOpacity={genomicDimOpacity}
        treeRange={treeRange}
        treeIntervals={treeIntervals}
        treeDimOpacity={treeDimOpacity}
        temporalDimOpacity={temporalDimOpacity}
      />
    </div>
  );
};

const SpatialArg3DVisualizationContainer: React.FC<SpatialArg3DVisualizationContainerProps> = ({
  filename,
  max_samples,
  temporalStart,
  temporalEnd,
  genomicStart,
  genomicEnd,
  treeStartIdx,
  treeEndIdx,
  initialHeatmapMode = false
}) => {
  const { colors } = useColorTheme();
  const {
    treeSequence,
    sampleSubsetMode,
    sampleIds,
    sampleRange,
    randomSeed,
    selectedPopulations
  } = useTreeSequence();
  const [searchParams, setSearchParams] = useSearchParams();

  const [data, setData] = useState<GraphData | null>(null);
  const [subArgData, setSubArgData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const elapsedSeconds = useElapsedTime(loading);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('full');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [initialFocusApplied, setInitialFocusApplied] = useState(false);

  // Update URL parameters when focal node is selected/deselected
  useEffect(() => {
    if (initialFocusApplied) {
      const newSearchParams = new URLSearchParams(searchParams);

      if (viewMode === 'full' || !selectedNode) {
        // Remove focus parameters when returning to full view
        newSearchParams.delete('focus_root');
        newSearchParams.delete('focus_sample');
      } else if (selectedNode) {
        // Add focus parameters when focal node is selected
        if (selectedNode.is_sample) {
          newSearchParams.set('focus_sample', selectedNode.id.toString());
          newSearchParams.delete('focus_root');
        } else {
          newSearchParams.set('focus_root', selectedNode.id.toString());
          newSearchParams.delete('focus_sample');
        }
      }

      // Only update if parameters actually changed
      if (newSearchParams.toString() !== searchParams.toString()) {
        setSearchParams(newSearchParams, { replace: true });
      }
    }
  }, [viewMode, selectedNode, searchParams, initialFocusApplied]);

  // Parse initial focus params from URL
  const initialFocus = useMemo(() => {
    const focusRootParam = searchParams.get('focus_root');
    const focusSampleParam = searchParams.get('focus_sample');
    if (focusRootParam) {
      const id = parseInt(focusRootParam);
      return !isNaN(id) ? { focusRoot: id } : undefined;
    }
    if (focusSampleParam) {
      const id = parseInt(focusSampleParam);
      return !isNaN(id) ? { focusSample: id } : undefined;
    }
    return undefined;
  }, [searchParams]);

  // Apply initial focus when data becomes available
  useEffect(() => {
    if (!data || initialFocusApplied) return;

    const focusNodeId = initialFocus?.focusRoot ?? initialFocus?.focusSample;
    if (focusNodeId === undefined) return;

    const targetNode = data.nodes.find(n => n.id === focusNodeId);
    if (!targetNode) {
      console.warn(`Focus node ${focusNodeId} not found in graph data`);
      setInitialFocusApplied(true);
      return;
    }

    setSelectedNode(targetNode);
    setViewMode(initialFocus?.focusRoot !== undefined ? 'subgraph' : 'ancestors');
    setInitialFocusApplied(true);
  }, [data, initialFocus, initialFocusApplied]);
  
  const [filterState, setFilterState] = useState({
    isActive: false,
    mode: 'genomic' as FilterMode,
    genomicRange: [0, 0] as [number, number],
    treeRange: [0, 0] as [number, number]
  });
  
  const [temporalState, setTemporalState] = useState({
    isActive: false,
    mode: 'planes' as TemporalFilterMode,
    range: [0, 1] as [number, number],
    minTime: 0,
    maxTime: 1
  });
  
  const [metadata, setMetadata] = useState({
    sequenceLength: 0,
    treeIntervals: [] as TreeInterval[]
  });

  const [visualSettings, setVisualSettings] = useState(DEFAULT_VISUAL_SETTINGS);
  const [nodeIdSettings, setNodeIdSettings] = useState<NodeIdSettings>(DEFAULT_VISUAL_SETTINGS.nodeIdSettings);
  const [edgeMutationSettings, setEdgeMutationSettings] = useState<EdgeMutationSettings>(DEFAULT_VISUAL_SETTINGS.edgeMutationSettings);
  const [colorByPopulation, setColorByPopulation] = useState(false);
  const [heatmapSettings, setHeatmapSettings] = useState<AncestryHeatmapSettings>(() => ({
    ...DEFAULT_VISUAL_SETTINGS.heatmapSettings,
    enabled: initialHeatmapMode,
    nodeVisibility: initialHeatmapMode ? 'none' : 'all'
  }));
  
  const [unaryRetentionPercent, setUnaryRetentionPercent] = useState<number | null>(null); // null = not calculated yet
  const [isCalculatingDefault, setIsCalculatingDefault] = useState(false);
  
  const [viewState, setViewState] = useState({
    target: [0, 0, 0] as [number, number, number], // Temporary, will be updated by auto-center
    zoom: 1.8, // Fit all zoom
    minZoom: 0.01 as number, // Lower limit for deep z-axis navigation - will be updated dynamically
    maxZoom: 100 as number, // Higher limit for world-space scaling - will be updated dynamically  
    rotationX: 30, // 30 degree angle
    rotationOrbit: 0, // Head on
    orbitAxis: 'Y' as const
  });
  
  const [geoState, setGeoState] = useState({
    mode: 'unit_grid' as GeographicMode,
    currentShape: null as GeographicShape | null,
    customShapeFile: null as File | null,
    isLoading: false,
    showCrsWarning: false
  });

  // Auto-rotation state
  const [autoRotation, setAutoRotation] = useState({
    enabled: false,
    rate: 10 // degrees per second
  });

  // Layer-by-layer reveal state
  const [layerReveal, setLayerReveal] = useState({
    enabled: false,
    isPlaying: false,
    rate: 1.0, // nodes per second (based on unique time layers)
    currentProgress: 0, // 0 to 1, tracks how far through the animation we are
    mode: 'glide' as 'hide' | 'glide' | 'root-to-samples', // 'hide' = just add layers, 'glide' = dim below and glide shapefile, 'root-to-samples' = reveal from root down
    initialZoom: 1.8, // Store initial zoom level for dynamic zoom calculation
    initialTarget: [0, 0, 0] as [number, number, number] // Store initial camera target
  });

  // Filter visibility toggles (show sliders alongside visualization)
  const [spatialFilterEnabled, setSpatialFilterEnabled] = useState(false);
  const [temporalFilterEnabled, setTemporalFilterEnabled] = useState(false);

  // Window stats for filtered genomic regions
  const windowStatsResult = useWindowStats({
    filename: filename || null,
    isGenomicFilterActive: spatialFilterEnabled && filterState.isActive,
    filterMode: filterState.mode,
    genomicStart: filterState.genomicRange[0],
    genomicEnd: filterState.genomicRange[1],
    treeStartIdx: filterState.treeRange[0],
    treeEndIdx: filterState.treeRange[1],
    sequenceLength: metadata.sequenceLength,
  });

  // Filter modes: 'subset' hides elements, 'dim' shows them with reduced opacity
  const [genomicFilterMode, setGenomicFilterMode] = useState<'subset' | 'dim'>('dim');
  const [treeFilterMode, setTreeFilterMode] = useState<'subset' | 'dim'>('dim');
  const [temporalFilterMode, setTemporalFilterMode] = useState<'subset' | 'dim'>('dim');

  // Dim opacity values (0-1) for when filter mode is 'dim'
  const [genomicDimOpacity, setGenomicDimOpacity] = useState(0.15);
  const [treeDimOpacity, setTreeDimOpacity] = useState(0.15);
  const [temporalDimOpacity, setTemporalDimOpacity] = useState(0.15);

  // Handler to set spatial filter enabled and initialize range to full when enabling
  const handleSpatialFilterToggle = useCallback((enabled: boolean) => {
    setSpatialFilterEnabled(enabled);
    if (enabled) {
      // When enabling, set range to full and mark filter as active
      if (filterState.mode === 'genomic') {
        setFilterState(prev => ({
          ...prev,
          isActive: true,
          genomicRange: [0, metadata.sequenceLength]
        }));
      } else {
        setFilterState(prev => ({
          ...prev,
          isActive: true,
          treeRange: [0, metadata.treeIntervals.length - 1]
        }));
      }
    } else {
      // When disabling, mark filter as inactive
      setFilterState(prev => ({
        ...prev,
        isActive: false
      }));
    }
  }, [filterState.mode, metadata.sequenceLength, metadata.treeIntervals.length]);

  // Handler to set temporal filter enabled and initialize range to full when enabling
  const handleTemporalFilterToggle = useCallback((enabled: boolean) => {
    setTemporalFilterEnabled(enabled);
    if (enabled) {
      // When enabling, set range to full [minTime, maxTime] and mark as active
      setTemporalState(prev => ({
        ...prev,
        isActive: true,
        range: [prev.minTime, prev.maxTime]
      }));
    } else {
      // When disabling, mark as inactive
      setTemporalState(prev => ({
        ...prev,
        isActive: false
      }));
    }
  }, []);

  const loadGeographicData = useCallback(async () => {
    try {
      setGeoState(prev => ({ ...prev, isLoading: true }));
      
      if (geoState.mode === 'unit_grid') {
        const { createUnitGridShape } = await import('../SpatialArgUtils/GeographicUtils');
        const gridShape = createUnitGridShape(CONTAINER_CONSTANTS.UNIT_GRID_SIZE);
        setGeoState(prev => ({ ...prev, currentShape: gridShape }));
      } else if (geoState.mode === 'custom' && geoState.customShapeFile) {
        const response = await api.uploadShapefile(geoState.customShapeFile);
        console.log('Custom shapefile uploaded:', response.data);
      } else {
        try {
          const response = await api.getShapeData(geoState.mode);
          setGeoState(prev => ({ ...prev, currentShape: response.data as GeographicShape }));
        } catch (error) {
          console.warn(`Failed to load ${geoState.mode}, using fallback`);
          const { createUnitGridShape } = await import('../SpatialArgUtils/GeographicUtils');
          const gridShape = createUnitGridShape(CONTAINER_CONSTANTS.UNIT_GRID_SIZE);
          setGeoState(prev => ({ ...prev, currentShape: gridShape }));
        }
      }
    } catch (error) {
      console.error('Error loading geographic data:', error);
    } finally {
      setGeoState(prev => ({ ...prev, isLoading: false }));
    }
  }, [geoState.mode, geoState.customShapeFile]);

  useEffect(() => {
    loadGeographicData();
  }, [loadGeographicData]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Build options including URL parameters
        // Start with 0% unary retention for initial load
        const retentionPercent = unaryRetentionPercent ?? 0;
        const options: any = {
          maxSamples: max_samples,
          unaryRetentionPercent: retentionPercent,
          // Sample subsetting parameters from TreeSequenceContext
          sampleSubsetMode,
          sampleIds,
          ...(sampleRange && { sampleRangeStart: sampleRange[0], sampleRangeEnd: sampleRange[1] }),
          randomSeed,
          samplePopulations: selectedPopulations,
        };
        
        // Add temporal filtering if provided via URL
        if (temporalStart !== undefined && temporalEnd !== undefined) {
          options.temporalStart = temporalStart;
          options.temporalEnd = temporalEnd;
          console.log('Applying temporal filtering:', temporalStart, '-', temporalEnd);
        }
        
        // Add genomic filtering if provided via URL
        if (genomicStart !== undefined && genomicEnd !== undefined) {
          options.genomicStart = genomicStart;
          options.genomicEnd = genomicEnd;
          console.log('Applying genomic filtering:', genomicStart, '-', genomicEnd);
        } else if (treeStartIdx !== undefined && treeEndIdx !== undefined) {
          options.treeStartIdx = treeStartIdx;
          options.treeEndIdx = treeEndIdx;
          console.log('Applying tree index filtering:', treeStartIdx, '-', treeEndIdx);
        }
        
        const response = await api.getGraphData(filename, options);
        const graphData = response.data as GraphData;
        
        if (graphData.metadata.sequence_length) {
          setMetadata(prev => ({ ...prev, sequenceLength: graphData.metadata.sequence_length! }));
          setFilterState(prev => ({ 
            ...prev, 
            genomicRange: [0, graphData.metadata.sequence_length!] 
          }));
        }
        
        if (graphData.metadata.tree_intervals?.length) {
          const intervals = convertTreeIntervals(graphData.metadata.tree_intervals as unknown as [number, number, number][]);
          setMetadata(prev => ({ ...prev, treeIntervals: intervals }));
          setFilterState(prev => ({ 
            ...prev, 
            treeRange: [0, intervals.length - 1] 
          }));
        }

        if (graphData.nodes?.length) {
          const temporalInit = initializeTemporalState(graphData.nodes);
          setTemporalState(prev => ({ ...prev, ...temporalInit }));
        }

        if (!validateSpatialData(graphData)) {
          setError('No spatial data found in this ARG. This visualization requires nodes with 2D spatial coordinates.');
        } else {
          setData(graphData);
          setSubArgData(graphData);
          
          // Auto-center the view when data loads
          autoCenterView(graphData);
          
          if (graphData.metadata.suggested_geographic_mode) {
            const suggestedMode = graphData.metadata.suggested_geographic_mode as GeographicMode;
            setGeoState(prev => ({ ...prev, mode: suggestedMode }));
          }
          
          // Set intelligent defaults for node ID display based on data size
          const sampleCount = graphData.nodes.filter(n => n.is_sample).length;
          const rootCount = graphData.nodes.filter(n => isRootNode(n, graphData.nodes, graphData.edges)).length;

          // Calculate default temporal spacing based on number of layers
          const uniqueTimes = Array.from(new Set(graphData.nodes.map(node => node.time))).sort((a, b) => a - b);
          const numLayers = uniqueTimes.length;
          const defaultTemporalSpacing = calculateDefaultTemporalSpacing(numLayers);

          setVisualSettings(prev => ({ ...prev, temporalSpacing: defaultTemporalSpacing }));

          setNodeIdSettings({
            showSampleIds: sampleCount <= 40,
            showRootIds: rootCount <= 6,
            showInternalIds: false
          });
        }
      } catch (err) {
        console.error('Error fetching 3D graph data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [filename, max_samples, temporalStart, temporalEnd, genomicStart, genomicEnd, treeStartIdx, treeEndIdx, unaryRetentionPercent]);

  // Calculate smart default for unary retention (max 250 nodes)
  useEffect(() => {
    // Only calculate default once, and only if not already set
    if (unaryRetentionPercent !== null || isCalculatingDefault || !data || data.nodes.length === 0) {
      return;
    }

    const calculateDefault = async () => {
      const baseNodeCount = data.nodes.length;
      
      // If we already have >= 250 nodes with 0% retention, default to 0
      if (baseNodeCount >= 250) {
        setUnaryRetentionPercent(0);
        return;
      }

      // Otherwise, fetch with 100% to see total possible nodes
      setIsCalculatingDefault(true);
      try {
        const options: any = {
          maxSamples: max_samples,
          unaryRetentionPercent: 100,
          // Sample subsetting parameters from TreeSequenceContext
          sampleSubsetMode,
          sampleIds,
          ...(sampleRange && { sampleRangeStart: sampleRange[0], sampleRangeEnd: sampleRange[1] }),
          randomSeed,
          samplePopulations: selectedPopulations,
        };
        
        // Include same filters as initial load
        if (temporalStart !== undefined && temporalEnd !== undefined) {
          options.temporalStart = temporalStart;
          options.temporalEnd = temporalEnd;
        }
        if (genomicStart !== undefined && genomicEnd !== undefined) {
          options.genomicStart = genomicStart;
          options.genomicEnd = genomicEnd;
        } else if (treeStartIdx !== undefined && treeEndIdx !== undefined) {
          options.treeStartIdx = treeStartIdx;
          options.treeEndIdx = treeEndIdx;
        }

        const response = await api.getGraphData(filename, options);
        const fullGraphData = response.data as GraphData;
        const totalNodeCount = fullGraphData.nodes.length;
        const unaryNodeCount = totalNodeCount - baseNodeCount;

        if (unaryNodeCount === 0) {
          // No unary nodes available
          setUnaryRetentionPercent(0);
        } else {
          // Calculate percentage to get to 250 nodes
          const targetAdditionalNodes = 250 - baseNodeCount;
          const calculatedPercent = Math.min(100, Math.max(0, (targetAdditionalNodes / unaryNodeCount) * 100));
          setUnaryRetentionPercent(calculatedPercent);
          console.log(`Calculated default unary retention: ${calculatedPercent.toFixed(1)}% (base: ${baseNodeCount}, total: ${totalNodeCount}, target: 250)`);
        }
      } catch (err) {
        console.error('Error calculating default unary retention:', err);
        setUnaryRetentionPercent(0); // Fallback to 0 on error
      } finally {
        setIsCalculatingDefault(false);
      }
    };

    calculateDefault();
  }, [data, filename, max_samples, temporalStart, temporalEnd, genomicStart, genomicEnd, treeStartIdx, treeEndIdx, unaryRetentionPercent, isCalculatingDefault]);

  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (!filterState.isActive || loading) return;

    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    loadingTimeoutRef.current = setTimeout(async () => {
      try {
        setLoading(true);

        const options = createFilterOptions(
          filterState,
          metadata,
          max_samples,
          genomicFilterMode,
          treeFilterMode,
          sampleSubsetMode,
          sampleIds,
          sampleRange,
          randomSeed,
          selectedPopulations
        );
        options.unaryRetentionPercent = unaryRetentionPercent ?? 0;
        
        // Always include URL parameters if present
        if (temporalStart !== undefined && temporalEnd !== undefined) {
          options.temporalStart = temporalStart;
          options.temporalEnd = temporalEnd;
        }
        
        // Add URL genomic parameters if no local filter is active
        if (!options.genomicStart && !options.genomicEnd && !options.treeStartIdx && !options.treeEndIdx) {
          if (genomicStart !== undefined && genomicEnd !== undefined) {
            options.genomicStart = genomicStart;
            options.genomicEnd = genomicEnd;
          } else if (treeStartIdx !== undefined && treeEndIdx !== undefined) {
            options.treeStartIdx = treeStartIdx;
            options.treeEndIdx = treeEndIdx;
          }
        }
        
        const response = await api.getGraphData(filename, options);
        const graphData = response.data as GraphData;
        
        if (!validateSpatialData(graphData)) {
          setError('No spatial data found in this range.');
        } else {
          setData(graphData);
          setError(null);
          
          // Auto-center the view when filtered data loads
          autoCenterView(graphData);
          
          // Update node ID settings based on filtered data size
          const sampleCount = graphData.nodes.filter(n => n.is_sample).length;
          const rootCount = graphData.nodes.filter(n => isRootNode(n, graphData.nodes, graphData.edges)).length;
          
          setNodeIdSettings({
            showSampleIds: sampleCount <= 40,
            showRootIds: rootCount <= 6,
            showInternalIds: false
          });
        }
      } catch (e) {
        console.error('Error fetching filtered data:', e);
        setError(e instanceof Error ? e.message : 'An error occurred while fetching graph data');
      } finally {
        setLoading(false);
      }
    }, CONTAINER_CONSTANTS.DEBOUNCE_DELAY);

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [filterState, filename, max_samples, metadata.sequenceLength, metadata.treeIntervals.length, temporalStart, temporalEnd, genomicStart, genomicEnd, treeStartIdx, treeEndIdx, unaryRetentionPercent, genomicFilterMode, treeFilterMode]);

  useEffect(() => {
    setVisualSettings(prev => ({
      ...prev,
      isFilterSectionCollapsed: !filterState.isActive && !temporalState.isActive
    }));
  }, [filterState.isActive, temporalState.isActive]);

  // Auto-rotation effect
  useEffect(() => {
    if (!autoRotation.enabled) return;

    let animationFrameId: number;
    let lastTime: number;

    const rotate = (currentTime: number) => {
      if (!lastTime) {
        lastTime = currentTime;
      }
      
      const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
      const rotationDelta = autoRotation.rate * deltaTime;
      
      setViewState(prev => ({
        ...prev,
        rotationOrbit: (prev.rotationOrbit + rotationDelta) % 360
      }));
      
      lastTime = currentTime;
      animationFrameId = requestAnimationFrame(rotate);
    };

    animationFrameId = requestAnimationFrame(rotate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [autoRotation.enabled, autoRotation.rate]);

  // Layer-by-layer reveal effect
  useEffect(() => {
    if (!layerReveal.isPlaying || !data || !temporalState.isActive) return;

    // Get unique times from the data
    const uniqueTimes = Array.from(new Set(data.nodes.map(node => node.time))).sort((a, b) => a - b);
    const numLayers = uniqueTimes.length;
    
    const isRootToSamples = layerReveal.mode === 'root-to-samples';
    
    // For root-to-samples mode: reverse the times array (start from root/highest time)
    const orderedTimes = isRootToSamples ? [...uniqueTimes].reverse() : uniqueTimes;
    const minTime = uniqueTimes[0];
    const maxTime = uniqueTimes[numLayers - 1];
    
    // Calculate animation duration based on rate (layers per second)
    // Add a delay at the start to hold at the initial layer
    // Hold duration: at least 1 second at slow rates, scales down at higher rates with minimum 0.5 seconds
    const timeForOneLayer = 1 / layerReveal.rate;
    const INITIAL_HOLD_DURATION = layerReveal.rate <= 1.0 
      ? Math.max(1.0, timeForOneLayer) // At slow rates: at least 1 second, or time for one layer if longer
      : Math.max(0.5, timeForOneLayer); // At higher rates: scale down but minimum 0.5 seconds
    const totalDuration = (numLayers / layerReveal.rate) + INITIAL_HOLD_DURATION;
    
    const startTime = Date.now() - (layerReveal.currentProgress * totalDuration * 1000);

    // Calculate spatial extent for zoom adjustment
    const bounds = calculateBounds(data);
    const spatialExtent = bounds ? Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) : 100;
    
    // More generous minimum zoom to prevent layers from becoming too small
    const MIN_ZOOM = 0.3;
    
    // Use initial target X/Y to preserve user's pan
    const [initialX, initialY] = layerReveal.initialTarget;

    let animationFrameId: number;

    const reveal = () => {
      const elapsedTime = (Date.now() - startTime) / 1000; // seconds
      
      // Hold at the start for INITIAL_HOLD_DURATION seconds, then progress through layers
      const timeForOneLayer = 1 / layerReveal.rate;
      const INITIAL_HOLD_DURATION = layerReveal.rate <= 1.0 
        ? Math.max(1.0, timeForOneLayer)
        : Math.max(0.5, timeForOneLayer);
      const effectiveElapsedTime = Math.max(0, elapsedTime - INITIAL_HOLD_DURATION);
      const animationDuration = totalDuration - INITIAL_HOLD_DURATION;
      
      // Calculate progress (0 to 1) after the initial hold
      const newProgress = animationDuration > 0 
        ? Math.min(effectiveElapsedTime / animationDuration, 1)
        : 0;
      
      // Calculate current layer index (0 = first layer, stays at 0 during hold)
      const currentLayerIndex = Math.floor(newProgress * numLayers);
      
      // Get the time value for the current layer
      const currentTime = orderedTimes[Math.min(currentLayerIndex, numLayers - 1)];
      
      if (isRootToSamples) {
        // Root-to-samples mode: start showing only root nodes [maxTime, maxTime]
        // Then expand downward in time (toward present/time=0) toward [minTime, maxTime]
        // As currentTime moves from maxTime down to minTime, more layers are revealed
        // Start at maxTime (root only) and expand to minTime (all nodes)
        const minTimeToShow = currentTime; // This starts at maxTime and moves down to minTime
        setTemporalState(prev => ({
          ...prev,
          mode: 'hide',
          range: [minTimeToShow, maxTime]
        }));
        
        // No automatic zoom/pan adjustments - maintain current view state
        // Don't update viewState for root-to-samples mode
      } else {
        // Standard mode: reveal from oldest to newest
        const maxTimeToShow = orderedTimes[Math.min(currentLayerIndex, numLayers - 1)];
        
        // For 'glide' mode: use 'planes' temporal mode to dim lower layers and glide shapefile
        // For 'hide' mode: just hide nodes above maxTimeToShow
        setTemporalState(prev => ({
          ...prev,
          range: [minTime, maxTimeToShow]
        }));
        
        // Calculate Z position of current layer
        const currentLayerZ = currentLayerIndex * visualSettings.temporalSpacing;
        
        // Position camera to show current layer near the top of view (not center)
        const verticalOffset = currentLayerZ * 0.35;
        const targetZ = currentLayerZ - verticalOffset;
        
        // Calculate dynamic zoom to fit revealed structure
        const currentHeight = currentLayerZ;
        const combinedExtent = Math.sqrt(spatialExtent * spatialExtent + currentHeight * currentHeight);
        const initialExtent = spatialExtent;
        
        let targetZoom = layerReveal.initialZoom;
        if (combinedExtent > initialExtent * 1.5) {
          const zoomFactor = Math.pow(initialExtent / combinedExtent, 0.8);
          targetZoom = Math.max(MIN_ZOOM, layerReveal.initialZoom * zoomFactor);
        }
        
        setViewState(prev => ({
          ...prev,
          target: [initialX, initialY, targetZ] as [number, number, number],
          zoom: targetZoom
        }));
      }
      
      // Update progress (include the hold period in total progress for state tracking)
      const totalProgress = Math.min(elapsedTime / totalDuration, 1);
      setLayerReveal(prev => ({
        ...prev,
        currentProgress: totalProgress
      }));
      
      // Continue animation if not complete
      if (totalProgress < 1) {
        animationFrameId = requestAnimationFrame(reveal);
      } else {
        // Animation complete
        setLayerReveal(prev => ({
          ...prev,
          isPlaying: false,
          enabled: false
        }));
        // Reset temporal filter
        setTemporalState(prev => ({
          ...prev,
          isActive: false,
          range: [prev.minTime, prev.maxTime]
        }));
      }
    };

    animationFrameId = requestAnimationFrame(reveal);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [layerReveal.isPlaying, layerReveal.rate, layerReveal.currentProgress, layerReveal.mode, data, temporalState.isActive, visualSettings.temporalSpacing]);

  const getFilteredData = (): GraphData | null => {
    if (!data) return data;

    const temporalFilteredData = applyTemporalFiltering(data, temporalState, temporalFilterEnabled, temporalFilterMode);
    return filterDataByViewMode(temporalFilteredData, viewMode, selectedNode);
  };

  const handleNodeClick = (node: GraphNode) => {
    if (viewMode === 'full') {
      setSelectedNode(node);
      setViewMode('subgraph');
    } else if (selectedNode?.id === node.id) {
      setViewMode('full');
      setSelectedNode(null);
    } else {
      setSelectedNode(node);
      setViewMode('subgraph');
    }
  };

  const handleNodeRightClick = (node: GraphNode) => {
    setSelectedNode(node);
    setViewMode('ancestors');
  };

  const handleReturnToFull = () => {
    setViewMode('full');
    setSelectedNode(null);
  };

  const handleViewStateChange = (newViewState: any) => {
    setViewState(prev => ({ ...prev, ...newViewState }));
  };

  const handlePresetViewChange = (newViewState: any) => {
    setViewState(prev => ({ ...prev, ...newViewState }));
  };

  // Calculate bounds for preset view panel - simplified to avoid complex transformation
  const calculateBounds = (data: GraphData | null) => {
    if (!data || !data.nodes.length) return null;
    
    const spatialNodes = data.nodes.filter(node => 
      node.location?.x !== undefined && node.location?.y !== undefined
    );
    
    if (spatialNodes.length === 0) return null;
    
    // Simple bounds calculation that matches the visualization's coordinate space
    const xCoords = spatialNodes.map(node => node.location!.x);
    const yCoords = spatialNodes.map(node => node.location!.y);
    const times = spatialNodes.map(node => node.time);
    
    const minX = Math.min(...xCoords);
    const maxX = Math.max(...xCoords);
    const minY = Math.min(...yCoords);
    const maxY = Math.max(...yCoords);
    
    // Center the coordinates
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const maxScale = Math.max(maxX - minX, maxY - minY) || 1;
    
    // Transform to visualization space (approximate)
    const visualMinX = ((minX - centerX) / maxScale) * visualSettings.spatialSpacing;
    const visualMaxX = ((maxX - centerX) / maxScale) * visualSettings.spatialSpacing;
    const visualMinY = ((minY - centerY) / maxScale) * visualSettings.spatialSpacing;
    const visualMaxY = ((maxY - centerY) / maxScale) * visualSettings.spatialSpacing;
    
    // Time spacing calculation
    const uniqueTimes = Array.from(new Set(times)).sort((a, b) => a - b);
    const minZ = 0;
    const maxZ = (uniqueTimes.length - 1) * visualSettings.temporalSpacing;
    
    return {
      minX: visualMinX,
      maxX: visualMaxX,
      minY: visualMinY,
      maxY: visualMaxY,
      minZ: minZ,
      maxZ: maxZ
    };
  };

  // Auto-center when data loads (same logic as "Center ARG" button)
  const autoCenterView = (data: GraphData | null) => {
    const bounds = calculateBounds(data);
    if (bounds) {
      // Always center on the shapefile (near z=0) instead of the middle of the ARG
      // This ensures the geographic reference is always in view
      // Root nodes can be off-screen initially, which is fine
      const centerZ = bounds.minZ + (bounds.maxZ - bounds.minZ) * 0.1;  // 10% above bottom (near shapefile)
      
      const centerTarget: [number, number, number] = [
        (bounds.minX + bounds.maxX) / 2,
        (bounds.minY + bounds.maxY) / 2,
        centerZ
      ];
      
      setViewState(prev => ({
        ...prev,
        target: centerTarget
      }));
    }
  };

  if (loading) {
    const elapsedTime = formatElapsedTime(elapsedSeconds);
    const showElapsedTime = elapsedSeconds > 5; // Show elapsed time after 5 seconds
    const isLocal = !isRailway();
    
    return (
      <div 
        className="w-full h-full flex items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <div className="text-center">
          <div 
            className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
            style={{ borderColor: colors.accentPrimary }}
          ></div>
          <p style={{ color: colors.text }}>Loading 3D spatial ARG visualization...</p>
          {showElapsedTime && (
            <>
              <p className="text-sm mt-3" style={{ color: `${colors.text}99` }}>
                Elapsed: {elapsedTime}
              </p>
              {isLocal && elapsedSeconds > 30 && (
                <p className="text-xs mt-2 max-w-md mx-auto" style={{ color: `${colors.text}80` }}>
                  Large datasets may take several minutes. Processing continues in the background...
                </p>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="w-full h-full flex items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <div className="text-center" style={{ color: colors.text }}>
          <p className="text-lg mb-2">Error loading visualization</p>
          <p className="text-sm" style={{ color: `${colors.text}B3` }}>{error}</p>
        </div>
      </div>
    );
  }

  const filteredData = getFilteredData();

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: colors.background }}>
      {/* Minimal Header - Title and view controls only */}
      <div className="flex-shrink-0 border-b" style={{ backgroundColor: colors.background, borderBottomColor: colors.border }}>
        <div className="px-4 py-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-medium" style={{ color: colors.headerText }}>
                {getViewTitle(viewMode, selectedNode, filterState, data)}
              </h2>
              {viewMode !== 'full' && (
                <button
                  onClick={handleReturnToFull}
                  className="font-medium px-2 py-0.5 rounded text-xs transition-colors border"
                  style={{ backgroundColor: colors.containerBackground, color: colors.text, borderColor: `${colors.accentPrimary}33` }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${colors.accentPrimary}66`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${colors.accentPrimary}33`; }}
                >
                  Return to Full
                </button>
              )}
            </div>
            {/* Interaction hints */}
            <div className="flex items-center gap-4 text-xs" style={{ color: colors.textSecondary }}>
              <span className="opacity-60">Click: Subgraph | Right-click: Ancestors</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex min-h-0 min-w-0">
        {/* Temporal slider on left when temporal filter is enabled */}
        {temporalFilterEnabled && temporalState.maxTime > temporalState.minTime && (
          <div className="flex-shrink-0 border-r px-3 py-4 flex items-center justify-center" style={{ backgroundColor: colors.background, borderRightColor: colors.border }}>
            <TemporalRangeSlider
              min={temporalState.minTime}
              max={temporalState.maxTime}
              step={(temporalState.maxTime - temporalState.minTime) / CONTAINER_CONSTANTS.TEMPORAL_STEP_DIVISOR}
              value={temporalState.range}
              onChange={(newRange) => setTemporalState(prev => ({ ...prev, range: newRange }))}
              formatValue={(v) => v.toFixed(CONTAINER_CONSTANTS.TIME_PRECISION)}
              height={CONTAINER_CONSTANTS.TEMPORAL_SLIDER_HEIGHT}
              filterMode={temporalFilterMode === 'subset' ? 'subset' : 'highlight'}
              onFilterModeChange={(mode) => setTemporalFilterMode(mode === 'subset' ? 'subset' : 'dim')}
              dimOpacity={temporalDimOpacity}
              onDimOpacityChange={setTemporalDimOpacity}
            />
          </div>
        )}

        {/* Visualization + optional bottom slider */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0 min-w-0">
          {/* Main visualization area */}
          <div className="flex-1 overflow-hidden relative min-h-0 min-w-0">
            {/* Time indicator during layer reveal */}
            {layerReveal.enabled && (
              <div
                className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg border"
                style={{
                  backgroundColor: `${colors.background}F0`,
                  borderColor: colors.accentPrimary,
                  color: colors.accentPrimary
                }}
              >
                <div className="flex items-center gap-2">
                  <svg
                    className={`w-4 h-4 ${layerReveal.isPlaying ? 'animate-pulse' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-mono font-bold text-lg">
                    {(() => {
                      const isRootToSamples = layerReveal.mode === 'root-to-samples';
                      const displayTime = isRootToSamples ? temporalState.range[0] : temporalState.range[1];
                      const isAtMinTime = Math.abs(displayTime - temporalState.minTime) < 0.0001;
                      const isAtMaxTime = Math.abs(displayTime - temporalState.maxTime) < 0.0001;

                      let label = `t = ${displayTime.toFixed(CONTAINER_CONSTANTS.TIME_PRECISION)}`;

                      if (isAtMinTime) {
                        label += ' (present)';
                      } else if (isAtMaxTime) {
                        label += ' (MRCA)';
                      }

                      return label;
                    })()}
                  </span>
                  {layerReveal.isPlaying && (
                    <span className="text-xs opacity-75">Playing</span>
                  )}
                </div>
              </div>
            )}

            {/* Time indicator when temporal filter enabled */}
            {temporalFilterEnabled && !layerReveal.enabled && (
              <div className="absolute left-1/2 -translate-x-1/2 top-2 px-2.5 py-1.5 rounded text-xs font-semibold border shadow-sm" style={{ backgroundColor: `${colors.containerBackground}E6`, color: colors.text, borderColor: colors.border, backdropFilter: 'blur(2px)' }}>
                t = {temporalState.range[1].toFixed(CONTAINER_CONSTANTS.TIME_PRECISION)}
              </div>
            )}

            <Spatial3DWrapper
              data={filteredData}
              originalData={data}
              onNodeClick={handleNodeClick}
              onNodeRightClick={handleNodeRightClick}
              selectedNode={selectedNode}
              temporalRange={temporalFilterEnabled ? temporalState.range : null}
              showTemporalPlanes={temporalFilterEnabled && (temporalState.mode === 'planes' || temporalState.mode === 'hybrid')}
              temporalFilterMode={temporalFilterEnabled ? temporalState.mode : null}
              temporalSpacing={visualSettings.temporalSpacing}
              temporalSpacingMode={visualSettings.temporalSpacingMode}
              spatialSpacing={visualSettings.spatialSpacing}
              geographicShape={geoState.currentShape}
              geographicMode={geoState.mode}
              temporalGridOpacity={visualSettings.temporalGridOpacity}
              geographicShapeOpacity={visualSettings.geographicShapeOpacity}
              nodeSizes={visualSettings.nodeSizes}
              nodeIdSettings={nodeIdSettings}
              edgeThickness={visualSettings.edgeThickness}
              edgeOpacity={visualSettings.edgeOpacity}
              edgeLabelSettings={visualSettings.edgeLabelSettings}
              edgeMutationSettings={edgeMutationSettings}
              colorByPopulation={colorByPopulation}
              heatmapSettings={heatmapSettings}
              onViewStateChange={handleViewStateChange}
              viewState={viewState}
              // Spatial filter props for dim mode
              genomicRange={spatialFilterEnabled && filterState.mode === 'genomic' && genomicFilterMode === 'dim' ? filterState.genomicRange : null}
              genomicDimOpacity={genomicDimOpacity}
              treeRange={spatialFilterEnabled && filterState.mode === 'tree' && treeFilterMode === 'dim' ? filterState.treeRange : null}
              treeIntervals={metadata.treeIntervals}
              treeDimOpacity={treeDimOpacity}
              temporalDimOpacity={temporalFilterEnabled && temporalFilterMode === 'dim' ? temporalDimOpacity : undefined}
            />

            {/* Floating Quick Actions Bar */}
            <KeyboardShortcutProvider>
              <SpatialArg3DControls
                // Filter props
                genomicFilter={metadata.sequenceLength > 0 ? {
                  enabled: true,
                  sequenceLength: metadata.sequenceLength,
                  value: filterState.genomicRange,
                  onChange: (range) => setFilterState(prev => ({ ...prev, genomicRange: range })),
                  formatValue: formatGenomicPosition
                } : undefined}
                treeFilter={metadata.treeIntervals.length > 0 ? {
                  enabled: true,
                  treeIntervals: metadata.treeIntervals,
                  value: filterState.treeRange,
                  onChange: (range) => setFilterState(prev => ({ ...prev, treeRange: range }))
                } : undefined}
                temporalFilter={temporalState.maxTime > temporalState.minTime ? {
                  enabled: true,
                  min: temporalState.minTime,
                  max: temporalState.maxTime,
                  value: temporalState.range,
                  onChange: (range) => setTemporalState(prev => ({ ...prev, range })),
                  formatValue: (v) => v.toFixed(CONTAINER_CONSTANTS.TIME_PRECISION)
                } : undefined}
                filterType={filterState.mode === 'genomic' ? 'genomic' : 'tree'}
                onFilterTypeChange={(type) => setFilterState(prev => ({ ...prev, mode: type as FilterMode }))}
                spatialFilterEnabled={spatialFilterEnabled}
                onSpatialFilterToggle={handleSpatialFilterToggle}
                temporalFilterEnabled={temporalFilterEnabled}
                onTemporalFilterToggle={handleTemporalFilterToggle}
                temporalFilterMode={temporalState.mode}
                onTemporalFilterModeChange={(mode) => setTemporalState(prev => ({
                  ...prev,
                  mode
                }))}
                temporalDimOpacity={temporalDimOpacity}
                onTemporalDimOpacityChange={setTemporalDimOpacity}

                // Nodes props
                colorBy={colorByPopulation ? 'population' : 'type'}
                onColorByChange={(mode) => setColorByPopulation(mode === 'population')}
                availableColorModes={data?.metadata?.has_populations ? ['type', 'population'] : ['type']}
                nodeSizes={visualSettings.nodeSizes}
                onNodeSizesChange={(sizes) => setVisualSettings(prev => ({ ...prev, nodeSizes: sizes }))}
                nodeIdSettings={nodeIdSettings}
                onNodeIdSettingsChange={setNodeIdSettings}

                // Edges props
                edgeThickness={visualSettings.edgeThickness}
                onEdgeThicknessChange={(thickness) => setVisualSettings(prev => ({ ...prev, edgeThickness: thickness }))}
                edgeOpacity={visualSettings.edgeOpacity}
                onEdgeOpacityChange={(opacity) => setVisualSettings(prev => ({ ...prev, edgeOpacity: opacity }))}
                showEdgeLabels={visualSettings.edgeLabelSettings.showEdgeLabels}
                onShowEdgeLabelsChange={(show) => setVisualSettings(prev => ({
                  ...prev,
                  edgeLabelSettings: { ...prev.edgeLabelSettings, showEdgeLabels: show }
                }))}
                edgeLabelFontSize={visualSettings.edgeLabelSettings.labelFontSize}
                onEdgeLabelFontSizeChange={(size) => setVisualSettings(prev => ({
                  ...prev,
                  edgeLabelSettings: { ...prev.edgeLabelSettings, labelFontSize: size }
                }))}

                // Mutations props
                showMutationMarkers={edgeMutationSettings.showMutationMarkers}
                onShowMutationMarkersChange={(show) => setEdgeMutationSettings(prev => ({ ...prev, showMutationMarkers: show }))}
                mutationMarkerSize={edgeMutationSettings.markerSize}
                onMutationMarkerSizeChange={(size) => setEdgeMutationSettings(prev => ({ ...prev, markerSize: size }))}

                // Stats props
                nodeEdgeStats={data ? {
                  originalNodes: data.metadata.original_num_nodes || treeSequence?.num_nodes || data.nodes.length,
                  subsetNodes: subArgData?.nodes.length || data.nodes.length,
                  displayedNodes: filteredData?.nodes.length || data.nodes.length,
                  originalEdges: data.metadata.original_num_edges || treeSequence?.num_edges || data.edges.length,
                  subsetEdges: subArgData?.edges.length || data.edges.length,
                  displayedEdges: filteredData?.edges.length || data.edges.length,
                } : undefined}
                sequenceStats={treeSequence ? {
                  samples: treeSequence.num_samples ?? 0,
                  sites: treeSequence.num_sites ?? 0,
                  trees: treeSequence.num_trees ?? 1,
                  mutations: treeSequence.num_mutations ?? 0,
                } : data ? {
                  samples: data.metadata.num_samples || data.nodes.filter((n: GraphNode) => n.is_sample).length,
                  sites: 0,
                  trees: data.metadata.num_local_trees || 1,
                  mutations: 0,
                } : undefined}
                popGenStats={treeSequence?.statistics}
                windowPopGenStats={windowStatsResult.windowStats}
                windowStatsLoading={windowStatsResult.isLoading}
                isGenomicFilterActive={spatialFilterEnabled && (filterState.mode === 'genomic' || filterState.mode === 'tree')}

                // Export props
                filename={filename}

                // Camera props
                currentRotationX={viewState.rotationX}
                currentRotationOrbit={viewState.rotationOrbit}
                currentZoom={viewState.zoom}
                onPresetSelect={(preset: CameraPreset) => handlePresetViewChange({ ...viewState, rotationX: preset.rotationX, rotationOrbit: preset.rotationOrbit })}
                onCenterView={() => autoCenterView(data)}
                autoRotationEnabled={autoRotation.enabled}
                onAutoRotationEnabledChange={(enabled) => setAutoRotation(prev => ({ ...prev, enabled }))}
                autoRotationRate={autoRotation.rate}
                onAutoRotationRateChange={(rate) => setAutoRotation(prev => ({ ...prev, rate }))}

                // Spatial props
                geographicMode={geoState.mode as QuickActionsGeographicMode}
                onGeographicModeChange={(mode) => setGeoState(prev => ({ ...prev, mode: mode as GeographicMode }))}
                customShapeFile={geoState.customShapeFile}
                onCustomShapeFileChange={(file) => setGeoState(prev => ({ ...prev, customShapeFile: file }))}
                geographicShapeOpacity={visualSettings.geographicShapeOpacity}
                onGeographicShapeOpacityChange={(opacity) => setVisualSettings(prev => ({ ...prev, geographicShapeOpacity: opacity }))}
                isLoadingGeographic={geoState.isLoading}
                temporalSpacing={visualSettings.temporalSpacing}
                onTemporalSpacingChange={(value) => setVisualSettings(prev => ({ ...prev, temporalSpacing: value }))}
                temporalSpacingMode={visualSettings.temporalSpacingMode}
                onTemporalSpacingModeChange={(mode) => setVisualSettings(prev => ({ ...prev, temporalSpacingMode: mode }))}
                spatialSpacing={visualSettings.spatialSpacing}
                onSpatialSpacingChange={(value) => setVisualSettings(prev => ({ ...prev, spatialSpacing: value }))}
                temporalGridOpacity={visualSettings.temporalGridOpacity}
                onTemporalGridOpacityChange={(value) => setVisualSettings(prev => ({ ...prev, temporalGridOpacity: value }))}
                heatmapSettings={heatmapSettings}
                onHeatmapSettingsChange={setHeatmapSettings}
                isTemporalFilterActive={temporalFilterEnabled}
                unaryRetentionPercent={unaryRetentionPercent ?? 0}
                onUnaryRetentionPercentChange={setUnaryRetentionPercent}

                floating={true}
              />
            </KeyboardShortcutProvider>

            {/* Floating Legend */}
            <div className="absolute bottom-4 right-4 z-50">
              <SpatialArg3DLegend showMutations={edgeMutationSettings.showMutationMarkers} />
            </div>

            {/* Floating Animation Popout */}
            {temporalState.maxTime > temporalState.minTime && (
              <SpatialArg3DAnimationPopout
                enabled={layerReveal.enabled}
                isPlaying={layerReveal.isPlaying}
                rate={layerReveal.rate}
                mode={layerReveal.mode}
                progress={layerReveal.currentProgress}
                currentTime={layerReveal.mode === 'root-to-samples' ? temporalState.range[0] : temporalState.range[1]}
                onStart={() => {
                  if (data) {
                    const uniqueTimes = Array.from(new Set(data.nodes.map(node => node.time))).sort((a, b) => a - b);
                    const minTime = uniqueTimes[0];
                    const maxTime = uniqueTimes[uniqueTimes.length - 1];

                    if (layerReveal.mode === 'root-to-samples') {
                      setTemporalState(prev => ({
                        ...prev,
                        isActive: true,
                        mode: 'hide',
                        range: [maxTime, maxTime]
                      }));
                    } else {
                      setTemporalState(prev => ({
                        ...prev,
                        isActive: true,
                        mode: layerReveal.mode === 'glide' ? 'hybrid' : 'hide',
                        range: [minTime, minTime]
                      }));
                    }

                    setTemporalFilterEnabled(true);
                    setLayerReveal(prev => ({
                      ...prev,
                      enabled: true,
                      isPlaying: true,
                      currentProgress: 0,
                      initialZoom: viewState.zoom,
                      initialTarget: viewState.target
                    }));
                  }
                }}
                onPause={() => setLayerReveal(prev => ({ ...prev, isPlaying: false }))}
                onResume={() => setLayerReveal(prev => ({ ...prev, isPlaying: true }))}
                onCancel={() => {
                  setLayerReveal(prev => ({ ...prev, enabled: false, isPlaying: false, currentProgress: 0 }));
                  setTemporalState(prev => ({ ...prev, isActive: false, range: [prev.minTime, prev.maxTime] }));
                  setTemporalFilterEnabled(false);
                }}
                onRateChange={(rate) => setLayerReveal(prev => ({ ...prev, rate }))}
                onModeChange={(mode) => setLayerReveal(prev => ({ ...prev, mode }))}
              />
            )}
          </div>

          {/* Spatial (genomic/tree) slider at bottom when enabled */}
          {spatialFilterEnabled && (
            <div className="flex-shrink-0 border-t px-4 pt-2 pb-1" style={{ backgroundColor: colors.background, borderTopColor: colors.border }}>
              {filterState.mode === 'genomic' && metadata.sequenceLength > 0 ? (
                <RangeSlider
                  min={0}
                  max={metadata.sequenceLength}
                  step={Math.max(1, Math.floor(metadata.sequenceLength / CONTAINER_CONSTANTS.GENOMIC_STEP_DIVISOR))}
                  value={filterState.genomicRange}
                  onChange={(newRange) => setFilterState(prev => ({ ...prev, genomicRange: newRange }))}
                  formatValue={formatGenomicPosition}
                  label="Genomic Range"
                  filterMode={genomicFilterMode === 'subset' ? 'subset' : 'highlight'}
                  onFilterModeChange={(mode) => setGenomicFilterMode(mode === 'subset' ? 'subset' : 'dim')}
                  dimOpacity={genomicDimOpacity}
                  onDimOpacityChange={setGenomicDimOpacity}
                />
              ) : metadata.treeIntervals.length > 0 ? (
                <TreeRangeSlider
                  treeIntervals={metadata.treeIntervals}
                  value={filterState.treeRange}
                  onChange={(newRange) => setFilterState(prev => ({ ...prev, treeRange: newRange }))}
                  label="Tree Range"
                  filterMode={treeFilterMode === 'subset' ? 'subset' : 'highlight'}
                  onFilterModeChange={(mode) => setTreeFilterMode(mode === 'subset' ? 'subset' : 'dim')}
                  dimOpacity={treeDimOpacity}
                  onDimOpacityChange={setTreeDimOpacity}
                />
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpatialArg3DVisualizationContainer; 