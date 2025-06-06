import React, { useState, useEffect, useCallback, useRef } from 'react';
import SpatialArg3DVisualization from './SpatialArg3DVisualization';
import SpatialArg3DControlPanel from './SpatialArg3DControlPanel';
import { SpatialArg3DInfoPanel } from './SpatialArg3DInfoPanel';
import { GraphData, GraphNode, GraphEdge, TreeInterval, GeographicShape, CoordinateReferenceSystem } from '../ForceDirectedGraph/ForceDirectedGraph.types';
import { RangeSlider } from '../ui/range-slider';
import { TreeRangeSlider } from '../ui/tree-range-slider';
import { TemporalRangeSlider } from '../ui/temporal-range-slider';
import { ArgStatsData } from '../ui/arg-stats-display';
import { api } from '../../lib/api';
import { useColorTheme } from '../../context/ColorThemeContext';
import { useTreeSequence } from '../../context/TreeSequenceContext';
import { useDebounced } from '../../hooks/useDebounced';


// Define view modes for the graph
type ViewMode = 'full' | 'subgraph' | 'ancestors';
type FilterMode = 'genomic' | 'tree';
type TemporalFilterMode = 'hide' | 'planes';
type GeographicMode = 'unit_grid' | 'eastern_hemisphere' | 'custom';

interface SpatialArg3DVisualizationContainerProps {
  filename: string;
  max_samples: number;
}

// Wrapper component that handles dynamic sizing
const Spatial3DWrapper: React.FC<{
  data: GraphData | null;
  onNodeClick: (node: GraphNode) => void;
  onNodeRightClick: (node: GraphNode) => void;
  selectedNode: GraphNode | null;
  temporalRange?: [number, number] | null;
  showTemporalPlanes?: boolean;
  temporalFilterMode?: TemporalFilterMode | null;
  temporalSpacing?: number;
  spatialSpacing?: number;
  geographicShape?: GeographicShape | null;
  geographicMode?: GeographicMode;
  temporalGridOpacity?: number;
  geographicShapeOpacity?: number;
  maxNodeRadius?: number;
}> = ({ data, onNodeClick, onNodeRightClick, selectedNode, temporalRange, showTemporalPlanes, temporalFilterMode, temporalSpacing, spatialSpacing, geographicShape, geographicMode, temporalGridOpacity, geographicShapeOpacity, maxNodeRadius }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setDimensions({
          width: clientWidth || 800,
          height: clientHeight || 600
        });
      }
    };

    // Update on mount
    updateDimensions();

    // Update on resize
    window.addEventListener('resize', updateDimensions);
    
    // Use ResizeObserver if available for more precise container tracking
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
        maxNodeRadius={maxNodeRadius}
      />
    </div>
  );
};

// Helper function to get all descendants of a node
const getDescendants = (node: GraphNode, nodes: GraphNode[], edges: GraphEdge[]): Set<number> => {
  const descendants = new Set<number>();
  const visited = new Set<number>();
  const queue = [node.id];
  
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);
    
    // Find all edges where current node is the source (parent)
    edges.forEach(edge => {
      const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
      const targetId = typeof edge.target === 'number' ? edge.target : edge.target.id;
      
      if (sourceId === currentId && !visited.has(targetId)) {
        descendants.add(targetId);
        queue.push(targetId);
      }
    });
  }
  
  return descendants;
};

// Helper function to get all ancestors of a node
const getAncestors = (node: GraphNode, nodes: GraphNode[], edges: GraphEdge[]): Set<number> => {
  const ancestors = new Set<number>();
  const visited = new Set<number>();
  const queue = [node.id];
  
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);
    
    // Find all edges where current node is the target (child)
    edges.forEach(edge => {
      const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
      const targetId = typeof edge.target === 'number' ? edge.target : edge.target.id;
      
      if (targetId === currentId && !visited.has(sourceId)) {
        ancestors.add(sourceId);
        queue.push(sourceId);
      }
    });
  }
  
  return ancestors;
};

const SpatialArg3DVisualizationContainer: React.FC<SpatialArg3DVisualizationContainerProps> = ({
  filename,
  max_samples
}) => {
  const { colors } = useColorTheme();
  const { treeSequence } = useTreeSequence();
  const [data, setData] = useState<GraphData | null>(null);
  const [subArgData, setSubArgData] = useState<GraphData | null>(null); // Rename to clarify this is the SubARG
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('full');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [genomicRange, setGenomicRange] = useState<[number, number]>([0, 0]);
  const [sequenceLength, setSequenceLength] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Convert tree intervals from backend format
  const convertTreeIntervals = useCallback((backendIntervals: [number, number, number][]): TreeInterval[] => {
    return backendIntervals.map(([index, left, right]) => ({
      index,
      left,
      right
    }));
  }, []);

  // Additional tree filtering state
  const [filterMode, setFilterMode] = useState<FilterMode>('genomic');
  const [treeRange, setTreeRange] = useState<[number, number]>([0, 0]);
  const [treeIntervals, setTreeIntervals] = useState<TreeInterval[]>([]);
  const [isFilterActive, setIsFilterActive] = useState(false);

  // Temporal filtering state
  const [temporalRange, setTemporalRange] = useState<[number, number]>([0, 1]);
  const [minTime, setMinTime] = useState<number>(0);
  const [maxTime, setMaxTime] = useState<number>(1);
  const [isTemporalFilterActive, setIsTemporalFilterActive] = useState(false);

  // Debounced values using custom hook
  const { debouncedValue: debouncedGenomicRange, isUpdating: isUpdatingGenomicRange } = useDebounced(
    genomicRange, 
    500, 
    isFilterActive && filterMode === 'genomic'
  );
  const { debouncedValue: debouncedTreeRange } = useDebounced(
    treeRange, 
    500, 
    isFilterActive && filterMode === 'tree'
  );
  const { debouncedValue: debouncedTemporalRange, isUpdating: isUpdatingTemporalRange } = useDebounced(
    temporalRange, 
    500, 
    isTemporalFilterActive
  );
  const [temporalFilterMode, setTemporalFilterMode] = useState<TemporalFilterMode>('planes');
  const [temporalSpacing, setTemporalSpacing] = useState<number>(12); // Default spacing between time slices
  const [spatialSpacing, setSpatialSpacing] = useState<number>(160); // Default scaling for X/Y spatial coordinates
  const [temporalGridOpacity, setTemporalGridOpacity] = useState<number>(30); // Default opacity for temporal grid lines (0-100)
  const [geographicShapeOpacity, setGeographicShapeOpacity] = useState<number>(70); // Default opacity for geographic shape/shapefile (0-100)
  const [maxNodeRadius, setMaxNodeRadius] = useState<number>(25); // Default maximum node radius in pixels
  const [isFilterSectionCollapsed, setIsFilterSectionCollapsed] = useState<boolean>(false); // Collapse state for filter section
  
  // Auto-expand/collapse filter section based on filter states
  useEffect(() => {
    if (isFilterActive || isTemporalFilterActive) {
      setIsFilterSectionCollapsed(false); // Auto-expand when filters are active
    } else {
      setIsFilterSectionCollapsed(true); // Auto-collapse when no filters are active
    }
  }, [isFilterActive, isTemporalFilterActive]);

  // Geographic mode state
  const [geographicMode, setGeographicMode] = useState<GeographicMode>('unit_grid');

  const [currentShape, setCurrentShape] = useState<GeographicShape | null>(null);
  const [customShapeFile, setCustomShapeFile] = useState<File | null>(null);
  const [isLoadingGeographic, setIsLoadingGeographic] = useState(false);
  const [showCrsWarning, setShowCrsWarning] = useState(false);
  
  // Track if geographic mode has been manually set by user
  const [isGeographicModeManuallySet, setIsGeographicModeManuallySet] = useState(false);



  // Load geographic data on component mount
  useEffect(() => {
    const loadGeographicData = async () => {
      try {
        setIsLoadingGeographic(true);
        
        // Load available shapes (CRS data removed as unused)
        await api.getAvailableShapes();
        
        // Load default shape (unit grid)
        const defaultShapeResponse = await api.getShapeData('unit_grid');
        setCurrentShape(defaultShapeResponse.data as GeographicShape);
        
      } catch (error) {
        console.error('Error loading geographic data:', error);
      } finally {
        setIsLoadingGeographic(false);
      }
    };
    
    loadGeographicData();
  }, []);

  // Handle geographic mode changes
  useEffect(() => {
    const loadShapeForMode = async () => {
      if (geographicMode === 'custom' && !customShapeFile) {
        return;
      }
      
      try {
        setIsLoadingGeographic(true);
        
        // Check if current mode is appropriate for detected CRS
        if (data?.metadata.coordinate_system_detection) {
          const detectedCrs = data.metadata.coordinate_system_detection.likely_crs;
          const suggestedMode = data.metadata.suggested_geographic_mode;
          
          if (suggestedMode && suggestedMode !== geographicMode && 
              data.metadata.coordinate_system_detection.confidence > 0.7) {
            setShowCrsWarning(true);
          } else {
            setShowCrsWarning(false);
          }
        }
        
        if (geographicMode === 'custom' && customShapeFile) {
          // Upload and process custom shapefile
          const response = await api.uploadShapefile(customShapeFile);
          console.log('Custom shapefile uploaded:', response.data);
        } else if (geographicMode === 'unit_grid') {
          // Create unit grid shape locally
          const { createUnitGridShape } = await import('./GeographicUtils');
          const gridShape = createUnitGridShape(10);
          setCurrentShape(gridShape);
        } else {
          try {
            // Try to load built-in shape from API
            const response = await api.getShapeData(geographicMode);
            setCurrentShape(response.data as GeographicShape);
          } catch (error) {
            console.warn(`Failed to load ${geographicMode} from API, creating fallback`);
            
            // Fallback: create default shape
            const { createUnitGridShape } = await import('./GeographicUtils');
            const gridShape = createUnitGridShape(10);
            setCurrentShape(gridShape);
          }
        }
      } catch (error) {
        console.error('Error loading shape for mode:', geographicMode, error);
      } finally {
        setIsLoadingGeographic(false);
      }
    };
    
    loadShapeForMode();
  }, [geographicMode, customShapeFile, data?.metadata]);

  // Initial data loading (without genomic filtering)
  useEffect(() => {
    const fetchInitialData = async () => {
      
      try {
        setLoading(true);
        console.log('Fetching initial 3D graph data for file:', filename, 'with max_samples:', max_samples);
        
        const response = await api.getGraphData(filename, { maxSamples: max_samples });
        const graphData = response.data as GraphData;
        console.log('Received initial 3D graph data:', graphData);
        
        // Initialize genomic range settings
        if (graphData.metadata.sequence_length) {
          setSequenceLength(graphData.metadata.sequence_length);
          const fullRange: [number, number] = [0, graphData.metadata.sequence_length];
          setGenomicRange(fullRange);
        }
        
        // Initialize tree intervals and range settings
        if (graphData.metadata.tree_intervals && graphData.metadata.tree_intervals.length > 0) {
          const intervals = convertTreeIntervals(graphData.metadata.tree_intervals as unknown as [number, number, number][]);
          setTreeIntervals(intervals);
          const treeFullRange: [number, number] = [0, intervals.length - 1];
          setTreeRange(treeFullRange);
        }

        // Initialize temporal range settings
        if (graphData.nodes && graphData.nodes.length > 0) {
          const times = graphData.nodes.map(node => node.time);
          const minNodeTime = Math.min(...times);
          const maxNodeTime = Math.max(...times);
          setMinTime(minNodeTime);
          setMaxTime(maxNodeTime);
          // Default to showing only the oldest time slice (minimum time)
          const oldestSliceRange: [number, number] = [minNodeTime, minNodeTime];
          setTemporalRange(oldestSliceRange);
        }

        setIsInitialized(true);
        
        // Validate that we have spatial data
        const nodesWithSpatial = graphData.nodes.filter((node: GraphNode) => 
          node.location?.x !== undefined && node.location?.y !== undefined
        );
        
        if (nodesWithSpatial.length === 0) {
          setError('No spatial data found in this ARG. This visualization requires nodes with 2D spatial coordinates.');
        } else {
          setData(graphData);
          setSubArgData(graphData); // Store SubARG data (what was loaded with max_samples)
          
          // Set default geographic mode based on CRS detection - but only if user hasn't manually set it
          if (graphData.metadata.suggested_geographic_mode && !isGeographicModeManuallySet) {
            const suggestedMode = graphData.metadata.suggested_geographic_mode as GeographicMode;
            console.log(`CRS detection suggests: ${suggestedMode}, current mode: ${geographicMode}, manually set: ${isGeographicModeManuallySet}`);
            if (suggestedMode !== geographicMode) {
              setGeographicMode(suggestedMode);
              console.log(`Setting geographic mode to: ${suggestedMode} based on CRS detection`);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching 3D graph data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    // Reset initialization state when filename or max_samples change
    setIsInitialized(false);
    setIsFilterActive(false);
    fetchInitialData();
  }, [filename, max_samples, convertTreeIntervals]);

  // Data loading with filtering - with duplicate call prevention
  const lastApiCallRef = useRef<string>('');
  
  useEffect(() => {
    // Skip if not initialized or if this is the initial load
    if (!isInitialized) {
      return;
    }

    // Determine if we need to make an API call
    let needsApiCall = false;
    let genomicParams = null;
    let treeParams = null;

    if (isFilterActive) {
      if (filterMode === 'genomic') {
        // Check if genomic range covers the full sequence
        const isFullSequence = debouncedGenomicRange[0] === 0 && debouncedGenomicRange[1] === sequenceLength;
        if (!isFullSequence) {
          needsApiCall = true;
          genomicParams = {
            genomic_start: debouncedGenomicRange[0],
            genomic_end: debouncedGenomicRange[1]
          };
        }
      } else if (filterMode === 'tree') {
        // Check if tree range covers all trees
        const isFullTreeRange = debouncedTreeRange[0] === 0 && debouncedTreeRange[1] === treeIntervals.length - 1;
        if (!isFullTreeRange && treeIntervals.length > 0) {
          needsApiCall = true;
          treeParams = {
            tree_start_idx: debouncedTreeRange[0],
            tree_end_idx: debouncedTreeRange[1]
          };
        }
      }
    }

    // Create a unique key for this API call to prevent duplicates
    const apiCallKey = `${filename}-${max_samples}-${JSON.stringify(genomicParams)}-${JSON.stringify(treeParams)}-${isFilterActive}-${filterMode}`;
    
    // If no filtering needed and we already have data, don't make unnecessary API calls
    if (!needsApiCall) {
      console.log('Skipping API call - using existing data (full range or filter disabled)');
      return;
    }
    
    // Prevent duplicate API calls with the same parameters
    if (apiCallKey === lastApiCallRef.current) {
      console.log('Skipping duplicate API call with key:', apiCallKey);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        lastApiCallRef.current = apiCallKey; // Mark this call as in progress
        
        let options: any = { maxSamples: max_samples };
        
        if (genomicParams) {
          console.log('Fetching filtered 3D graph data for genomic range:', debouncedGenomicRange);
          options.genomicStart = genomicParams.genomic_start;
          options.genomicEnd = genomicParams.genomic_end;
        } else if (treeParams) {
          console.log('Fetching filtered 3D graph data for tree range:', debouncedTreeRange);
          options.treeStartIdx = treeParams.tree_start_idx;
          options.treeEndIdx = treeParams.tree_end_idx;
        } else {
          console.log('Fetching unfiltered 3D graph data');
        }
        
        const response = await api.getGraphData(filename, options);
        const graphData = response.data as GraphData;
        console.log('Received 3D graph data:', graphData);
        
        // Validate spatial data again
        const nodesWithSpatial = graphData.nodes.filter((node: GraphNode) => 
          node.location?.x !== undefined && node.location?.y !== undefined
        );
        
        if (nodesWithSpatial.length === 0) {
          setError('No spatial data found in this range.');
        } else {
          setData(graphData);
          setError(null);
        }
      } catch (e) {
        console.error('Error fetching 3D graph data:', e);
        setError(e instanceof Error ? e.message : 'An error occurred while fetching graph data');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filename, max_samples, debouncedGenomicRange, debouncedTreeRange, isFilterActive, filterMode, isInitialized, sequenceLength, treeIntervals]);

  // Filter data based on current view mode
  const getFilteredData = (): GraphData | null => {
    if (!data) return data;

    let filteredData = data;

    // Apply temporal filtering first if active and in "hide" mode
    if (isTemporalFilterActive && temporalFilterMode === 'hide') {
      const [minTimeFilter, maxTimeFilter] = debouncedTemporalRange;
      const isFullTimeRange = minTimeFilter === minTime && maxTimeFilter === maxTime;
      
      if (!isFullTimeRange) {
        const filteredNodes = data.nodes.filter(node => 
          node.time >= minTimeFilter && node.time <= maxTimeFilter
        );
        const nodeIds = new Set(filteredNodes.map(node => node.id));
        const filteredEdges = data.edges.filter(edge => {
          const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
          const targetId = typeof edge.target === 'number' ? edge.target : edge.target.id;
          return nodeIds.has(sourceId) && nodeIds.has(targetId);
        });

        filteredData = {
          ...data,
          nodes: filteredNodes,
          edges: filteredEdges,
          metadata: {
            ...data.metadata,
            is_subset: true
          }
        };
      }
    }

    if (!selectedNode) return filteredData;

    switch (viewMode) {
      case 'subgraph': {
        const descendants = getDescendants(selectedNode, filteredData.nodes, filteredData.edges);
        descendants.add(selectedNode.id);
        
        const viewFilteredNodes = filteredData.nodes.filter(node => descendants.has(node.id));
        const viewFilteredEdges = filteredData.edges.filter(edge => {
          const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
          const targetId = typeof edge.target === 'number' ? edge.target : edge.target.id;
          return descendants.has(sourceId) && descendants.has(targetId);
        });

        return {
          ...filteredData,
          nodes: viewFilteredNodes,
          edges: viewFilteredEdges,
          metadata: {
            ...filteredData.metadata,
            is_subset: true
          }
        };
      }
      case 'ancestors': {
        const ancestors = getAncestors(selectedNode, filteredData.nodes, filteredData.edges);
        ancestors.add(selectedNode.id);
        
        const viewFilteredNodes = filteredData.nodes.filter(node => ancestors.has(node.id));
        const viewFilteredEdges = filteredData.edges.filter(edge => {
          const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
          const targetId = typeof edge.target === 'number' ? edge.target : edge.target.id;
          return ancestors.has(sourceId) && ancestors.has(targetId);
        });

        return {
          ...filteredData,
          nodes: viewFilteredNodes,
          edges: viewFilteredEdges,
          metadata: {
            ...filteredData.metadata,
            is_subset: true
          }
        };
      }
      default:
        return filteredData;
    }
  };

  // Calculate ARG statistics for display
  const calculateArgStats = (): ArgStatsData | null => {
    if (!subArgData || !data || !treeSequence) return null;

    const filteredData = getFilteredData();
    if (!filteredData) return null;

    // Calculate SubARG stats (based on view mode filtering)
    let subArgViewData = data;
    if (selectedNode) {
      switch (viewMode) {
        case 'subgraph': {
          const descendants = getDescendants(selectedNode, data.nodes, data.edges);
          descendants.add(selectedNode.id);
          
          const subArgNodes = data.nodes.filter(node => descendants.has(node.id));
          const subArgEdges = data.edges.filter(edge => {
            const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
            const targetId = typeof edge.target === 'number' ? edge.target : edge.target.id;
            return descendants.has(sourceId) && descendants.has(targetId);
          });

          subArgViewData = {
            ...data,
            nodes: subArgNodes,
            edges: subArgEdges
          };
          break;
        }
        case 'ancestors': {
          const ancestors = getAncestors(selectedNode, data.nodes, data.edges);
          ancestors.add(selectedNode.id);
          
          const subArgNodes = data.nodes.filter(node => ancestors.has(node.id));
          const subArgEdges = data.edges.filter(edge => {
            const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
            const targetId = typeof edge.target === 'number' ? edge.target : edge.target.id;
            return ancestors.has(sourceId) && ancestors.has(targetId);
          });

          subArgViewData = {
            ...data,
            nodes: subArgNodes,
            edges: subArgEdges
          };
          break;
        }
      }
    }

    return {
      originalNodes: data.metadata.original_num_nodes || treeSequence.num_nodes,
      originalEdges: data.metadata.original_num_edges || treeSequence.num_edges,
      subArgNodes: subArgData.nodes.length,
      subArgEdges: subArgData.edges.length,
      displayedNodes: filteredData.nodes.length,
      displayedEdges: filteredData.edges.length
    };
  };

  // Handle left click - show subgraph
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

  // Handle right click - show ancestors
  const handleNodeRightClick = (node: GraphNode) => {
    setSelectedNode(node);
    setViewMode('ancestors');
  };

  const handleReturnToFull = () => {
    setViewMode('full');
    setSelectedNode(null);
  };

  // Handle geographic mode changes from control panel
  const handleGeographicModeChange = (mode: GeographicMode) => {
    setGeographicMode(mode);
    setIsGeographicModeManuallySet(true); // Mark as manually set
    setCurrentShape(null); // Reset shape when mode changes
  };

  // Genomic range control handlers
  const handleGenomicRangeChange = useCallback((newRange: [number, number]) => {
    // Only update if the range actually changed to avoid unnecessary rerenders
    if (newRange[0] !== genomicRange[0] || newRange[1] !== genomicRange[1]) {
      setGenomicRange(newRange);
    }
  }, [genomicRange]);

  const handleTreeRangeChange = useCallback((newRange: [number, number]) => {
    // Only update if the range actually changed to avoid unnecessary rerenders
    if (newRange[0] !== treeRange[0] || newRange[1] !== treeRange[1]) {
      setTreeRange(newRange);
    }
  }, [treeRange]);

  const handleTemporalRangeChange = useCallback((newRange: [number, number]) => {
    // Only update if the range actually changed to avoid unnecessary rerenders
    if (newRange[0] !== temporalRange[0] || newRange[1] !== temporalRange[1]) {
      setTemporalRange(newRange);
    }
  }, [temporalRange]);

  const handleToggleFilter = useCallback(() => {
    const newFilterState = !isFilterActive;
    setIsFilterActive(newFilterState);
    
    if (newFilterState) {
      if (filterMode === 'genomic') {
        // Activating genomic filter - ensure range is set to full sequence initially
        setGenomicRange([0, sequenceLength]);
      } else if (filterMode === 'tree' && treeIntervals.length > 0) {
        // Activating tree filter - ensure range is set to full tree range initially
        const fullTreeRange: [number, number] = [0, treeIntervals.length - 1];
        setTreeRange(fullTreeRange);
      }
    } else {
      // Deactivating filter - reload initial data without filtering
      // The data will be reloaded by the initial data useEffect due to state change
    }
  }, [isFilterActive, filterMode, sequenceLength, treeIntervals]);

  const handleFilterModeChange = useCallback((newMode: FilterMode) => {
    setFilterMode(newMode);
    
    // Initialize the appropriate range when switching modes
    if (newMode === 'genomic') {
      setGenomicRange([0, sequenceLength]);
    } else if (newMode === 'tree' && treeIntervals.length > 0) {
      const fullTreeRange: [number, number] = [0, treeIntervals.length - 1];
      setTreeRange(fullTreeRange);
    }
  }, [sequenceLength, treeIntervals]);

  const formatGenomicPosition = useCallback((value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  }, []);

  const getViewTitle = (): string => {
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
    
    if (isFilterActive && data?.metadata.genomic_start !== undefined && data?.metadata.genomic_end !== undefined) {
      title += ` (${formatGenomicPosition(data.metadata.genomic_start)} - ${formatGenomicPosition(data.metadata.genomic_end)})`;
    }
    
    return title;
  };

  if (loading) {
    return (
      <div 
        className="w-full h-full flex items-center justify-center border rounded"
        style={{ 
          backgroundColor: colors.background,
          color: colors.text,
          borderColor: colors.border 
        }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: colors.textSecondary }}></div>
          <p>Loading 3D spatial ARG visualization...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="w-full h-full flex items-center justify-center border rounded"
        style={{ 
          backgroundColor: colors.background,
          color: colors.text,
          borderColor: colors.border 
        }}
      >
        <div className="text-center" style={{ color: colors.text }}>
          <p className="text-lg mb-2">Error loading visualization</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="w-full h-full flex flex-col overflow-hidden"
      style={{ backgroundColor: colors.background }}
    >
      {/* Compact top bar with title, legend, and controls */}
      <div 
        className="flex-shrink-0 border-b px-4 py-2"
        style={{ 
          backgroundColor: colors.background,
          borderBottomColor: colors.border 
        }}
      >
        <div className="flex items-center justify-between">
          {/* Left: Title, stats, and return button */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold" style={{ color: colors.text }}>{getViewTitle()}</h2>
              {viewMode !== 'full' && (
                <button
                  onClick={handleReturnToFull}
                  className="font-medium px-3 py-1 rounded text-sm transition-colors"
                  style={{
                    backgroundColor: colors.containerBackground,
                    color: colors.text,
                    border: `1px solid ${colors.border}`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.border;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.containerBackground;
                  }}
                >
                  Return to Full ARG
                </button>
              )}
            </div>

          </div>
          
          {/* Right: Compact legend and instructions */}
          <div className="flex items-center gap-6">
            {/* Legend */}
            <div className="flex items-center gap-4 text-xs" style={{ color: colors.text }}>
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
            
            {/* Instructions */}
            <div 
              className="text-xs border-l pl-4"
              style={{ 
                color: colors.text,
                borderLeftColor: colors.border 
              }}
            >
              Left click: Subgraph • Right click: Ancestors
            </div>
          </div>
        </div>
      </div>
      
      {/* Filter Controls */}
      {(sequenceLength > 0 || treeIntervals.length > 0) && (
        <div 
          className="flex-shrink-0 border-b"
          style={{ 
            backgroundColor: colors.background,
            borderBottomColor: colors.border 
          }}
        >
          {/* Filter Header - Always Visible */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Filter toggles - compact layout */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: colors.text }}>
                    <input
                      type="checkbox"
                      checked={isFilterActive}
                      onChange={handleToggleFilter}
                      className="w-4 h-4 text-sp-pale-green bg-sp-dark-blue border-sp-very-dark-blue rounded focus:ring-sp-pale-green focus:ring-2"
                    />
                    Filter Genomic Range
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: colors.text }}>
                    <input
                      type="checkbox"
                      checked={isTemporalFilterActive}
                      onChange={() => setIsTemporalFilterActive(!isTemporalFilterActive)}
                      className="w-4 h-4 text-sp-pale-green bg-sp-dark-blue border-sp-very-dark-blue rounded focus:ring-sp-pale-green focus:ring-2"
                    />
                    Filter Temporal Range
                  </label>
                </div>
              </div>

              {/* Collapse/Expand button - only show when filters are active */}
              {(isFilterActive || isTemporalFilterActive) && (
                <button
                  onClick={() => setIsFilterSectionCollapsed(!isFilterSectionCollapsed)}
                  className="flex items-center gap-2 px-3 py-1 rounded text-sm font-medium transition-colors hover:bg-opacity-80"
                  style={{
                    backgroundColor: colors.textSecondary,
                    color: colors.background
                  }}
                >
                  <span>
                    {isFilterSectionCollapsed ? 'Show Controls' : 'Hide Controls'}
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
            </div>
          </div>

          {/* Expandable Filter Details */}
          {(isFilterActive || isTemporalFilterActive) && !isFilterSectionCollapsed && (
            <div className="px-4 pb-3 space-y-3" style={{ backgroundColor: colors.background }}>
              {/* Controls and Slider Section */}
              <div className="flex items-start gap-4">
                {/* Left side: Filter mode controls */}
                <div className="flex flex-col gap-3 flex-shrink-0">
                  {isFilterActive && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm" style={{ color: colors.text }}>Genomic Mode:</span>
                      <div className="flex rounded overflow-hidden" style={{ backgroundColor: colors.background }}>
                        <button
                          onClick={() => handleFilterModeChange('genomic')}
                          className="px-3 py-1 text-xs font-medium transition-colors"
                          style={{
                            backgroundColor: filterMode === 'genomic' ? colors.textSecondary : colors.background,
                            color: filterMode === 'genomic' ? colors.background : colors.text
                          }}
                        >
                          Genomic
                        </button>
                        {treeIntervals.length > 0 && (
                          <button
                            onClick={() => handleFilterModeChange('tree')}
                            className="px-3 py-1 text-xs font-medium transition-colors"
                            style={{
                              backgroundColor: filterMode === 'tree' ? colors.textSecondary : colors.background,
                              color: filterMode === 'tree' ? colors.background : colors.text
                            }}
                          >
                            Tree Index
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {isTemporalFilterActive && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm" style={{ color: colors.text }}>Temporal Mode:</span>
                      <div className="flex rounded overflow-hidden" style={{ backgroundColor: colors.background }}>
                        <button
                          onClick={() => setTemporalFilterMode('hide')}
                          className="px-3 py-1 text-xs font-medium transition-colors"
                          style={{
                            backgroundColor: temporalFilterMode === 'hide' ? colors.textSecondary : colors.background,
                            color: temporalFilterMode === 'hide' ? colors.background : colors.text
                          }}
                        >
                          Hide Others
                        </button>
                        <button
                          onClick={() => setTemporalFilterMode('planes')}
                          className="px-3 py-1 text-xs font-medium transition-colors"
                          style={{
                            backgroundColor: temporalFilterMode === 'planes' ? colors.textSecondary : colors.background,
                            color: temporalFilterMode === 'planes' ? colors.background : colors.text
                          }}
                        >
                          Dim Others
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right side: Genomic range slider */}
                {isFilterActive && (
                  <div className="flex-1 max-w-md">
                    {filterMode === 'genomic' && sequenceLength > 0 ? (
                      <RangeSlider
                        min={0}
                        max={sequenceLength}
                        step={Math.max(1, Math.floor(sequenceLength / 1000))}
                        value={genomicRange}
                        onChange={handleGenomicRangeChange}
                        formatValue={formatGenomicPosition}
                        className="w-full"
                      />
                    ) : filterMode === 'tree' && treeIntervals.length > 0 ? (
                      <TreeRangeSlider
                        treeIntervals={treeIntervals}
                        value={treeRange}
                        onChange={handleTreeRangeChange}
                        className="w-full"
                      />
                    ) : null}
                  </div>
                )}
              </div>
              
              {/* Current range display */}
              <div className="text-xs flex flex-col gap-1" style={{ color: colors.text }}>
                {isFilterActive && (
                  <div className="flex items-center gap-2">
                    {filterMode === 'genomic' ? (
                      <span>
                        Genomic Range: {formatGenomicPosition(genomicRange[1] - genomicRange[0])} bp
                        ({((genomicRange[1] - genomicRange[0]) / sequenceLength * 100).toFixed(1)}% of sequence)
                        {data?.metadata.num_local_trees !== undefined && (
                          <> • {data.metadata.num_local_trees} local trees</>
                        )}
                      </span>
                    ) : filterMode === 'tree' && treeIntervals.length > 0 ? (
                      <span>
                        Trees {treeRange[0]}-{treeRange[1]} ({treeRange[1] - treeRange[0] + 1} of {treeIntervals.length} trees)
                        {data?.metadata.num_local_trees !== undefined && (
                          <> • {data.metadata.expected_tree_count ?? data.metadata.num_local_trees} displayed</>
                        )}
                        {data?.metadata.tree_count_mismatch && (
                          <> ⚠️ (actual: {data.metadata.num_local_trees})</>
                        )}
                      </span>
                    ) : null}
                    {(filterMode === 'genomic' && isUpdatingGenomicRange) && (
                      <div className="animate-spin rounded-full h-3 w-3 border border-t-transparent" style={{ borderColor: colors.textSecondary }}></div>
                    )}
                  </div>
                )}
                
                {isTemporalFilterActive && (
                  <div className="flex items-center gap-2">
                    <span>
                      Temporal Range: {temporalRange[0].toFixed(3)} - {temporalRange[1].toFixed(3)}{' '}
                      ({((temporalRange[1] - temporalRange[0]) / (maxTime - minTime) * 100).toFixed(1)}% of time range)
                      • Hold Shift + drag to maintain window size
                    </span>
                    {isUpdatingTemporalRange && (
                      <div className="animate-spin rounded-full h-3 w-3 border border-t-transparent" style={{ borderColor: colors.textSecondary }}></div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      




      {/* 3D Visualization area - takes remaining space */}
      <div className="flex-1 overflow-hidden flex">
        {/* Temporal slider - only shown when temporal filtering is active and filter section is not collapsed */}
        {isTemporalFilterActive && !isFilterSectionCollapsed && (
          <div 
            className="flex-shrink-0 border-r px-3 py-4 flex items-center justify-center"
            style={{ 
              backgroundColor: colors.background,
              borderRightColor: colors.border 
            }}
          >
            <TemporalRangeSlider
              min={minTime}
              max={maxTime}
              step={(maxTime - minTime) / 1000}
              value={temporalRange}
              onChange={handleTemporalRangeChange}
              formatValue={(v) => v.toFixed(3)}
              height={350}
            />
          </div>
        )}
        
        {/* Main 3D visualization */}
        <div className="flex-1 overflow-hidden relative">
          <Spatial3DWrapper
            data={getFilteredData()}
            onNodeClick={handleNodeClick}
            onNodeRightClick={handleNodeRightClick}
            selectedNode={selectedNode}
            temporalRange={isTemporalFilterActive ? temporalRange : null}
            showTemporalPlanes={isTemporalFilterActive && temporalFilterMode === 'planes'}
            temporalFilterMode={isTemporalFilterActive ? temporalFilterMode : null}
            temporalSpacing={temporalSpacing}
            spatialSpacing={spatialSpacing}
            geographicShape={currentShape}
            geographicMode={geographicMode}
            temporalGridOpacity={temporalGridOpacity}
            geographicShapeOpacity={geographicShapeOpacity}
            maxNodeRadius={maxNodeRadius}
          />
          
          {/* 3D Visualization Control Panel */}
          <SpatialArg3DControlPanel
            temporalSpacing={temporalSpacing}
            onTemporalSpacingChange={setTemporalSpacing}
            spatialSpacing={spatialSpacing}
            onSpatialSpacingChange={setSpatialSpacing}
            temporalGridOpacity={temporalGridOpacity}
            onTemporalGridOpacityChange={setTemporalGridOpacity}
            geographicShapeOpacity={geographicShapeOpacity}
            onGeographicShapeOpacityChange={setGeographicShapeOpacity}
            maxNodeRadius={maxNodeRadius}
            onMaxNodeRadiusChange={setMaxNodeRadius}
            geographicMode={geographicMode}
            onGeographicModeChange={handleGeographicModeChange}
            customShapeFile={customShapeFile}
            onCustomShapeFileChange={setCustomShapeFile}
            isLoadingGeographic={isLoadingGeographic}
            currentShape={currentShape}
            showCrsWarning={showCrsWarning}
            crsDetection={data?.metadata.coordinate_system_detection}
            onDismissCrsWarning={() => setShowCrsWarning(false)}
          />
          
          {/* ARG Information Panel */}
          {(() => {
            const stats = calculateArgStats();
            const crsData = data?.metadata.coordinate_system_detection;
            
            return (
              <SpatialArg3DInfoPanel
                originalNodeCount={stats?.originalNodes}
                originalEdgeCount={stats?.originalEdges}
                subargNodeCount={stats?.subArgNodes}
                subargEdgeCount={stats?.subArgEdges}
                displayedNodeCount={stats?.displayedNodes}
                displayedEdgeCount={stats?.displayedEdges}
                crsDetection={crsData ? {
                  crs: crsData.likely_crs,
                  confidence: crsData.confidence,
                  landPercentage: crsData.land_percentage,
                  description: crsData.reasoning
                } : undefined}
                isTemporalSliderVisible={isTemporalFilterActive}
              />
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default SpatialArg3DVisualizationContainer; 