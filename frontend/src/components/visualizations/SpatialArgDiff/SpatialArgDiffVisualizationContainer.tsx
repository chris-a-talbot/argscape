import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useColorTheme } from '../../../context/ColorThemeContext';
import { api } from '../../../lib/api';
import { GraphData, GraphNode, TreeInterval } from '../ForceDirectedGraph/ForceDirectedGraph.types';
import SpatialArgDiffVisualization from './SpatialArgDiffVisualization';
import { useGeographicState, GeographicMode } from '../../../hooks/useGeographicState';
import { TemporalSpacingMode, NodeIdSettings, EdgeMutationSettings, AncestryHeatmapSettings } from '../SpatialArg3D/SpatialArg3DVisualization.types';
import { RangeSlider } from '../../ui/range-slider';
import { TreeRangeSlider } from '../../ui/tree-range-slider';
import { TemporalRangeSlider } from '../../ui/temporal-range-slider';
import { SpatialArgDiffControls } from './SpatialArgDiffControls';
import { SpatialArg3DLegend } from '../SpatialArg3D/SpatialArg3DLegend';
import { SpatialArg3DAnimationPopout } from '../SpatialArg3D/SpatialArg3DAnimationPopout';
import { KeyboardShortcutProvider } from '@/components/ui/QuickActionsBar/hooks/KeyboardShortcutProvider';
import type { DiffViewMode } from '@/components/ui/QuickActionsBar/panels/DiffPanel';
import type { CameraPreset, GeographicMode as QuickActionsGeographicMode } from '@/components/ui/QuickActionsBar/panels';
import { formatGenomicPosition } from '../../../utils/colorUtils';
import { convertTreeIntervals, validateSpatialData } from '../../../utils/dataHelpers';
import { isRootNode, getDescendants, getAncestors } from '../../../utils/graphTraversal';

// Types
type ViewMode = 'full' | 'subgraph' | 'ancestors';

// Constants
const CONTAINER_CONSTANTS = {
  DEBOUNCE_DELAY: 500,
  GENOMIC_STEP_DIVISOR: 1000,
  TIME_PRECISION: 3,
  TEMPORAL_STEP_DIVISOR: 1000,
  TEMPORAL_SLIDER_HEIGHT: 350
};

interface SpatialArgDiffVisualizationContainerProps {
  firstFilename: string;
  secondFilename: string;
  max_samples?: number; // Max samples to use (defaults to 15 if not provided)
  initialHeatmapMode?: boolean; // Start with heatmap enabled and nodes hidden
}

// Default visual settings
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
  diffEdgeWidth: 3,
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

export const SpatialArgDiffVisualizationContainer: React.FC<SpatialArgDiffVisualizationContainerProps> = ({
  firstFilename,
  secondFilename,
  max_samples,
  initialHeatmapMode = false
}) => {
  const { colors } = useColorTheme();
  const navigate = useNavigate();
  
  // Visual settings state
  const [visualSettings, setVisualSettings] = useState(DEFAULT_VISUAL_SETTINGS);
  const [nodeIdSettings, setNodeIdSettings] = useState<NodeIdSettings>(DEFAULT_VISUAL_SETTINGS.nodeIdSettings);
  const [edgeMutationSettings, setEdgeMutationSettings] = useState<EdgeMutationSettings>({
    showMutationMarkers: DEFAULT_VISUAL_SETTINGS.edgeMutationSettings.showMutationMarkers,
    markerSize: DEFAULT_VISUAL_SETTINGS.edgeMutationSettings.markerSize || 18
  });
  const [heatmapSettings, setHeatmapSettings] = useState<AncestryHeatmapSettings>(() => ({
    ...DEFAULT_VISUAL_SETTINGS.heatmapSettings,
    enabled: initialHeatmapMode,
    nodeVisibility: initialHeatmapMode ? 'none' : 'all'
  }));
  const [colorByPopulation, setColorByPopulation] = useState(false);
  // Diff view mode state
  const [diffViewMode, setDiffViewMode] = useState<DiffViewMode>('diff');
  const [showErrorBars, setShowErrorBars] = useState(true);

  // View mode state for subgraph/ancestors functionality
  const [viewMode, setViewMode] = useState<ViewMode>('full');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  
  const [viewState, setViewState] = useState({
    target: [0, 0, 0] as [number, number, number],
    zoom: 1.8,
    minZoom: 0.01,
    maxZoom: 100,
    rotationX: 30,
    rotationOrbit: 0,
    orbitAxis: 'Y' as const
  });

  // Filter state
  type FilterMode = 'genomic' | 'tree';
  type TemporalFilterMode = 'hide' | 'planes' | 'hybrid';
  
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

  // Filter visibility toggles (show sliders alongside visualization)
  const [spatialFilterEnabled, setSpatialFilterEnabled] = useState(false);
  const [temporalFilterEnabled, setTemporalFilterEnabled] = useState(false);

  // Filter modes: 'subset' hides elements, 'dim' shows them with reduced opacity
  const [genomicFilterMode, setGenomicFilterMode] = useState<'subset' | 'dim'>('dim');
  const [treeFilterMode, setTreeFilterMode] = useState<'subset' | 'dim'>('dim');
  const [temporalFilterMode, setTemporalFilterMode] = useState<'subset' | 'dim'>('dim');

  // Dim opacity values (0-1) for when filter mode is 'dim'
  const [genomicDimOpacity, setGenomicDimOpacity] = useState(0.15);
  const [treeDimOpacity, setTreeDimOpacity] = useState(0.15);
  const [temporalDimOpacity, setTemporalDimOpacity] = useState(0.15);

  const [metadata, setMetadata] = useState({
    sequenceLength: 0,
    treeIntervals: [] as TreeInterval[]
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
    rate: 1.0,
    currentProgress: 0,
    mode: 'glide' as 'hide' | 'glide' | 'root-to-samples', // 'hide' = just add layers, 'glide' = dim below and glide shapefile, 'root-to-samples' = reveal from root down
    initialZoom: 1.8, // Store initial zoom level for dynamic zoom calculation
    initialTarget: [0, 0, 0] as [number, number, number] // Store initial camera target
  });

  // Data loading state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [firstData, setFirstData] = useState<GraphData | null>(null);
  const [secondData, setSecondData] = useState<GraphData | null>(null);

  // Geographic state
  const {
    mode: geographicMode,
    setMode: setGeographicMode,
    currentShape,
    isLoading: isLoadingGeographic,
    customShapeFile,
    setCustomShapeFile,
    updateFromCrsDetection
  } = useGeographicState();

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
      // When enabling, set range to full [minTime, maxTime]
      setTemporalState(prev => ({
        ...prev,
        range: [prev.minTime, prev.maxTime]
      }));
    }
  }, []);

  // Helper to apply temporal filtering client-side
  const applyTemporalFiltering = useCallback((
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
  }, []);

  // Apply viewMode filtering (subgraph/ancestors) and temporal filtering
  const filteredFirstData = useMemo(() => {
    if (!firstData) return null;
    
    let data = firstData;
    
    // Apply viewMode filtering first
    if (viewMode !== 'full' && selectedNode) {
      switch (viewMode) {
        case 'subgraph': {
          const descendants = getDescendants(selectedNode, data.nodes, data.edges);
          descendants.add(selectedNode.id);
          
          const filteredNodes = data.nodes.filter(node => descendants.has(node.id));
          const filteredEdges = data.edges.filter(edge => {
            const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
            const targetId = typeof edge.target === 'number' ? edge.target : edge.target.id;
            return descendants.has(sourceId) && descendants.has(targetId);
          });
          
          data = {
            ...data,
            nodes: filteredNodes,
            edges: filteredEdges,
            metadata: { ...data.metadata, is_subset: true }
          };
          break;
        }
        case 'ancestors': {
          const ancestors = getAncestors(selectedNode, data.nodes, data.edges);
          ancestors.add(selectedNode.id);
          
          const filteredNodes = data.nodes.filter(node => ancestors.has(node.id));
          const filteredEdges = data.edges.filter(edge => {
            const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
            const targetId = typeof edge.target === 'number' ? edge.target : edge.target.id;
            return ancestors.has(sourceId) && ancestors.has(targetId);
          });
          
          data = {
            ...data,
            nodes: filteredNodes,
            edges: filteredEdges,
            metadata: { ...data.metadata, is_subset: true }
          };
          break;
        }
      }
    }
    
    // Then apply temporal filtering
    return applyTemporalFiltering(data, temporalState, temporalFilterEnabled, temporalFilterMode);
  }, [firstData, temporalState, temporalFilterEnabled, temporalFilterMode, applyTemporalFiltering, viewMode, selectedNode]);

  const filteredSecondData = useMemo(() => {
    if (!secondData) return null;
    
    let data = secondData;
    
    // Apply viewMode filtering first
    if (viewMode !== 'full' && selectedNode) {
      switch (viewMode) {
        case 'subgraph': {
          const descendants = getDescendants(selectedNode, data.nodes, data.edges);
          descendants.add(selectedNode.id);
          
          const filteredNodes = data.nodes.filter(node => descendants.has(node.id));
          const filteredEdges = data.edges.filter(edge => {
            const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
            const targetId = typeof edge.target === 'number' ? edge.target : edge.target.id;
            return descendants.has(sourceId) && descendants.has(targetId);
          });
          
          data = {
            ...data,
            nodes: filteredNodes,
            edges: filteredEdges,
            metadata: { ...data.metadata, is_subset: true }
          };
          break;
        }
        case 'ancestors': {
          const ancestors = getAncestors(selectedNode, data.nodes, data.edges);
          ancestors.add(selectedNode.id);
          
          const filteredNodes = data.nodes.filter(node => ancestors.has(node.id));
          const filteredEdges = data.edges.filter(edge => {
            const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
            const targetId = typeof edge.target === 'number' ? edge.target : edge.target.id;
            return ancestors.has(sourceId) && ancestors.has(targetId);
          });
          
          data = {
            ...data,
            nodes: filteredNodes,
            edges: filteredEdges,
            metadata: { ...data.metadata, is_subset: true }
          };
          break;
        }
      }
    }
    
    // Then apply temporal filtering
    return applyTemporalFiltering(data, temporalState, temporalFilterEnabled, temporalFilterMode);
  }, [secondData, temporalState, temporalFilterEnabled, temporalFilterMode, applyTemporalFiltering, viewMode, selectedNode]);

  // Calculate diff stats for the DiffPanel
  const diffStats = useMemo(() => {
    if (!filteredFirstData || !filteredSecondData) {
      return { averageDistance: 0, maxDistance: 0, minDistance: 0, nodeCount: 0 };
    }

    const secondNodesMap = new Map(filteredSecondData.nodes.map(node => [node.id, node]));
    const distances: number[] = [];

    filteredFirstData.nodes.forEach(node => {
      if (node.is_sample) return;
      const secondNode = secondNodesMap.get(node.id);
      if (!secondNode || !node.location || !secondNode.location) return;
      const dx = node.location.x - secondNode.location.x;
      const dy = node.location.y - secondNode.location.y;
      distances.push(Math.sqrt(dx * dx + dy * dy));
    });

    if (distances.length === 0) {
      return { averageDistance: 0, maxDistance: 0, minDistance: 0, nodeCount: 0 };
    }

    return {
      averageDistance: distances.reduce((sum, d) => sum + d, 0) / distances.length,
      maxDistance: Math.max(...distances),
      minDistance: Math.min(...distances),
      nodeCount: distances.length,
    };
  }, [filteredFirstData, filteredSecondData]);

  // Load both tree sequences in parallel
  useEffect(() => {
    const loadData = async () => {
      if (!firstFilename || !secondFilename) {
        setError('Both tree sequences must be provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Load both tree sequences in parallel (no filtering on initial load)
        const [firstResponse, secondResponse] = await Promise.all([
          api.getGraphData(firstFilename, max_samples ? { maxSamples: max_samples } : undefined),
          api.getGraphData(secondFilename, max_samples ? { maxSamples: max_samples } : undefined)
        ]);

        const firstData = firstResponse.data as GraphData;
        const secondData = secondResponse.data as GraphData;

        // Validate both datasets have spatial data
        if (!validateSpatialData(firstData) || !validateSpatialData(secondData)) {
          setError('Both tree sequences must have spatial data');
          setLoading(false);
          return;
        }

        setFirstData(firstData);
        setSecondData(secondData);

        // Set intelligent defaults for node ID display based on data size
        const allNodes = [...firstData.nodes, ...secondData.nodes];
        const allEdges = [...firstData.edges, ...secondData.edges];
        const sampleCount = allNodes.filter(n => n.is_sample).length;
        const rootCount = allNodes.filter(n => isRootNode(n, allNodes, allEdges)).length;

        // Calculate default temporal spacing based on number of layers (use first dataset as reference)
        const uniqueTimes = Array.from(new Set(firstData.nodes.map(node => node.time))).sort((a, b) => a - b);
        const numLayers = uniqueTimes.length;
        const defaultTemporalSpacing = calculateDefaultTemporalSpacing(numLayers);

        setVisualSettings(prev => ({ ...prev, temporalSpacing: defaultTemporalSpacing }));

        setNodeIdSettings({
          showSampleIds: sampleCount <= 40,
          showRootIds: rootCount <= 6,
          showInternalIds: false
        });

        // Initialize metadata from first dataset
        if (firstData.metadata.sequence_length) {
          setMetadata(prev => ({ ...prev, sequenceLength: firstData.metadata.sequence_length! }));
          setFilterState(prev => ({ 
            ...prev, 
            genomicRange: [0, firstData.metadata.sequence_length!] 
          }));
        }
        
        if (firstData.metadata.tree_intervals?.length) {
          const intervals = convertTreeIntervals(firstData.metadata.tree_intervals as unknown as [number, number, number][]);
          setMetadata(prev => ({ ...prev, treeIntervals: intervals }));
          setFilterState(prev => ({ 
            ...prev, 
            treeRange: [0, intervals.length - 1] 
          }));
        }

        // Initialize temporal state from combined nodes
        if (firstData.nodes?.length && secondData.nodes?.length) {
          const allTimes = [...firstData.nodes.map(n => n.time), ...secondData.nodes.map(n => n.time)];
          const minTime = Math.min(...allTimes);
          const maxTime = Math.max(...allTimes);
          setTemporalState(prev => ({ ...prev, minTime, maxTime, range: [minTime, maxTime] }));
        }

        // Handle CRS detection
        const firstCrsDetection = firstData.metadata?.coordinate_system_detection;
        const secondCrsDetection = secondData.metadata?.coordinate_system_detection;

        // Always default to unit_grid - never automatically switch to eastern_hemisphere
        // The user can manually change it if needed
        const suggestedMode: GeographicMode = 'unit_grid';

        // Update geographic state based on CRS detection (will show warnings but won't change mode since suggestedMode is unit_grid)
        updateFromCrsDetection(firstCrsDetection, secondCrsDetection, suggestedMode);

        setLoading(false);
      } catch (err) {
        setError('Failed to load tree sequences');
        setLoading(false);
      }
    };

    loadData();
  }, [firstFilename, secondFilename, max_samples]);

  // Separate effect for genomic filtering (only runs when filter is active)
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Only run this effect when filtering is active
    if (!filterState.isActive || loading) return;

    // Check if we actually need to refetch based on filter mode and range
    // In 'dim' mode, we apply opacity client-side and don't need to refetch
    // In 'subset' mode, we only refetch if range is not full
    const isGenomicFullRange = filterState.genomicRange[0] === 0 && filterState.genomicRange[1] === metadata.sequenceLength;
    const isTreeFullRange = filterState.treeRange[0] === 0 && filterState.treeRange[1] === metadata.treeIntervals.length - 1;

    const needsGenomicRefetch = filterState.mode === 'genomic' && genomicFilterMode === 'subset' && !isGenomicFullRange;
    const needsTreeRefetch = filterState.mode === 'tree' && treeFilterMode === 'subset' && !isTreeFullRange;

    if (!needsGenomicRefetch && !needsTreeRefetch) return;

    // Clear any pending timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    // Debounce the filter request
    loadingTimeoutRef.current = setTimeout(async () => {
      try {
        setLoading(true);

        // Build filter options
        const options: any = {};
        if (max_samples) {
          options.maxSamples = max_samples;
        }
        if (needsGenomicRefetch) {
          options.genomicStart = filterState.genomicRange[0];
          options.genomicEnd = filterState.genomicRange[1];
        } else if (needsTreeRefetch) {
          options.treeStartIdx = filterState.treeRange[0];
          options.treeEndIdx = filterState.treeRange[1];
        }

        // Load filtered data
        const [firstResponse, secondResponse] = await Promise.all([
          api.getGraphData(firstFilename, options),
          api.getGraphData(secondFilename, options)
        ]);
        
        const firstData = firstResponse.data as GraphData;
        const secondData = secondResponse.data as GraphData;
        
        if (!validateSpatialData(firstData) || !validateSpatialData(secondData)) {
          setError('No spatial data found in this range.');
        } else {
          setFirstData(firstData);
          setSecondData(secondData);
          setError(null);
          
          // Update node ID settings based on filtered data size
          const allNodes = [...firstData.nodes, ...secondData.nodes];
          const allEdges = [...firstData.edges, ...secondData.edges];
          const sampleCount = allNodes.filter(n => n.is_sample).length;
          const rootCount = allNodes.filter(n => isRootNode(n, allNodes, allEdges)).length;

          // Update temporal spacing based on filtered data layers (use first dataset as reference)
          const uniqueTimes = Array.from(new Set(firstData.nodes.map(node => node.time))).sort((a, b) => a - b);
          const numLayers = uniqueTimes.length;
          const defaultTemporalSpacing = calculateDefaultTemporalSpacing(numLayers);

          setVisualSettings(prev => ({ ...prev, temporalSpacing: defaultTemporalSpacing }));

          setNodeIdSettings({
            showSampleIds: sampleCount <= 40,
            showRootIds: rootCount <= 6,
            showInternalIds: false
          });
        }
      } catch (e) {
        console.error('Error fetching filtered data:', e);
        setError(e instanceof Error ? e.message : 'An error occurred while fetching filtered data');
      } finally {
        setLoading(false);
      }
    }, CONTAINER_CONSTANTS.DEBOUNCE_DELAY);

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [filterState, firstFilename, secondFilename, max_samples, metadata.sequenceLength, metadata.treeIntervals.length, genomicFilterMode, treeFilterMode]);

  // Unused handlers - kept for potential future use
  // const handleTreeSequenceSelect = (treeSequence: any) => {
  //   if (!selectedTreeSequenceToChange) return;
  //   if (!treeSequence.has_temporal || !treeSequence.has_all_spatial) {
  //     // Show error modal
  //     return;
  //   }

  //   if (selectedTreeSequenceToChange === 'first') {
  //     if (treeSequence.filename === secondFilename) {
  //       // Show error modal - can't select same tree sequence
  //       return;
  //     }
  //     navigate(`/spatial-diff/${encodeURIComponent(treeSequence.filename)}?second=${encodeURIComponent(secondFilename)}`);
  //   } else {
  //     if (treeSequence.filename === firstFilename) {
  //       // Show error modal - can't select same tree sequence
  //       return;
  //     }
  //     navigate(`/spatial-diff/${encodeURIComponent(firstFilename)}?second=${encodeURIComponent(treeSequence.filename)}`);
  //   }
  //   setSelectedTreeSequenceToChange(null);
  // };

  // const handleDownload = async () => {
  //   if (!firstData || !secondData) return;

  //   // Create CSV content
  //   const rows = ['Node ID,First X,First Y,Second X,Second Y,Distance'];
  //   
  //   // Create a map of node IDs to their positions in both datasets
  //   const firstPositions = new Map(firstData.nodes.map(node => [node.id, node.location]));
  //   const secondPositions = new Map(secondData.nodes.map(node => [node.id, node.location]));

  //   // For each node in the first dataset, find its corresponding position in the second
  //   firstData.nodes.forEach(node => {
  //     const firstPos = firstPositions.get(node.id);
  //     const secondPos = secondPositions.get(node.id);
  //     
  //     if (firstPos && secondPos) {
  //       const distance = Math.sqrt(
  //         Math.pow(firstPos.x - secondPos.x, 2) + 
  //         Math.pow(firstPos.y - secondPos.y, 2)
  //       );
  //       
  //       rows.push([
  //         node.id,
  //         firstPos.x.toFixed(6),
  //         firstPos.y.toFixed(6),
  //         secondPos.x.toFixed(6),
  //         secondPos.y.toFixed(6),
  //         distance.toFixed(6)
  //       ].join(','));
  //     }
  //   });

  //   // Create and download the file
  //   const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  //   const url = window.URL.createObjectURL(blob);
  //   const a = document.createElement('a');
  //   a.href = url;
  //   a.download = `spatial_diff_${firstFilename}_${secondFilename}.csv`;
  //   document.body.appendChild(a);
  //   a.click();
  //   document.body.removeChild(a);
  //   window.URL.revokeObjectURL(url);
  // };

  const handleViewStateChange = (newViewState: any) => {
    setViewState(prev => ({ ...prev, ...newViewState }));
  };

  const handlePresetViewChange = (newViewState: any) => {
    setViewState(prev => ({ ...prev, ...newViewState }));
  };

  // Handle left click - show subgraph (descendants)
  const handleNodeClick = (node: GraphNode) => {
    if (viewMode === 'full') {
      setSelectedNode(node);
      setViewMode('subgraph');
    } else if (selectedNode?.id === node.id) {
      // Same node clicked again - return to full view
      setViewMode('full');
      setSelectedNode(null);
    } else {
      // Different node clicked - show its subgraph
      setSelectedNode(node);
      setViewMode('subgraph');
    }
  };

  // Handle right click - show ancestors (parent ARG)
  const handleNodeRightClick = (node: GraphNode) => {
    setSelectedNode(node);
    setViewMode('ancestors');
  };

  const handleReturnToFull = () => {
    setViewMode('full');
    setSelectedNode(null);
  };

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
    if (!layerReveal.isPlaying || !firstData || !temporalState.isActive) return;

    // Get unique times from the data
    const uniqueTimes = Array.from(new Set([...firstData.nodes.map(node => node.time), ...(secondData?.nodes.map(node => node.time) || [])])).sort((a, b) => a - b);
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
    const bounds = calculateBounds(firstData, secondData);
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
  }, [layerReveal.isPlaying, layerReveal.rate, layerReveal.currentProgress, layerReveal.mode, firstData, secondData, temporalState.isActive, visualSettings.temporalSpacing]);

  // Calculate bounds for preset view panel
  const calculateBounds = (firstData: GraphData | null, secondData: GraphData | null) => {
    if (!firstData || !secondData || !firstData.nodes.length || !secondData.nodes.length) return null;
    
    const spatialNodes = firstData.nodes.filter(node => 
      node.location?.x !== undefined && node.location?.y !== undefined
    );
    
    if (spatialNodes.length === 0) return null;
    
    // Simple bounds calculation
    const allNodes = [...firstData.nodes, ...secondData.nodes];
    const xCoords = allNodes.map(node => node.location!.x);
    const yCoords = allNodes.map(node => node.location!.y);
    const times = allNodes.map(node => node.time);
    
    const minX = Math.min(...xCoords);
    const maxX = Math.max(...xCoords);
    const minY = Math.min(...yCoords);
    const maxY = Math.max(...yCoords);
    
    // Center the coordinates
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const maxScale = Math.max(maxX - minX, maxY - minY) || 1;
    
    // Transform to visualization space
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

  // Auto-center when data loads
  const autoCenterView = useCallback((firstData: GraphData | null, secondData: GraphData | null) => {
    const bounds = calculateBounds(firstData, secondData);
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
  }, [visualSettings.temporalSpacing, visualSettings.spatialSpacing]);

  useEffect(() => {
    if (firstData && secondData) {
      autoCenterView(firstData, secondData);
    }
  }, [firstData, secondData, autoCenterView]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: colors.accentPrimary }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-lg mb-4" style={{ color: `${colors.text}`, opacity: 0.8, textShadow: '0 0 10px rgba(255, 0, 0, 0.5)' }}>{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded"
            style={{ backgroundColor: colors.accentPrimary, color: colors.background }}
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (!firstData || !secondData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-lg mb-4" style={{ color: `${colors.text}`, opacity: 0.8, textShadow: '0 0 10px rgba(255, 0, 0, 0.5)' }}>No data available</p>
          <p className="text-sm" style={{ color: `${colors.text}B3` }}>
            Both tree sequences must contain spatial information for all nodes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: colors.background }}>
      {/* Minimal Header - Title and view controls only */}
      <div className="flex-shrink-0 border-b" style={{ backgroundColor: colors.background, borderBottomColor: colors.border }}>
        <div className="px-4 py-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-medium" style={{ color: colors.headerText }}>
                {viewMode === 'subgraph'
                  ? `SubARG at Root ${selectedNode?.id}`
                  : viewMode === 'ancestors'
                    ? `Parent ARG of Node ${selectedNode?.id}`
                    : '3D Spatial Diff'}
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

          {/* Main visualization */}
          <SpatialArgDiffVisualization
            firstData={filteredFirstData!}
            secondData={filteredSecondData!}
            originalFirstData={firstData}
            originalSecondData={secondData}
            temporalSpacing={visualSettings.temporalSpacing}
            temporalSpacingMode={visualSettings.temporalSpacingMode}
            spatialSpacing={visualSettings.spatialSpacing}
            temporalGridOpacity={visualSettings.temporalGridOpacity}
            geographicShapeOpacity={visualSettings.geographicShapeOpacity}
            diffEdgeWidth={visualSettings.diffEdgeWidth}
            geographicMode={geographicMode}
            geographicShape={currentShape}
            viewMode={diffViewMode}
            showErrorBars={showErrorBars}
            nodeSizes={visualSettings.nodeSizes}
            nodeIdSettings={nodeIdSettings}
            edgeThickness={visualSettings.edgeThickness}
            edgeOpacity={visualSettings.edgeOpacity}
            edgeLabelSettings={visualSettings.edgeLabelSettings}
            edgeMutationSettings={edgeMutationSettings}
            colorByPopulation={colorByPopulation}
            heatmapSettings={heatmapSettings}
            temporalRange={temporalFilterEnabled ? temporalState.range : null}
            temporalFilterMode={temporalFilterEnabled ? temporalState.mode : null}
            showTemporalPlanes={temporalFilterEnabled && (temporalState.mode === 'planes' || temporalState.mode === 'hybrid')}
            onNodeClick={handleNodeClick}
            onNodeRightClick={handleNodeRightClick}
            selectedNode={selectedNode}
            onViewStateChange={handleViewStateChange}
            externalViewState={viewState}
          />

          {/* Floating Controls */}
          <KeyboardShortcutProvider>
            <SpatialArgDiffControls
              // Diff props
              diffViewMode={diffViewMode}
              onDiffViewModeChange={setDiffViewMode}
              showErrorBars={showErrorBars}
              onShowErrorBarsChange={setShowErrorBars}
              errorBarThickness={visualSettings.diffEdgeWidth}
              onErrorBarThicknessChange={(value) => setVisualSettings(prev => ({ ...prev, diffEdgeWidth: value }))}
              diffStats={diffStats}

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
              temporalFilterMode={temporalFilterMode === 'subset' ? 'subset' : 'highlight'}
              onTemporalFilterModeChange={(mode) => setTemporalFilterMode(mode === 'subset' ? 'subset' : 'dim')}

              // Nodes props
              colorBy={colorByPopulation ? 'population' : 'type'}
              onColorByChange={(mode) => setColorByPopulation(mode === 'population')}
              availableColorModes={firstData?.metadata?.has_populations || secondData?.metadata?.has_populations ? ['type', 'population'] : ['type']}
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

              // Stats props - dual dataset
              firstDatasetStats={{
                label: firstFilename,
                sequenceStats: firstData?.metadata ? {
                  samples: firstData.metadata.num_samples || 0,
                  sites: firstData.metadata.sequence_length || 0,
                  trees: firstData.metadata.num_local_trees || 0,
                  mutations: firstData.edges?.reduce((sum, edge) => sum + (edge.mutations?.length || 0), 0) || 0,
                } : undefined,
                nodeEdgeStats: filteredFirstData && firstData ? {
                  originalNodes: firstData.metadata.original_num_nodes || firstData.nodes.length,
                  subsetNodes: firstData.nodes.length,
                  displayedNodes: filteredFirstData.nodes.length,
                  originalEdges: firstData.metadata.original_num_edges || firstData.edges.length,
                  subsetEdges: firstData.edges.length,
                  displayedEdges: filteredFirstData.edges.length,
                } : undefined,
              }}
              secondDatasetStats={{
                label: secondFilename,
                sequenceStats: secondData?.metadata ? {
                  samples: secondData.metadata.num_samples || 0,
                  sites: secondData.metadata.sequence_length || 0,
                  trees: secondData.metadata.num_local_trees || 0,
                  mutations: secondData.edges?.reduce((sum, edge) => sum + (edge.mutations?.length || 0), 0) || 0,
                } : undefined,
                nodeEdgeStats: filteredSecondData && secondData ? {
                  originalNodes: secondData.metadata.original_num_nodes || secondData.nodes.length,
                  subsetNodes: secondData.nodes.length,
                  displayedNodes: filteredSecondData.nodes.length,
                  originalEdges: secondData.metadata.original_num_edges || secondData.edges.length,
                  subsetEdges: secondData.edges.length,
                  displayedEdges: filteredSecondData.edges.length,
                } : undefined,
              }}

              // Camera props
              currentRotationX={viewState.rotationX}
              currentRotationOrbit={viewState.rotationOrbit}
              currentZoom={viewState.zoom}
              onPresetSelect={(preset: CameraPreset) => handlePresetViewChange({ ...viewState, rotationX: preset.rotationX, rotationOrbit: preset.rotationOrbit })}
              onCenterView={() => autoCenterView(firstData, secondData)}
              autoRotationEnabled={autoRotation.enabled}
              onAutoRotationEnabledChange={(enabled) => setAutoRotation(prev => ({ ...prev, enabled }))}
              autoRotationRate={autoRotation.rate}
              onAutoRotationRateChange={(rate) => setAutoRotation(prev => ({ ...prev, rate }))}

              // Spatial props
              geographicMode={geographicMode as QuickActionsGeographicMode}
              onGeographicModeChange={(mode) => setGeographicMode(mode as GeographicMode)}
              customShapeFile={customShapeFile}
              onCustomShapeFileChange={setCustomShapeFile}
              geographicShapeOpacity={visualSettings.geographicShapeOpacity}
              onGeographicShapeOpacityChange={(opacity) => setVisualSettings(prev => ({ ...prev, geographicShapeOpacity: opacity }))}
              isLoadingGeographic={isLoadingGeographic}
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

              // Export props
              firstFilename={firstFilename}
              secondFilename={secondFilename}

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
                if (firstData) {
                  const uniqueTimes = Array.from(new Set([...firstData.nodes.map(node => node.time), ...(secondData?.nodes.map(node => node.time) || [])])).sort((a, b) => a - b);
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

export default SpatialArgDiffVisualizationContainer;