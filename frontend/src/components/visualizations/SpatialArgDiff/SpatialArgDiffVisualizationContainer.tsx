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
import { VisualizationSidebar } from '../../ui/VisualizationSidebar';
import { VisualizationSection, ViewControlsSection, ElementsSection, InformationSection } from '../SpatialArg3D/SpatialArg3DSidebarSections';
import { DiffControlsSection, DiffStatisticsSection, DiffViewMode } from './SpatialArgDiffSidebarSections';
import { formatGenomicPosition } from '../../../utils/colorUtils';
import { calculatePercentage, convertTreeIntervals, validateSpatialData } from '../../../utils/dataHelpers';
import { isRootNode, getDescendants, getAncestors } from '../../../utils/graphTraversal';

// Types
type ViewMode = 'full' | 'subgraph' | 'ancestors';

// Constants
const CONTAINER_CONSTANTS = {
  DEBOUNCE_DELAY: 500,
  GENOMIC_STEP_DIVISOR: 1000,
  PERCENTAGE_PRECISION: 1,
  TIME_PRECISION: 3,
  TEMPORAL_STEP_DIVISOR: 1000,
  TEMPORAL_SLIDER_HEIGHT: 350
};

// Helper wrapper for calculatePercentage with container precision
const calcPercentage = (value: number, total: number): string => {
  return calculatePercentage(value, total, CONTAINER_CONSTANTS.PERCENTAGE_PRECISION);
};

interface SpatialArgDiffVisualizationContainerProps {
  firstFilename: string;
  secondFilename: string;
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
    markerSize: 6
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

export const SpatialArgDiffVisualizationContainer: React.FC<SpatialArgDiffVisualizationContainerProps> = ({
  firstFilename,
  secondFilename,
  initialHeatmapMode = false
}) => {
  const { colors } = useColorTheme();
  const navigate = useNavigate();
  
  // Visual settings state
  const [visualSettings, setVisualSettings] = useState(DEFAULT_VISUAL_SETTINGS);
  const [nodeIdSettings, setNodeIdSettings] = useState<NodeIdSettings>(DEFAULT_VISUAL_SETTINGS.nodeIdSettings);
  const [edgeMutationSettings, setEdgeMutationSettings] = useState<EdgeMutationSettings>({
    showMutationMarkers: DEFAULT_VISUAL_SETTINGS.edgeMutationSettings.showMutationMarkers,
    markerSize: DEFAULT_VISUAL_SETTINGS.edgeMutationSettings.markerSize || 14
  });
  const [heatmapSettings, setHeatmapSettings] = useState<AncestryHeatmapSettings>(() => ({
    ...DEFAULT_VISUAL_SETTINGS.heatmapSettings,
    enabled: initialHeatmapMode,
    nodeVisibility: initialHeatmapMode ? 'none' : 'all'
  }));
  // Diff view mode state
  const [diffViewMode, setDiffViewMode] = useState<DiffViewMode>('diff');
  const [showErrorBars, setShowErrorBars] = useState(true);
  const [statsTimeRange, setStatsTimeRange] = useState<[number, number]>([0, 1]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedTreeSequenceToChange, setSelectedTreeSequenceToChange] = useState<'first' | 'second' | null>(null);
  const [isFilterSectionCollapsed, setIsFilterSectionCollapsed] = useState(true);
  
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
    mode: 'glide' as 'hide' | 'glide', // 'hide' = just add layers, 'glide' = dim below and glide shapefile
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
    showCrsWarning,
    dismissCrsWarning,
    updateFromCrsDetection
  } = useGeographicState();

  // Helper to apply temporal filtering client-side
  const applyTemporalFiltering = useCallback((data: GraphData, temporalState: any): GraphData => {
    // Only apply filtering that removes nodes for 'hide' and 'hybrid' modes
    if (!temporalState.isActive || (temporalState.mode !== 'hide' && temporalState.mode !== 'hybrid')) return data;
    
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
    return applyTemporalFiltering(data, temporalState);
  }, [firstData, temporalState, applyTemporalFiltering, viewMode, selectedNode]);

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
    return applyTemporalFiltering(data, temporalState);
  }, [secondData, temporalState, applyTemporalFiltering, viewMode, selectedNode]);

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
          api.getGraphData(firstFilename),
          api.getGraphData(secondFilename)
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
          setStatsTimeRange([minTime, maxTime]);
        }

        // Handle CRS detection
        const firstCrsDetection = firstData.metadata?.coordinate_system_detection;
        const secondCrsDetection = secondData.metadata?.coordinate_system_detection;

        // Determine suggested mode based on CRS detections
        let suggestedMode: GeographicMode = 'unit_grid';
        if (firstCrsDetection && secondCrsDetection) {
          if (firstCrsDetection.likely_crs === 'EPSG:4326' && secondCrsDetection.likely_crs === 'EPSG:4326') {
            suggestedMode = 'eastern_hemisphere';
          }
        }

        // Update geographic state based on CRS detection
        updateFromCrsDetection(firstCrsDetection, secondCrsDetection, suggestedMode);

        setLoading(false);
      } catch (err) {
        setError('Failed to load tree sequences');
        setLoading(false);
      }
    };

    loadData();
  }, [firstFilename, secondFilename]);

  // Separate effect for genomic filtering (only runs when filter is active)
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Only run this effect when filtering is active
    if (!filterState.isActive || loading) return;

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
        if (filterState.mode === 'genomic' && metadata.sequenceLength > 0) {
          if (filterState.genomicRange[0] !== 0 || filterState.genomicRange[1] !== metadata.sequenceLength) {
            options.genomicStart = filterState.genomicRange[0];
            options.genomicEnd = filterState.genomicRange[1];
          }
        } else if (filterState.mode === 'tree' && metadata.treeIntervals.length > 0) {
          if (filterState.treeRange[0] !== 0 || filterState.treeRange[1] !== metadata.treeIntervals.length - 1) {
            options.treeStartIdx = filterState.treeRange[0];
            options.treeEndIdx = filterState.treeRange[1];
          }
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
  }, [filterState, firstFilename, secondFilename, metadata.sequenceLength, metadata.treeIntervals.length]);

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

  // Auto-collapse filter section when no filters are active
  useEffect(() => {
    setIsFilterSectionCollapsed(!filterState.isActive && !temporalState.isActive);
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
    if (!layerReveal.isPlaying || !firstData || !temporalState.isActive) return;

    // Get unique times from the data
    const uniqueTimes = Array.from(new Set([...firstData.nodes.map(node => node.time), ...(secondData?.nodes.map(node => node.time) || [])])).sort((a, b) => a - b);
    const numLayers = uniqueTimes.length;
    
    // Calculate animation duration based on rate (layers per second)
    const totalDuration = numLayers / layerReveal.rate; // seconds
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
      const newProgress = Math.min(elapsedTime / totalDuration, 1);
      
      // Calculate which layer we should be showing up to
      const currentLayerIndex = Math.floor(newProgress * numLayers);
      const maxTimeToShow = uniqueTimes[Math.min(currentLayerIndex, numLayers - 1)];
      
      // Update temporal range to reveal up to this layer
      const minTime = uniqueTimes[0];
      
      // For 'glide' mode: use 'planes' temporal mode to dim lower layers and glide shapefile
      // The range [minTime, maxTimeToShow] means:
      // - Nodes from minTime to maxTimeToShow are shown
      // - In 'planes' mode, nodes below maxTimeToShow are dimmed
      // - Shapefile glides to maxTimeToShow position
      // - Nodes above maxTimeToShow are hidden (not yet revealed)
      setTemporalState(prev => ({
        ...prev,
        range: [minTime, maxTimeToShow]
      }));
      
      // Calculate Z position of current layer
      const currentLayerZ = currentLayerIndex * visualSettings.temporalSpacing;
      
      // Position camera to show current layer near the top of view (not center)
      // Offset the target Z downwards so current layer appears higher in frame
      // This prevents older layers from immediately going off the bottom
      const verticalOffset = currentLayerZ * 0.35; // Current layer at ~35% from top
      const targetZ = currentLayerZ - verticalOffset;
      
      // Calculate dynamic zoom to fit revealed structure
      // Only zoom out when structure gets larger than initial view
      const currentHeight = currentLayerZ;
      
      // Calculate what zoom would be needed to fit everything
      // More sophisticated calculation: consider both spatial and temporal extents
      const combinedExtent = Math.sqrt(spatialExtent * spatialExtent + currentHeight * currentHeight);
      const initialExtent = spatialExtent;
      
      // Only start zooming out when we significantly exceed the initial extent
      let targetZoom = layerReveal.initialZoom;
      if (combinedExtent > initialExtent * 1.5) {
        // Zoom out proportionally, but with an even gentler curve
        // Using 0.8 power makes zoom-out less aggressive
        const zoomFactor = Math.pow(initialExtent / combinedExtent, 0.8);
        targetZoom = Math.max(MIN_ZOOM, layerReveal.initialZoom * zoomFactor);
      }
      
      // Smoothly update camera target and zoom
      setViewState(prev => ({
        ...prev,
        target: [initialX, initialY, targetZ] as [number, number, number],
        zoom: targetZoom
      }));
      
      // Update progress
      setLayerReveal(prev => ({
        ...prev,
        currentProgress: newProgress
      }));
      
      // Continue animation if not complete
      if (newProgress < 1) {
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
  }, [layerReveal.isPlaying, layerReveal.rate, layerReveal.currentProgress, firstData, secondData, temporalState.isActive, visualSettings.temporalSpacing]);

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
    <div 
      className="w-full h-full flex flex-col overflow-hidden"
      style={{ backgroundColor: colors.background }}
    >
      {/* Header Section */}
      <div 
        className="flex-shrink-0 border-b px-4 py-2"
        style={{ 
          backgroundColor: colors.background,
          borderBottomColor: colors.border 
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold" style={{ color: colors.headerText }}>
                {viewMode === 'subgraph' 
                  ? `SubARG at Root ${selectedNode?.id}` 
                  : viewMode === 'ancestors'
                    ? `Parent ARG of Node ${selectedNode?.id}`
                    : '3D Spatial Diff Visualization'}
              </h2>
              
              {viewMode !== 'full' && (
                <button
                  onClick={handleReturnToFull}
                  className="font-medium px-3 py-1 rounded text-sm transition-colors border"
                  style={{
                    backgroundColor: colors.containerBackground,
                    color: colors.text,
                    borderColor: colors.border
                  }}
                >
                  Return to Full ARG
                </button>
              )}
              
              {(metadata.sequenceLength > 0 || metadata.treeIntervals.length > 0) && (
                <div className="flex items-center gap-4">
                  {metadata.sequenceLength > 0 && (
                    <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: colors.headerText }}>
                      <input
                        type="checkbox"
                        checked={filterState.isActive}
                        onChange={() => setFilterState(prev => ({ ...prev, isActive: !prev.isActive }))}
                        className="w-4 h-4 rounded focus:ring-2"
                        style={{
                          accentColor: colors.accentPrimary
                        }}
                      />
                      Filter Genomic Range
                    </label>
                  )}

                  <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: colors.headerText }}>
                    <input
                      type="checkbox"
                      checked={temporalState.isActive}
                      onChange={() => setTemporalState(prev => ({ ...prev, isActive: !prev.isActive }))}
                      className="w-4 h-4 rounded focus:ring-2"
                      style={{
                        accentColor: colors.accentPrimary
                      }}
                    />
                    Filter Temporal Range
                  </label>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Show/hide controls button when filters are active */}
            {(filterState.isActive || temporalState.isActive) && (
              <button
                onClick={() => setIsFilterSectionCollapsed(!isFilterSectionCollapsed)}
                className="flex items-center gap-2 px-3 py-1 rounded text-sm font-medium transition-colors"
                style={{
                  backgroundColor: colors.accentPrimary,
                  color: colors.background
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                <span>
                  {isFilterSectionCollapsed ? 'Show Sliders' : 'Hide Sliders'}
                </span>
                <svg 
                  className={`w-4 h-4 transition-transform ${isFilterSectionCollapsed ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
            
            <div className="flex items-center gap-4 text-xs" style={{ color: colors.headerText }}>
              <div className="flex items-center gap-1">
                <div 
                  className="w-2 h-2 rounded-full border"
                  style={{
                    backgroundColor: `rgb(${colors.nodeSample[0]}, ${colors.nodeSample[1]}, ${colors.nodeSample[2]})`,
                    borderColor: colors.background,
                    borderWidth: '0.5px'
                  }}
                ></div>
                <span>Sample</span>
              </div>
              <div className="flex items-center gap-1">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{backgroundColor: `rgb(${colors.nodeDefault[0]}, ${colors.nodeDefault[1]}, ${colors.nodeDefault[2]})`}}
                ></div>
                <span>Internal</span>
              </div>
              <div className="flex items-center gap-1">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{backgroundColor: `rgb(${colors.nodeCombined[0]}, ${colors.nodeCombined[1]}, ${colors.nodeCombined[2]})`}}
                ></div>
                <span>Combined</span>
              </div>
              <div className="flex items-center gap-1">
                <div 
                  className="w-2 h-2 rounded-full border-2" 
                  style={{
                    backgroundColor: `rgb(${colors.nodeRoot[0]}, ${colors.nodeRoot[1]}, ${colors.nodeRoot[2]})`,
                    borderColor: `rgb(${colors.nodeSelected[0]}, ${colors.nodeSelected[1]}, ${colors.nodeSelected[2]})`
                  }}
                ></div>
                <span>Root</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filter Controls Section */}
      {(filterState.isActive || temporalState.isActive) && (
        <div 
          className="flex-shrink-0 border-b"
          style={{ 
            backgroundColor: colors.background,
            borderBottomColor: colors.border 
          }}
        >
          {!isFilterSectionCollapsed && (
            <div className="px-4 py-3">
              <div className="flex items-start justify-between gap-6">
                <div className="flex flex-col gap-3 flex-shrink-0 min-w-0">
                  {filterState.isActive && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm whitespace-nowrap" style={{ color: colors.text }}>Genomic Mode:</span>
                      <div className="flex rounded overflow-hidden" style={{ backgroundColor: colors.containerBackground }}>
                        <button
                          onClick={() => setFilterState(prev => ({ ...prev, mode: 'genomic' }))}
                          className="px-3 py-1 text-xs font-medium transition-colors"
                          style={{
                            backgroundColor: filterState.mode === 'genomic' ? colors.accentPrimary : colors.containerBackground,
                            color: filterState.mode === 'genomic' ? colors.background : colors.text
                          }}
                        >
                          Genomic
                        </button>
                        {metadata.treeIntervals.length > 0 && (
                          <button
                            onClick={() => setFilterState(prev => ({ ...prev, mode: 'tree' }))}
                            className="px-3 py-1 text-xs font-medium transition-colors"
                            style={{
                              backgroundColor: filterState.mode === 'tree' ? colors.accentPrimary : colors.containerBackground,
                              color: filterState.mode === 'tree' ? colors.background : colors.text
                            }}
                          >
                            Tree Index
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {temporalState.isActive && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm whitespace-nowrap" style={{ color: colors.text }}>Temporal Mode:</span>
                      <div className="flex rounded overflow-hidden" style={{ backgroundColor: colors.containerBackground }}>
                        <button
                          onClick={() => setTemporalState(prev => ({ ...prev, mode: 'hide' }))}
                          className="px-3 py-1 text-xs font-medium transition-colors"
                          style={{
                            backgroundColor: temporalState.mode === 'hide' ? colors.accentPrimary : colors.containerBackground,
                            color: temporalState.mode === 'hide' ? colors.background : colors.text
                          }}
                        >
                          Hide Others
                        </button>
                        <button
                          onClick={() => setTemporalState(prev => ({ ...prev, mode: 'planes' }))}
                          className="px-3 py-1 text-xs font-medium transition-colors"
                          style={{
                            backgroundColor: temporalState.mode === 'planes' ? colors.accentPrimary : colors.containerBackground,
                            color: temporalState.mode === 'planes' ? colors.background : colors.text
                          }}
                        >
                          Dim Others
                        </button>
                        <button
                          onClick={() => setTemporalState(prev => ({ ...prev, mode: 'hybrid' }))}
                          className="px-3 py-1 text-xs font-medium transition-colors"
                          style={{
                            backgroundColor: temporalState.mode === 'hybrid' ? colors.accentPrimary : colors.containerBackground,
                            color: temporalState.mode === 'hybrid' ? colors.background : colors.text
                          }}
                        >
                          Hybrid
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {filterState.isActive && (
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex-1 max-w-md min-w-0">
                      {filterState.mode === 'genomic' && metadata.sequenceLength > 0 ? (
                        <RangeSlider
                          min={0}
                          max={metadata.sequenceLength}
                          step={Math.max(1, Math.floor(metadata.sequenceLength / CONTAINER_CONSTANTS.GENOMIC_STEP_DIVISOR))}
                          value={filterState.genomicRange}
                          onChange={(newRange) => setFilterState(prev => ({ ...prev, genomicRange: newRange }))}
                          formatValue={formatGenomicPosition}
                          className="w-full"
                        />
                      ) : filterState.mode === 'tree' && metadata.treeIntervals.length > 0 ? (
                        <TreeRangeSlider
                          treeIntervals={metadata.treeIntervals}
                          value={filterState.treeRange}
                          onChange={(newRange) => setFilterState(prev => ({ ...prev, treeRange: newRange }))}
                          className="w-full"
                        />
                      ) : null}
                    </div>
                    
                    <div className="text-xs flex-shrink-0" style={{ color: colors.text }}>
                      {filterState.mode === 'genomic' ? (
                        <span>
                          {formatGenomicPosition(filterState.genomicRange[1] - filterState.genomicRange[0])} bp
                          ({calcPercentage(filterState.genomicRange[1] - filterState.genomicRange[0], metadata.sequenceLength)}%)
                        </span>
                      ) : filterState.mode === 'tree' && metadata.treeIntervals.length > 0 ? (
                        <span>
                          Trees {filterState.treeRange[0]}-{filterState.treeRange[1]} ({filterState.treeRange[1] - filterState.treeRange[0] + 1} of {metadata.treeIntervals.length})
                        </span>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
              
              {temporalState.isActive && (
                <div className="text-xs mt-3" style={{ color: colors.text }}>
                  <div className="flex items-center gap-2">
                    <span>
                      Temporal Range: {temporalState.range[0].toFixed(CONTAINER_CONSTANTS.TIME_PRECISION)} - {temporalState.range[1].toFixed(CONTAINER_CONSTANTS.TIME_PRECISION)}{' '}
                      ({calcPercentage(temporalState.range[1] - temporalState.range[0], temporalState.maxTime - temporalState.minTime)}% of time range)
                      • Hold Shift + drag to maintain window size
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-hidden flex">
        {temporalState.isActive && !isFilterSectionCollapsed && (
          <div 
            className="flex-shrink-0 border-r px-3 py-4 flex items-center justify-center"
            style={{ 
              backgroundColor: colors.background,
              borderRightColor: colors.border 
            }}
          >
            <TemporalRangeSlider
              min={temporalState.minTime}
              max={temporalState.maxTime}
              step={(temporalState.maxTime - temporalState.minTime) / CONTAINER_CONSTANTS.TEMPORAL_STEP_DIVISOR}
              value={temporalState.range}
              onChange={(newRange) => setTemporalState(prev => ({ ...prev, range: newRange }))}
              formatValue={(v) => v.toFixed(CONTAINER_CONSTANTS.TIME_PRECISION)}
              height={CONTAINER_CONSTANTS.TEMPORAL_SLIDER_HEIGHT}
            />
          </div>
        )}
        
        <div className="flex-1 overflow-hidden flex flex-row">
          {/* Main visualization area */}
          <div className="flex-1 overflow-hidden relative">
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
                  t = {temporalState.range[1].toFixed(CONTAINER_CONSTANTS.TIME_PRECISION)}
                </span>
                {layerReveal.isPlaying && (
                  <span className="text-xs opacity-75">Playing</span>
                )}
              </div>
            </div>
          )}
      <SpatialArgDiffVisualization
            firstData={filteredFirstData!}
            secondData={filteredSecondData!}
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
            heatmapSettings={heatmapSettings}
            temporalRange={temporalState.isActive ? temporalState.range : null}
            temporalFilterMode={temporalState.isActive ? temporalState.mode : null}
            showTemporalPlanes={temporalState.isActive && (temporalState.mode === 'planes' || temporalState.mode === 'hybrid')}
            onNodeClick={handleNodeClick}
            onNodeRightClick={handleNodeRightClick}
            selectedNode={selectedNode}
            onViewStateChange={handleViewStateChange}
            externalViewState={viewState}
          />
        </div>

        {/* New Unified Sidebar */}
        <VisualizationSidebar
          position="right"
          defaultWidth={360}
          minWidth={280}
          maxWidth={500}
          defaultCollapsed={false}
          sections={[
            {
              id: 'diff-controls',
              title: 'Diff Controls',
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              ),
              defaultOpen: true,
              content: (
                <DiffControlsSection
                  diffEdgeWidth={visualSettings.diffEdgeWidth}
                  onDiffEdgeWidthChange={(value) => setVisualSettings(prev => ({ ...prev, diffEdgeWidth: value }))}
                  viewMode={diffViewMode}
                  onViewModeChange={setDiffViewMode}
                  showErrorBars={showErrorBars}
                  onShowErrorBarsChange={setShowErrorBars}
                />
              ),
            },
            {
              id: 'diff-statistics',
              title: 'Diff Statistics',
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              ),
              defaultOpen: true,
              content: (
                <DiffStatisticsSection
                  firstData={firstData}
                  secondData={secondData}
                  minTime={temporalState.minTime}
                  maxTime={temporalState.maxTime}
                  statsTimeRange={statsTimeRange}
                  onStatsTimeRangeChange={setStatsTimeRange}
                />
              ),
            },
            {
              id: 'visualization',
              title: 'Visualization',
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              defaultOpen: true,
              content: (
                <VisualizationSection
                  geographicMode={geographicMode}
                  onGeographicModeChange={setGeographicMode}
                  customShapeFile={customShapeFile}
                  onCustomShapeFileChange={setCustomShapeFile}
                  geographicShapeOpacity={visualSettings.geographicShapeOpacity}
                  onGeographicShapeOpacityChange={(value) => setVisualSettings(prev => ({ ...prev, geographicShapeOpacity: value }))}
                  isLoadingGeographic={isLoadingGeographic}
                  currentShape={currentShape}
                  temporalSpacing={visualSettings.temporalSpacing}
                  onTemporalSpacingChange={(value) => setVisualSettings(prev => ({ ...prev, temporalSpacing: value }))}
                  temporalSpacingMode={visualSettings.temporalSpacingMode}
                  onTemporalSpacingModeChange={(mode) => setVisualSettings(prev => ({ ...prev, temporalSpacingMode: mode }))}
                  temporalGridOpacity={visualSettings.temporalGridOpacity}
                  onTemporalGridOpacityChange={(value) => setVisualSettings(prev => ({ ...prev, temporalGridOpacity: value }))}
                  spatialSpacing={visualSettings.spatialSpacing}
                  onSpatialSpacingChange={(value) => setVisualSettings(prev => ({ ...prev, spatialSpacing: value }))}
                  temporalFilterMode={temporalState.mode}
                  isTemporalFilterActive={temporalState.isActive}
                  heatmapSettings={heatmapSettings}
                  onHeatmapSettingsChange={(settings) => setHeatmapSettings(settings)}
                  showCrsWarning={showCrsWarning}
                  crsDetection={firstData?.metadata.coordinate_system_detection}
                  onDismissCrsWarning={dismissCrsWarning}
                />
              ),
            },
            {
              id: 'view-controls',
              title: 'View Controls',
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              ),
              defaultOpen: true,
              content: (
                <ViewControlsSection
                  currentViewState={viewState}
                  bounds={calculateBounds(firstData, secondData)}
                  onViewStateChange={handlePresetViewChange}
                  autoRotationEnabled={autoRotation.enabled}
                  autoRotationRate={autoRotation.rate}
                  onAutoRotationEnabledChange={(enabled) => setAutoRotation(prev => ({ ...prev, enabled }))}
                  onAutoRotationRateChange={(rate) => setAutoRotation(prev => ({ ...prev, rate }))}
                  layerRevealEnabled={layerReveal.enabled}
                  layerRevealPlaying={layerReveal.isPlaying}
                  layerRevealRate={layerReveal.rate}
                  layerRevealMode={layerReveal.mode}
                  onLayerRevealModeChange={(mode: 'hide' | 'glide') => setLayerReveal(prev => ({ ...prev, mode }))}
                  onLayerRevealStart={() => {
                    if (firstData) {
                      const uniqueTimes = Array.from(new Set([...firstData.nodes.map(node => node.time), ...(secondData?.nodes.map(node => node.time) || [])])).sort((a, b) => a - b);
                      const minTime = uniqueTimes[0];
                      setTemporalState(prev => ({ 
                        ...prev, 
                        isActive: true, 
                        mode: layerReveal.mode === 'glide' ? 'hybrid' : 'hide', 
                        range: [minTime, minTime] 
                      }));
                      setLayerReveal(prev => ({ 
                        ...prev, 
                        enabled: true, 
                        isPlaying: true, 
                        currentProgress: 0,
                        initialZoom: viewState.zoom, // Capture current zoom for dynamic adjustment
                        initialTarget: viewState.target // Capture current camera target
                      }));
                    }
                  }}
                  onLayerRevealPause={() => setLayerReveal(prev => ({ ...prev, isPlaying: false }))}
                  onLayerRevealResume={() => setLayerReveal(prev => ({ ...prev, isPlaying: true }))}
                  onLayerRevealCancel={() => {
                    setLayerReveal(prev => ({ ...prev, enabled: false, isPlaying: false, currentProgress: 0 }));
                    setTemporalState(prev => ({ ...prev, isActive: false, range: [prev.minTime, prev.maxTime] }));
                  }}
                  onLayerRevealRateChange={(rate: number) => setLayerReveal(prev => ({ ...prev, rate }))}
                />
              ),
            },
            {
              id: 'elements',
              title: 'Elements',
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              ),
              defaultOpen: false,
              content: (
                <ElementsSection
                  nodeSizes={visualSettings.nodeSizes}
                  onNodeSizeChange={(sizes) => setVisualSettings(prev => ({ ...prev, nodeSizes: sizes }))}
                  nodeIdSettings={nodeIdSettings}
                  onNodeIdSettingsChange={(settings) => setNodeIdSettings(settings)}
                  edgeThickness={visualSettings.edgeThickness}
                  onEdgeThicknessChange={(value) => setVisualSettings(prev => ({ ...prev, edgeThickness: value }))}
                  edgeOpacity={visualSettings.edgeOpacity}
                  onEdgeOpacityChange={(value) => setVisualSettings(prev => ({ ...prev, edgeOpacity: value }))}
                  edgeLabelSettings={visualSettings.edgeLabelSettings}
                  onEdgeLabelSettingsChange={(settings) => setVisualSettings(prev => ({ ...prev, edgeLabelSettings: settings }))}
                  edgeMutationSettings={edgeMutationSettings}
                  onEdgeMutationSettingsChange={(settings) => setEdgeMutationSettings(settings)}
                />
              ),
            },
            {
              id: 'information',
              title: 'Information',
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              defaultOpen: false,
              content: (
                <InformationSection
                  originalNodeCount={firstData?.metadata.num_nodes}
                  originalEdgeCount={firstData?.metadata.num_edges}
                  subargNodeCount={firstData?.nodes.length}
                  subargEdgeCount={firstData?.edges.length}
                  displayedNodeCount={filteredFirstData?.nodes.length}
                  displayedEdgeCount={filteredFirstData?.edges.length}
                  crsDetection={firstData?.metadata.coordinate_system_detection ? {
                    crs: firstData.metadata.coordinate_system_detection.likely_crs,
                    confidence: firstData.metadata.coordinate_system_detection.confidence,
                    landPercentage: firstData.metadata.coordinate_system_detection.land_percentage,
                    description: firstData.metadata.coordinate_system_detection.reasoning
                  } : undefined}
                />
              ),
            },
          ]}
        />
        </div>
      </div>
    </div>
  );
};

export default SpatialArgDiffVisualizationContainer;