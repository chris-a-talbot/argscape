import React, { useState, useEffect, useCallback, useRef } from 'react';
import SpatialArg3DVisualization from './SpatialArg3DVisualization';
import { GraphData, GraphNode, GraphEdge, TreeInterval, GeographicShape } from '../ForceDirectedGraph/ForceDirectedGraph.types';
import { RangeSlider } from '../ui/range-slider';
import { TreeRangeSlider } from '../ui/tree-range-slider';
import { TemporalRangeSlider } from '../ui/temporal-range-slider';
import { ArgStatsData } from '../ui/arg-stats-display';
import { api } from '../../lib/api';
import { useColorTheme } from '../../context/ColorThemeContext';
import { useTreeSequence } from '../../context/TreeSequenceContext';
import { TemporalSpacingMode, NodeIdSettings, EdgeMutationSettings } from './SpatialArg3DVisualization.types';
import { VisualizationSidebar } from '../ui/VisualizationSidebar';
import { VisualizationSection, ViewControlsSection, ElementsSection, InformationSection } from './SpatialArg3DSidebarSections';

type ViewMode = 'full' | 'subgraph' | 'ancestors';
type FilterMode = 'genomic' | 'tree';
type TemporalFilterMode = 'hide' | 'planes';
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
    markerSize: 6
  },
  edgeThickness: 1.0,
  edgeOpacity: 60,
  isFilterSectionCollapsed: true,
  temporalSpacingMode: 'equal' as TemporalSpacingMode
};

const formatGenomicPosition = (value: number): string => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toString();
};

const calculatePercentage = (value: number, total: number): string => {
  return ((value / total) * 100).toFixed(CONTAINER_CONSTANTS.PERCENTAGE_PRECISION);
};

const convertTreeIntervals = (backendIntervals: [number, number, number][]): TreeInterval[] => {
  return backendIntervals.map(([index, left, right]) => ({
    index,
    left,
    right
  }));
};

const getGraphTraversalNodes = (
  node: GraphNode, 
  edges: GraphEdge[], 
  direction: 'descendants' | 'ancestors'
): Set<number> => {
  const result = new Set<number>();
  const visited = new Set<number>();
  const queue = [node.id];
  
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);
    
    edges.forEach(edge => {
      const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
      const targetId = typeof edge.target === 'number' ? edge.target : edge.target.id;
      
      const isTraversalEdge = direction === 'descendants' 
        ? sourceId === currentId && !visited.has(targetId)
        : targetId === currentId && !visited.has(sourceId);
        
      if (isTraversalEdge) {
        const nextId = direction === 'descendants' ? targetId : sourceId;
        result.add(nextId);
        queue.push(nextId);
      }
    });
  }
  
  return result;
};

const getDescendants = (node: GraphNode, edges: GraphEdge[]): Set<number> => {
  return getGraphTraversalNodes(node, edges, 'descendants');
};

const getAncestors = (node: GraphNode, edges: GraphEdge[]): Set<number> => {
  return getGraphTraversalNodes(node, edges, 'ancestors');
};

const validateSpatialData = (graphData: GraphData): boolean => {
  const nodesWithSpatial = graphData.nodes.filter((node: GraphNode) => 
    node.location?.x !== undefined && node.location?.y !== undefined
  );
  return nodesWithSpatial.length > 0;
};

const initializeTemporalState = (nodes: GraphNode[]) => {
  if (!nodes?.length) return { minTime: 0, maxTime: 1, range: [0, 1] as [number, number] };
  
  const times = nodes.map(node => node.time);
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  
  return {
    minTime,
    maxTime,
    range: [minTime, minTime] as [number, number]
  };
};

const shouldShowGeographicShapeWarning = (mode: GeographicMode, currentShape: GeographicShape | null): boolean => {
  return mode === 'eastern_hemisphere' && !currentShape;
};

const createFilterOptions = (
  filterState: any,
  metadata: any,
  maxSamples: number
) => {
  const options: any = { maxSamples };
  
  if (filterState.mode === 'genomic' && 
      (filterState.genomicRange[0] !== 0 || filterState.genomicRange[1] !== metadata.sequenceLength)) {
    options.genomicStart = filterState.genomicRange[0];
    options.genomicEnd = filterState.genomicRange[1];
  } else if (filterState.mode === 'tree' && 
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
      const descendants = getDescendants(selectedNode, data.edges);
      descendants.add(selectedNode.id);
      return getFilteredNodesAndEdges(descendants);
    }
    case 'ancestors': {
      const ancestors = getAncestors(selectedNode, data.edges);
      ancestors.add(selectedNode.id);
      return getFilteredNodesAndEdges(ancestors);
    }
    default:
      return data;
  }
};

const applyTemporalFiltering = (data: GraphData, temporalState: any): GraphData => {
  if (!temporalState.isActive || temporalState.mode !== 'hide') return data;
  
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

const calculateArgStats = (
  subArgData: GraphData | null,
  data: GraphData | null,
  filteredData: GraphData | null,
  treeSequence: any
): ArgStatsData | null => {
  if (!subArgData || !data || !filteredData || !treeSequence) return null;

  return {
    originalNodes: data.metadata.original_num_nodes || treeSequence.num_nodes,
    originalEdges: data.metadata.original_num_edges || treeSequence.num_edges,
    subArgNodes: subArgData.nodes.length,
    subArgEdges: subArgData.edges.length,
    displayedNodes: filteredData.nodes.length,
    displayedEdges: filteredData.edges.length
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
  onViewStateChange?: (viewState: any) => void;
  viewState?: any;
}> = ({ 
  data, 
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
  onViewStateChange, 
  viewState 
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
        onViewStateChange={onViewStateChange}
        externalViewState={viewState}
        temporalSpacingMode={temporalSpacingMode}
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
  treeEndIdx
}) => {
  const { colors } = useColorTheme();
  const { treeSequence } = useTreeSequence();
  
  const [data, setData] = useState<GraphData | null>(null);
  const [subArgData, setSubArgData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [viewMode, setViewMode] = useState<ViewMode>('full');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  
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
  const [isFilterSectionCollapsed, setIsFilterSectionCollapsed] = useState(true);
  
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
    currentProgress: 0 // 0 to 1, tracks how far through the animation we are
  });

  const loadGeographicData = useCallback(async () => {
    try {
      setGeoState(prev => ({ ...prev, isLoading: true }));
      
      if (geoState.mode === 'unit_grid') {
        const { createUnitGridShape } = await import('./GeographicUtils');
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
          const { createUnitGridShape } = await import('./GeographicUtils');
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
        const options: any = { maxSamples: max_samples };
        
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
        }
      } catch (err) {
        console.error('Error fetching 3D graph data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [filename, max_samples, temporalStart, temporalEnd, genomicStart, genomicEnd, treeStartIdx, treeEndIdx]);

  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (!filterState.isActive || loading) return;

    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    loadingTimeoutRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        
        const options = createFilterOptions(filterState, metadata, max_samples);
        
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
  }, [filterState, filename, max_samples, metadata.sequenceLength, metadata.treeIntervals.length, temporalStart, temporalEnd, genomicStart, genomicEnd, treeStartIdx, treeEndIdx]);

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
    
    // Calculate animation duration based on rate (layers per second)
    const totalDuration = numLayers / layerReveal.rate; // seconds
    const startTime = Date.now() - (layerReveal.currentProgress * totalDuration * 1000);

    let animationFrameId: number;

    const reveal = () => {
      const elapsedTime = (Date.now() - startTime) / 1000; // seconds
      const newProgress = Math.min(elapsedTime / totalDuration, 1);
      
      // Calculate which layer we should be showing up to
      const currentLayerIndex = Math.floor(newProgress * numLayers);
      const maxTimeToShow = uniqueTimes[Math.min(currentLayerIndex, numLayers - 1)];
      
      // Update temporal range to reveal up to this layer
      const minTime = uniqueTimes[0];
      
      // Update temporal state
      setTemporalState(prev => ({
        ...prev,
        range: [minTime, maxTimeToShow]
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
  }, [layerReveal.isPlaying, layerReveal.rate, layerReveal.currentProgress, data, temporalState.isActive]);

  const getFilteredData = (): GraphData | null => {
    if (!data) return data;

    const temporalFilteredData = applyTemporalFiltering(data, temporalState);
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
      const centerTarget: [number, number, number] = [
        (bounds.minX + bounds.maxX) / 2,
        (bounds.minY + bounds.maxY) / 2,
        (bounds.minZ + bounds.maxZ) / 2
      ];
      
      setViewState(prev => ({
        ...prev,
        target: centerTarget
      }));
    }
  };

  if (loading) {
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
  const stats = calculateArgStats(subArgData, data, filteredData, treeSequence);

  return (
    <div 
      className="w-full h-full flex flex-col overflow-hidden"
      style={{ backgroundColor: colors.background }}
    >
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
                {getViewTitle(viewMode, selectedNode, filterState, data)}
              </h2>
              
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
              
              {viewMode !== 'full' && (
                <button
                  onClick={handleReturnToFull}
                  className="font-medium px-3 py-1 rounded text-sm transition-colors border"
                  style={{
                    backgroundColor: colors.containerBackground,
                    color: colors.text,
                    borderColor: `${colors.accentPrimary}33`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `${colors.accentPrimary}66`;
                    e.currentTarget.style.backgroundColor = `${colors.containerBackground}CC`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = `${colors.accentPrimary}33`;
                    e.currentTarget.style.backgroundColor = colors.containerBackground;
                  }}
                >
                  Return to Full ARG
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Show/hide controls button when filters are active */}
            {(filterState.isActive || temporalState.isActive) && (
              <button
                onClick={() => setVisualSettings(prev => ({ ...prev, isFilterSectionCollapsed: !prev.isFilterSectionCollapsed }))}
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
                  {visualSettings.isFilterSectionCollapsed ? 'Show Sliders' : 'Hide Sliders'}
                </span>
                <svg 
                  className={`w-4 h-4 transition-transform ${visualSettings.isFilterSectionCollapsed ? 'rotate-180' : ''}`}
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
            
            <div 
              className="text-xs border-l pl-4"
              style={{ 
                color: colors.headerText,
                borderLeftColor: colors.border 
              }}
            >
              Left click: Subgraph • Right click: Ancestors
            </div>
          </div>
        </div>
      </div>
      
      {/* Filter Controls Section - only show when filters are active */}
      {(filterState.isActive || temporalState.isActive) && (
        <div 
          className="flex-shrink-0 border-b"
          style={{ 
            backgroundColor: colors.background,
            borderBottomColor: colors.border 
          }}
        >
          {!visualSettings.isFilterSectionCollapsed && (
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
                    
                    {/* Inline filter info */}
                    <div className="text-xs flex-shrink-0" style={{ color: colors.text }}>
                      {filterState.mode === 'genomic' ? (
                        <span>
                          {formatGenomicPosition(filterState.genomicRange[1] - filterState.genomicRange[0])} bp
                          ({calculatePercentage(filterState.genomicRange[1] - filterState.genomicRange[0], metadata.sequenceLength)}%)
                          {data?.metadata.num_local_trees !== undefined && (
                            <> • {data.metadata.num_local_trees} trees</>
                          )}
                        </span>
                      ) : filterState.mode === 'tree' && metadata.treeIntervals.length > 0 ? (
                        <span>
                          Trees {filterState.treeRange[0]}-{filterState.treeRange[1]} ({filterState.treeRange[1] - filterState.treeRange[0] + 1} of {metadata.treeIntervals.length})
                          {data?.metadata.num_local_trees !== undefined && (
                            <> • {data.metadata.expected_tree_count ?? data.metadata.num_local_trees} displayed</>
                          )}
                          {data?.metadata.tree_count_mismatch && (
                            <> ⚠️ (actual: {data.metadata.num_local_trees})</>
                          )}
                        </span>
                      ) : null}
                      {loading && (
                        <div 
                          className="inline-block ml-2 animate-spin rounded-full h-3 w-3 border border-t-transparent"
                          style={{ borderColor: colors.accentPrimary }}
                        ></div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {temporalState.isActive && (
                <div className="text-xs mt-3" style={{ color: colors.text }}>
                  <div className="flex items-center gap-2">
                    <span>
                      Temporal Range: {temporalState.range[0].toFixed(CONTAINER_CONSTANTS.TIME_PRECISION)} - {temporalState.range[1].toFixed(CONTAINER_CONSTANTS.TIME_PRECISION)}{' '}
                      ({calculatePercentage(temporalState.range[1] - temporalState.range[0], temporalState.maxTime - temporalState.minTime)}% of time range)
                      • Hold Shift + drag to maintain window size
                    </span>
                    {loading && (
                      <div 
                        className="animate-spin rounded-full h-3 w-3 border border-t-transparent"
                        style={{ borderColor: colors.accentPrimary }}
                      ></div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-hidden flex">
        {temporalState.isActive && !visualSettings.isFilterSectionCollapsed && (
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
          <Spatial3DWrapper
            data={filteredData}
            onNodeClick={handleNodeClick}
            onNodeRightClick={handleNodeRightClick}
            selectedNode={selectedNode}
            temporalRange={temporalState.isActive ? temporalState.range : null}
            showTemporalPlanes={temporalState.isActive && temporalState.mode === 'planes'}
            temporalFilterMode={temporalState.isActive ? temporalState.mode : null}
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
            onViewStateChange={handleViewStateChange}
            viewState={viewState}
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
                  geographicMode={geoState.mode}
                  onGeographicModeChange={(mode) => setGeoState(prev => ({ ...prev, mode }))}
                  customShapeFile={geoState.customShapeFile}
                  onCustomShapeFileChange={(file) => setGeoState(prev => ({ ...prev, customShapeFile: file }))}
                  geographicShapeOpacity={visualSettings.geographicShapeOpacity}
                  onGeographicShapeOpacityChange={(value) => setVisualSettings(prev => ({ ...prev, geographicShapeOpacity: value }))}
                  isLoadingGeographic={geoState.isLoading}
                  currentShape={geoState.currentShape}
                  temporalSpacing={visualSettings.temporalSpacing}
                  onTemporalSpacingChange={(value) => setVisualSettings(prev => ({ ...prev, temporalSpacing: value }))}
                  temporalSpacingMode={visualSettings.temporalSpacingMode}
                  onTemporalSpacingModeChange={(mode) => setVisualSettings(prev => ({ ...prev, temporalSpacingMode: mode }))}
                  temporalGridOpacity={visualSettings.temporalGridOpacity}
                  onTemporalGridOpacityChange={(value) => setVisualSettings(prev => ({ ...prev, temporalGridOpacity: value }))}
                  spatialSpacing={visualSettings.spatialSpacing}
                  onSpatialSpacingChange={(value) => setVisualSettings(prev => ({ ...prev, spatialSpacing: value }))}
                  showCrsWarning={geoState.showCrsWarning}
                  crsDetection={data?.metadata.coordinate_system_detection}
                  onDismissCrsWarning={() => setGeoState(prev => ({ ...prev, showCrsWarning: false }))}
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
                  bounds={calculateBounds(filteredData)}
                  onViewStateChange={handlePresetViewChange}
                  autoRotationEnabled={autoRotation.enabled}
                  autoRotationRate={autoRotation.rate}
                  onAutoRotationEnabledChange={(enabled) => setAutoRotation(prev => ({ ...prev, enabled }))}
                  onAutoRotationRateChange={(rate) => setAutoRotation(prev => ({ ...prev, rate }))}
                  layerRevealEnabled={layerReveal.enabled}
                  layerRevealPlaying={layerReveal.isPlaying}
                  layerRevealRate={layerReveal.rate}
                  onLayerRevealStart={() => {
                    if (data) {
                      const uniqueTimes = Array.from(new Set(data.nodes.map(node => node.time))).sort((a, b) => a - b);
                      const minTime = uniqueTimes[0];
                      setTemporalState(prev => ({ 
                        ...prev, 
                        isActive: true, 
                        mode: 'hide', 
                        range: [minTime, minTime] 
                      }));
                      setLayerReveal(prev => ({ ...prev, enabled: true, isPlaying: true, currentProgress: 0 }));
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
                  originalNodeCount={stats?.originalNodes}
                  originalEdgeCount={stats?.originalEdges}
                  subargNodeCount={stats?.subArgNodes}
                  subargEdgeCount={stats?.subArgEdges}
                  displayedNodeCount={stats?.displayedNodes}
                  displayedEdgeCount={stats?.displayedEdges}
                  crsDetection={data?.metadata.coordinate_system_detection ? {
                    crs: data.metadata.coordinate_system_detection.likely_crs,
                    confidence: data.metadata.coordinate_system_detection.confidence,
                    landPercentage: data.metadata.coordinate_system_detection.land_percentage,
                    description: data.metadata.coordinate_system_detection.reasoning
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

export default SpatialArg3DVisualizationContainer; 