import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useColorTheme } from '../../context/ColorThemeContext';
import { api } from '../../lib/api';
import { GraphData, GraphNode, TreeInterval } from '../ForceDirectedGraph/ForceDirectedGraph.types';
import SpatialArgDiffVisualization from './SpatialArgDiffVisualization';
import { useGeographicDiffState } from '../../hooks/useGeographicDiffState';
import { GeographicMode } from '../../hooks/useGeographicDiffState';
import { TemporalSpacingMode, NodeIdSettings, EdgeMutationSettings } from '../SpatialArg3DVisualization/SpatialArg3DVisualization.types';
import { RangeSlider } from '../ui/range-slider';
import { TreeRangeSlider } from '../ui/tree-range-slider';
import { TemporalRangeSlider } from '../ui/temporal-range-slider';
import { VisualizationSidebar } from '../ui/VisualizationSidebar';
import { VisualizationSection, ViewControlsSection, ElementsSection, InformationSection } from '../SpatialArg3DVisualization/SpatialArg3DSidebarSections';
import { DiffControlsSection } from './SpatialArgDiffSidebarSections';

// Constants
const CONTAINER_CONSTANTS = {
  DEBOUNCE_DELAY: 500,
  GENOMIC_STEP_DIVISOR: 1000,
  PERCENTAGE_PRECISION: 1,
  TIME_PRECISION: 3,
  TEMPORAL_STEP_DIVISOR: 1000,
  TEMPORAL_SLIDER_HEIGHT: 350
};

// Helper function to validate spatial data
const validateSpatialData = (graphData: GraphData): boolean => {
  const nodesWithSpatial = graphData.nodes.filter((node: GraphNode) => 
    node.location?.x !== undefined && node.location?.y !== undefined
  );
  return nodesWithSpatial.length > 0;
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


interface SpatialArgDiffVisualizationContainerProps {
  firstFilename: string;
  secondFilename: string;
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
  temporalSpacingMode: 'equal' as TemporalSpacingMode
};

export const SpatialArgDiffVisualizationContainer: React.FC<SpatialArgDiffVisualizationContainerProps> = ({
  firstFilename,
  secondFilename
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedTreeSequenceToChange, setSelectedTreeSequenceToChange] = useState<'first' | 'second' | null>(null);
  const [isFilterSectionCollapsed, setIsFilterSectionCollapsed] = useState(true);
  
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
  type TemporalFilterMode = 'hide' | 'planes';
  
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
    currentProgress: 0
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
  } = useGeographicDiffState();

  // Helper to apply temporal filtering client-side
  const applyTemporalFiltering = useCallback((data: GraphData, temporalState: any): GraphData => {
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
  }, []);

  // Apply temporal filtering (only in 'hide' mode, not 'planes' mode)
  const filteredFirstData = useMemo(() => {
    if (!firstData) return null;
    return applyTemporalFiltering(firstData, temporalState);
  }, [firstData, temporalState, applyTemporalFiltering]);

  const filteredSecondData = useMemo(() => {
    if (!secondData) return null;
    return applyTemporalFiltering(secondData, temporalState);
  }, [secondData, temporalState, applyTemporalFiltering]);

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
  }, [layerReveal.isPlaying, layerReveal.rate, layerReveal.currentProgress, firstData, secondData, temporalState.isActive]);

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
                3D Spatial Diff Visualization
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
                          ({calculatePercentage(filterState.genomicRange[1] - filterState.genomicRange[0], metadata.sequenceLength)}%)
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
                      ({calculatePercentage(temporalState.range[1] - temporalState.range[0], temporalState.maxTime - temporalState.minTime)}% of time range)
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
            nodeSizes={visualSettings.nodeSizes}
            nodeIdSettings={nodeIdSettings}
            edgeThickness={visualSettings.edgeThickness}
            edgeOpacity={visualSettings.edgeOpacity}
            edgeLabelSettings={visualSettings.edgeLabelSettings}
            edgeMutationSettings={edgeMutationSettings}
            temporalRange={temporalState.isActive ? temporalState.range : null}
            temporalFilterMode={temporalState.isActive ? temporalState.mode : null}
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
                  onLayerRevealStart={() => {
                    if (firstData) {
                      const uniqueTimes = Array.from(new Set([...firstData.nodes.map(node => node.time), ...(secondData?.nodes.map(node => node.time) || [])])).sort((a, b) => a - b);
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