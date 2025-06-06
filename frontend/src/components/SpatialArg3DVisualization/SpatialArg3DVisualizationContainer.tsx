import React, { useState, useEffect, useCallback, useRef } from 'react';
import SpatialArg3DVisualization from './SpatialArg3DVisualization';
import SpatialArg3DControlPanel from './SpatialArg3DControlPanel';
import { SpatialArg3DInfoPanel } from './SpatialArg3DInfoPanel';
import { GraphData, GraphNode, GraphEdge, TreeInterval, GeographicShape } from '../ForceDirectedGraph/ForceDirectedGraph.types';
import { RangeSlider } from '../ui/range-slider';
import { TreeRangeSlider } from '../ui/tree-range-slider';
import { TemporalRangeSlider } from '../ui/temporal-range-slider';
import { ArgStatsData } from '../ui/arg-stats-display';
import { api } from '../../lib/api';
import { useColorTheme } from '../../context/ColorThemeContext';
import { useTreeSequence } from '../../context/TreeSequenceContext';

type ViewMode = 'full' | 'subgraph' | 'ancestors';
type FilterMode = 'genomic' | 'tree';
type TemporalFilterMode = 'hide' | 'planes';
type GeographicMode = 'unit_grid' | 'eastern_hemisphere' | 'custom';

interface SpatialArg3DVisualizationContainerProps {
  filename: string;
  max_samples: number;
}

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
        maxNodeRadius={maxNodeRadius}
      />
    </div>
  );
};

// Helper functions for graph traversal
const getDescendants = (node: GraphNode, nodes: GraphNode[], edges: GraphEdge[]): Set<number> => {
  const descendants = new Set<number>();
  const visited = new Set<number>();
  const queue = [node.id];
  
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);
    
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

const getAncestors = (node: GraphNode, nodes: GraphNode[], edges: GraphEdge[]): Set<number> => {
  const ancestors = new Set<number>();
  const visited = new Set<number>();
  const queue = [node.id];
  
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);
    
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
  
  // Core data state
  const [data, setData] = useState<GraphData | null>(null);
  const [subArgData, setSubArgData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('full');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  
  // Filter state consolidated
  const [filterState, setFilterState] = useState({
    isActive: false,
    mode: 'genomic' as FilterMode,
    genomicRange: [0, 0] as [number, number],
    treeRange: [0, 0] as [number, number]
  });
  
  // Temporal state consolidated 
  const [temporalState, setTemporalState] = useState({
    isActive: false,
    mode: 'planes' as TemporalFilterMode,
    range: [0, 1] as [number, number],
    minTime: 0,
    maxTime: 1
  });
  
  // Metadata state
  const [metadata, setMetadata] = useState({
    sequenceLength: 0,
    treeIntervals: [] as TreeInterval[]
  });
  
  // 3D visualization settings
  const [visualSettings, setVisualSettings] = useState({
    temporalSpacing: 12,
    spatialSpacing: 160,
    temporalGridOpacity: 30,
    geographicShapeOpacity: 70,
    maxNodeRadius: 25,
    isFilterSectionCollapsed: true
  });
  
  // Geographic state
  const [geoState, setGeoState] = useState({
    mode: 'unit_grid' as GeographicMode,
    currentShape: null as GeographicShape | null,
    customShapeFile: null as File | null,
    isLoading: false,
    showCrsWarning: false
  });

  const convertTreeIntervals = useCallback((backendIntervals: [number, number, number][]): TreeInterval[] => {
    return backendIntervals.map(([index, left, right]) => ({
      index,
      left,
      right
    }));
  }, []);

  // Load geographic data
  useEffect(() => {
    const loadGeographicData = async () => {
      try {
        setGeoState(prev => ({ ...prev, isLoading: true }));
        
        if (geoState.mode === 'unit_grid') {
          const { createUnitGridShape } = await import('./GeographicUtils');
          const gridShape = createUnitGridShape(10);
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
            const gridShape = createUnitGridShape(10);
            setGeoState(prev => ({ ...prev, currentShape: gridShape }));
          }
        }
      } catch (error) {
        console.error('Error loading geographic data:', error);
      } finally {
        setGeoState(prev => ({ ...prev, isLoading: false }));
      }
    };
    
    loadGeographicData();
  }, [geoState.mode, geoState.customShapeFile]);

  // Initial data loading
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const response = await api.getGraphData(filename, { maxSamples: max_samples });
        const graphData = response.data as GraphData;
        
        // Initialize metadata
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

        // Initialize temporal state
        if (graphData.nodes?.length) {
          const times = graphData.nodes.map(node => node.time);
          const minNodeTime = Math.min(...times);
          const maxNodeTime = Math.max(...times);
          setTemporalState(prev => ({
            ...prev,
            minTime: minNodeTime,
            maxTime: maxNodeTime,
            range: [minNodeTime, minNodeTime]
          }));
        }

        // Validate spatial data
        const nodesWithSpatial = graphData.nodes.filter((node: GraphNode) => 
          node.location?.x !== undefined && node.location?.y !== undefined
        );
        
        if (nodesWithSpatial.length === 0) {
          setError('No spatial data found in this ARG. This visualization requires nodes with 2D spatial coordinates.');
        } else {
          setData(graphData);
          setSubArgData(graphData);
          
          // Set geographic mode based on CRS detection
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
  }, [filename, max_samples, convertTreeIntervals]);

  // Filtered data loading with simple debouncing
  const loadingTimeoutRef = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    if (!filterState.isActive || loading) return;

    // Clear previous timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    // Debounce API calls
    loadingTimeoutRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        
        let options: any = { maxSamples: max_samples };
        
        if (filterState.mode === 'genomic' && 
            (filterState.genomicRange[0] !== 0 || filterState.genomicRange[1] !== metadata.sequenceLength)) {
          options.genomicStart = filterState.genomicRange[0];
          options.genomicEnd = filterState.genomicRange[1];
        } else if (filterState.mode === 'tree' && 
                   (filterState.treeRange[0] !== 0 || filterState.treeRange[1] !== metadata.treeIntervals.length - 1)) {
          options.treeStartIdx = filterState.treeRange[0];
          options.treeEndIdx = filterState.treeRange[1];
        }
        
        const response = await api.getGraphData(filename, options);
        const graphData = response.data as GraphData;
        
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
        console.error('Error fetching filtered data:', e);
        setError(e instanceof Error ? e.message : 'An error occurred while fetching graph data');
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [filterState, filename, max_samples, metadata.sequenceLength, metadata.treeIntervals.length]);

  // Auto-collapse filter section
  useEffect(() => {
    setVisualSettings(prev => ({
      ...prev,
      isFilterSectionCollapsed: !filterState.isActive && !temporalState.isActive
    }));
  }, [filterState.isActive, temporalState.isActive]);

  // Filter data based on view mode and temporal settings
  const getFilteredData = (): GraphData | null => {
    if (!data) return data;

    let filteredData = data;

    // Apply temporal filtering for "hide" mode
    if (temporalState.isActive && temporalState.mode === 'hide') {
      const [minTimeFilter, maxTimeFilter] = temporalState.range;
      const isFullTimeRange = minTimeFilter === temporalState.minTime && maxTimeFilter === temporalState.maxTime;
      
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
          metadata: { ...data.metadata, is_subset: true }
        };
      }
    }

    // Apply view mode filtering
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
          metadata: { ...filteredData.metadata, is_subset: true }
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
          metadata: { ...filteredData.metadata, is_subset: true }
        };
      }
      default:
        return filteredData;
    }
  };

  // Calculate stats
  const calculateArgStats = (): ArgStatsData | null => {
    if (!subArgData || !data || !treeSequence) return null;

    const filteredData = getFilteredData();
    if (!filteredData) return null;

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

          subArgViewData = { ...data, nodes: subArgNodes, edges: subArgEdges };
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

          subArgViewData = { ...data, nodes: subArgNodes, edges: subArgEdges };
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

  // Event handlers
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

  // Simplified formatters
  const formatGenomicPosition = useCallback((value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
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
    
    if (filterState.isActive && data?.metadata.genomic_start !== undefined && data?.metadata.genomic_end !== undefined) {
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
      {/* Top bar with title and legend */}
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
          
          {/* Legend */}
          <div className="flex items-center gap-6">
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
      {(metadata.sequenceLength > 0 || metadata.treeIntervals.length > 0) && (
        <div 
          className="flex-shrink-0 border-b"
          style={{ 
            backgroundColor: colors.background,
            borderBottomColor: colors.border 
          }}
        >
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: colors.text }}>
                    <input
                      type="checkbox"
                      checked={filterState.isActive}
                      onChange={() => setFilterState(prev => ({ ...prev, isActive: !prev.isActive }))}
                      className="w-4 h-4 text-sp-pale-green bg-sp-dark-blue border-sp-very-dark-blue rounded focus:ring-sp-pale-green focus:ring-2"
                    />
                    Filter Genomic Range
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: colors.text }}>
                    <input
                      type="checkbox"
                      checked={temporalState.isActive}
                      onChange={() => setTemporalState(prev => ({ ...prev, isActive: !prev.isActive }))}
                      className="w-4 h-4 text-sp-pale-green bg-sp-dark-blue border-sp-very-dark-blue rounded focus:ring-sp-pale-green focus:ring-2"
                    />
                    Filter Temporal Range
                  </label>
                </div>
              </div>

              {(filterState.isActive || temporalState.isActive) && (
                <button
                  onClick={() => setVisualSettings(prev => ({ ...prev, isFilterSectionCollapsed: !prev.isFilterSectionCollapsed }))}
                  className="flex items-center gap-2 px-3 py-1 rounded text-sm font-medium transition-colors hover:bg-opacity-80"
                  style={{
                    backgroundColor: colors.textSecondary,
                    color: colors.background
                  }}
                >
                  <span>
                    {visualSettings.isFilterSectionCollapsed ? 'Show Controls' : 'Hide Controls'}
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
            </div>
          </div>

          {(filterState.isActive || temporalState.isActive) && !visualSettings.isFilterSectionCollapsed && (
            <div className="px-4 pb-3 space-y-3" style={{ backgroundColor: colors.background }}>
              <div className="flex items-start gap-4">
                <div className="flex flex-col gap-3 flex-shrink-0">
                  {filterState.isActive && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm" style={{ color: colors.text }}>Genomic Mode:</span>
                      <div className="flex rounded overflow-hidden" style={{ backgroundColor: colors.background }}>
                        <button
                          onClick={() => setFilterState(prev => ({ ...prev, mode: 'genomic' }))}
                          className="px-3 py-1 text-xs font-medium transition-colors"
                          style={{
                            backgroundColor: filterState.mode === 'genomic' ? colors.textSecondary : colors.background,
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
                              backgroundColor: filterState.mode === 'tree' ? colors.textSecondary : colors.background,
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
                      <span className="text-sm" style={{ color: colors.text }}>Temporal Mode:</span>
                      <div className="flex rounded overflow-hidden" style={{ backgroundColor: colors.background }}>
                        <button
                          onClick={() => setTemporalState(prev => ({ ...prev, mode: 'hide' }))}
                          className="px-3 py-1 text-xs font-medium transition-colors"
                          style={{
                            backgroundColor: temporalState.mode === 'hide' ? colors.textSecondary : colors.background,
                            color: temporalState.mode === 'hide' ? colors.background : colors.text
                          }}
                        >
                          Hide Others
                        </button>
                        <button
                          onClick={() => setTemporalState(prev => ({ ...prev, mode: 'planes' }))}
                          className="px-3 py-1 text-xs font-medium transition-colors"
                          style={{
                            backgroundColor: temporalState.mode === 'planes' ? colors.textSecondary : colors.background,
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
                  <div className="flex-1 max-w-md">
                    {filterState.mode === 'genomic' && metadata.sequenceLength > 0 ? (
                      <RangeSlider
                        min={0}
                        max={metadata.sequenceLength}
                        step={Math.max(1, Math.floor(metadata.sequenceLength / 1000))}
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
                )}
              </div>
              
              <div className="text-xs flex flex-col gap-1" style={{ color: colors.text }}>
                {filterState.isActive && (
                  <div className="flex items-center gap-2">
                    {filterState.mode === 'genomic' ? (
                      <span>
                        Genomic Range: {formatGenomicPosition(filterState.genomicRange[1] - filterState.genomicRange[0])} bp
                        ({((filterState.genomicRange[1] - filterState.genomicRange[0]) / metadata.sequenceLength * 100).toFixed(1)}% of sequence)
                        {data?.metadata.num_local_trees !== undefined && (
                          <> • {data.metadata.num_local_trees} local trees</>
                        )}
                      </span>
                    ) : filterState.mode === 'tree' && metadata.treeIntervals.length > 0 ? (
                      <span>
                        Trees {filterState.treeRange[0]}-{filterState.treeRange[1]} ({filterState.treeRange[1] - filterState.treeRange[0] + 1} of {metadata.treeIntervals.length} trees)
                        {data?.metadata.num_local_trees !== undefined && (
                          <> • {data.metadata.expected_tree_count ?? data.metadata.num_local_trees} displayed</>
                        )}
                        {data?.metadata.tree_count_mismatch && (
                          <> ⚠️ (actual: {data.metadata.num_local_trees})</>
                        )}
                      </span>
                    ) : null}
                    {loading && (
                      <div className="animate-spin rounded-full h-3 w-3 border border-t-transparent" style={{ borderColor: colors.textSecondary }}></div>
                    )}
                  </div>
                )}
                
                {temporalState.isActive && (
                  <div className="flex items-center gap-2">
                    <span>
                      Temporal Range: {temporalState.range[0].toFixed(3)} - {temporalState.range[1].toFixed(3)}{' '}
                      ({((temporalState.range[1] - temporalState.range[0]) / (temporalState.maxTime - temporalState.minTime) * 100).toFixed(1)}% of time range)
                      • Hold Shift + drag to maintain window size
                    </span>
                    {loading && (
                      <div className="animate-spin rounded-full h-3 w-3 border border-t-transparent" style={{ borderColor: colors.textSecondary }}></div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3D Visualization area */}
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
              step={(temporalState.maxTime - temporalState.minTime) / 1000}
              value={temporalState.range}
              onChange={(newRange) => setTemporalState(prev => ({ ...prev, range: newRange }))}
              formatValue={(v) => v.toFixed(3)}
              height={350}
            />
          </div>
        )}
        
        <div className="flex-1 overflow-hidden relative">
          <Spatial3DWrapper
            data={getFilteredData()}
            onNodeClick={handleNodeClick}
            onNodeRightClick={handleNodeRightClick}
            selectedNode={selectedNode}
            temporalRange={temporalState.isActive ? temporalState.range : null}
            showTemporalPlanes={temporalState.isActive && temporalState.mode === 'planes'}
            temporalFilterMode={temporalState.isActive ? temporalState.mode : null}
            temporalSpacing={visualSettings.temporalSpacing}
            spatialSpacing={visualSettings.spatialSpacing}
            geographicShape={geoState.currentShape}
            geographicMode={geoState.mode}
            temporalGridOpacity={visualSettings.temporalGridOpacity}
            geographicShapeOpacity={visualSettings.geographicShapeOpacity}
            maxNodeRadius={visualSettings.maxNodeRadius}
          />
          
          <SpatialArg3DControlPanel
            temporalSpacing={visualSettings.temporalSpacing}
            onTemporalSpacingChange={(value) => setVisualSettings(prev => ({ ...prev, temporalSpacing: value }))}
            spatialSpacing={visualSettings.spatialSpacing}
            onSpatialSpacingChange={(value) => setVisualSettings(prev => ({ ...prev, spatialSpacing: value }))}
            temporalGridOpacity={visualSettings.temporalGridOpacity}
            onTemporalGridOpacityChange={(value) => setVisualSettings(prev => ({ ...prev, temporalGridOpacity: value }))}
            geographicShapeOpacity={visualSettings.geographicShapeOpacity}
            onGeographicShapeOpacityChange={(value) => setVisualSettings(prev => ({ ...prev, geographicShapeOpacity: value }))}
            maxNodeRadius={visualSettings.maxNodeRadius}
            onMaxNodeRadiusChange={(value) => setVisualSettings(prev => ({ ...prev, maxNodeRadius: value }))}
            geographicMode={geoState.mode}
            onGeographicModeChange={(mode) => setGeoState(prev => ({ ...prev, mode }))}
            customShapeFile={geoState.customShapeFile}
            onCustomShapeFileChange={(file) => setGeoState(prev => ({ ...prev, customShapeFile: file }))}
            isLoadingGeographic={geoState.isLoading}
            currentShape={geoState.currentShape}
            showCrsWarning={geoState.showCrsWarning}
            crsDetection={data?.metadata.coordinate_system_detection}
            onDismissCrsWarning={() => setGeoState(prev => ({ ...prev, showCrsWarning: false }))}
          />
          
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
                isTemporalSliderVisible={temporalState.isActive}
              />
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default SpatialArg3DVisualizationContainer; 