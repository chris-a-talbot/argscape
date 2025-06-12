import { useEffect, useState, forwardRef, ForwardedRef, useCallback, useMemo } from 'react';
import { ForceDirectedGraph } from './ForceDirectedGraph';
import { ForceDirectedGraphInfoPanel } from './ForceDirectedGraphInfoPanel';
import { ForceDirectedGraphControlPanel } from './ForceDirectedGraphControlPanel';
import { GraphData, GraphNode, GraphEdge, TreeInterval, NodeSizeSettings } from './ForceDirectedGraph.types';
import { RangeSlider } from '../ui/range-slider';
import { TreeRangeSlider } from '../ui/tree-range-slider';
import { SampleOrderControl, SampleOrderType } from '../ui/sample-order-control';
import { ArgStatsData } from '../ui/arg-stats-display';
import { api } from '../../lib/api';
import { useColorTheme } from '../../context/ColorThemeContext';
import { useTreeSequence } from '../../context/TreeSequenceContext';

// Define view modes for the graph
type ViewMode = 'full' | 'subgraph' | 'ancestors';
type FilterMode = 'genomic' | 'tree';

interface ForceDirectedGraphContainerProps {
    filename: string;
    max_samples?: number;
}

// Helper function to get all descendants of a node
const getDescendants = (node: GraphNode, nodes: GraphNode[], edges: GraphEdge[]): Set<number> => {
    const descendants = new Set<number>();
    const visited = new Set<number>();
    const queue = [node.id]; // Work with IDs instead of node objects
    
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
    const queue = [node.id]; // Work with IDs instead of node objects
    
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

export const ForceDirectedGraphContainer = forwardRef<SVGSVGElement, ForceDirectedGraphContainerProps>(({ 
    filename,
    max_samples = 25
}, ref: ForwardedRef<SVGSVGElement>) => {
    const { colors } = useColorTheme();
    const { treeSequence } = useTreeSequence();
    const [data, setData] = useState<GraphData | null>(null);
    const [subArgData, setSubArgData] = useState<GraphData | null>(null); // Rename to clarify this is the SubARG
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('full');
    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
    const [genomicRange, setGenomicRange] = useState<[number, number]>([0, 0]);
    const [sequenceLength, setSequenceLength] = useState<number>(0);
    const [isGenomicFilterActive, setIsGenomicFilterActive] = useState(false);
    const [debouncedGenomicRange, setDebouncedGenomicRange] = useState<[number, number]>([0, 0]);
    const [isUpdatingGenomicRange, setIsUpdatingGenomicRange] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [filterMode, setFilterMode] = useState<FilterMode>('genomic');
    const [treeRange, setTreeRange] = useState<[number, number]>([0, 0]);
    const [debouncedTreeRange, setDebouncedTreeRange] = useState<[number, number]>([0, 0]);
    const [isUpdatingTreeRange, setIsUpdatingTreeRange] = useState(false);
    const [treeIntervals, setTreeIntervals] = useState<TreeInterval[]>([]);
    const [isFilterActive, setIsFilterActive] = useState(false);
    const [sampleOrder, setSampleOrder] = useState<SampleOrderType>('custom');
    const [isFilterSectionCollapsed, setIsFilterSectionCollapsed] = useState(true);
    const [nodeSizes, setNodeSizes] = useState<NodeSizeSettings>({
        sample: 8,  // Default sample node size
        root: 6,    // Default root node size  
        other: 5    // Default other node size
    });

    // Convert tree intervals from backend format
    const convertTreeIntervals = useCallback((backendIntervals: [number, number, number][]): TreeInterval[] => {
        return backendIntervals.map(([index, left, right]) => ({
            index,
            left,
            right
        }));
    }, []);

    // Debounce genomic range changes to prevent excessive API calls
    useEffect(() => {
        if (isFilterActive && filterMode === 'genomic') {
            setIsUpdatingGenomicRange(true);
        }
        
        const timer = setTimeout(() => {
            setDebouncedGenomicRange(genomicRange);
            setIsUpdatingGenomicRange(false);
        }, 500); // Increased from 300ms to 500ms for better performance

        return () => clearTimeout(timer);
    }, [genomicRange, isFilterActive, filterMode]);

    // Debounce tree range changes to prevent excessive API calls
    useEffect(() => {
        if (isFilterActive && filterMode === 'tree') {
            setIsUpdatingTreeRange(true);
        }
        
        const timer = setTimeout(() => {
            setDebouncedTreeRange(treeRange);
            setIsUpdatingTreeRange(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [treeRange, isFilterActive, filterMode]);

    // Initial data loading (without genomic filtering)
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                console.log('Fetching initial graph data for file:', filename, 'with max_samples:', max_samples);
                
                const response = await api.getGraphData(filename, { maxSamples: max_samples, sampleOrder });
                const graphData = response.data as GraphData;
                console.log('Received initial graph data:', graphData);
                
                // Initialize genomic range settings
                if (graphData.metadata.sequence_length) {
                    setSequenceLength(graphData.metadata.sequence_length);
                    const fullRange: [number, number] = [0, graphData.metadata.sequence_length];
                    setGenomicRange(fullRange);
                    setDebouncedGenomicRange(fullRange);
                }

                // Initialize tree intervals and range settings
                if (graphData.metadata.tree_intervals && graphData.metadata.tree_intervals.length > 0) {
                    const intervals = convertTreeIntervals(graphData.metadata.tree_intervals as unknown as [number, number, number][]);
                    setTreeIntervals(intervals);
                    const treeFullRange: [number, number] = [0, intervals.length - 1];
                    setTreeRange(treeFullRange);
                    setDebouncedTreeRange(treeFullRange);
                }

                setIsInitialized(true);
                setData(graphData);
                setSubArgData(graphData); // Store SubARG data (what was loaded with max_samples)
                setError(null);
            } catch (e) {
                console.error('Error fetching initial graph data:', e);
                setError(e instanceof Error ? e.message : 'An error occurred while fetching graph data');
                setData(null);
            } finally {
                setLoading(false);
            }
        };

        // Reset initialization state when filename or max_samples change
        setIsInitialized(false);
        setIsFilterActive(false); // Also reset filter state
        fetchInitialData();
    }, [filename, max_samples, convertTreeIntervals]);

    // Data loading with filtering and sample order changes
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

        // Always make API call if sample order has changed, regardless of filter state
        if (!needsApiCall) {
            // Check if we have data and the sample order in metadata matches current selection
            if (!data || data.metadata.sample_order !== sampleOrder) {
                needsApiCall = true;
                console.log('Making API call due to sample order change');
            } else {
                console.log('Skipping API call - using existing data (full range or filter disabled)');
                return;
            }
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                
                let options: any = { maxSamples: max_samples, sampleOrder };
                
                if (genomicParams) {
                    console.log('Fetching filtered graph data for genomic range:', debouncedGenomicRange);
                    options.genomicStart = genomicParams.genomic_start;
                    options.genomicEnd = genomicParams.genomic_end;
                } else if (treeParams) {
                    console.log('Fetching filtered graph data for tree range:', debouncedTreeRange);
                    options.treeStartIdx = treeParams.tree_start_idx;
                    options.treeEndIdx = treeParams.tree_end_idx;
                } else {
                    console.log('Fetching unfiltered graph data');
                }
                
                const response = await api.getGraphData(filename, options);
                const graphData = response.data as GraphData;
                console.log('Received graph data:', graphData);
                
                setData(graphData);
                setError(null);
            } catch (e) {
                console.error('Error fetching graph data:', e);
                setError(e instanceof Error ? e.message : 'An error occurred while fetching graph data');
                setData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [filename, max_samples, debouncedGenomicRange, debouncedTreeRange, isFilterActive, filterMode, isInitialized, sequenceLength, treeIntervals, sampleOrder]);

    // Auto-collapse filter section when filters are inactive, but only on initialization
    useEffect(() => {
        if (!isFilterActive) {
            setIsFilterSectionCollapsed(true);
        }
    }, [isFilterActive]);

    // Filter data based on current view mode
    const getFilteredData = (): GraphData | null => {
        if (!data || !selectedNode) return data;

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

                return {
                    ...data,
                    nodes: filteredNodes,
                    edges: filteredEdges,
                    metadata: {
                        ...data.metadata,
                        is_subset: true
                    }
                };
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

                return {
                    ...data,
                    nodes: filteredNodes,
                    edges: filteredEdges,
                    metadata: {
                        ...data.metadata,
                        is_subset: true
                    }
                };
            }
            default:
                return data;
        }
    };

    // Calculate ARG statistics for display
    const calculateArgStats = (): ArgStatsData | null => {
        if (!subArgData || !data || !treeSequence) return null;

        const filteredData = getFilteredData();
        if (!filteredData) return null;

        // SubARG stats are the same as filtered data in force-directed graph
        // since temporal filtering is not available here
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

    const handleEdgeClick = (edge: GraphEdge) => {
        console.log('Edge clicked:', edge);
        // Add your edge click handling logic here
    };

    const handleReturnToFull = () => {
        setViewMode('full');
        setSelectedNode(null);
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

    const handleToggleFilter = useCallback(() => {
        const newFilterState = !isFilterActive;
        setIsFilterActive(newFilterState);
        
        if (newFilterState) {
            if (filterMode === 'genomic') {
                // Activating genomic filter - ensure range is set to full sequence initially
                setGenomicRange([0, sequenceLength]);
                setDebouncedGenomicRange([0, sequenceLength]);
            } else if (filterMode === 'tree' && treeIntervals.length > 0) {
                // Activating tree filter - ensure range is set to full tree range initially
                const fullTreeRange: [number, number] = [0, treeIntervals.length - 1];
                setTreeRange(fullTreeRange);
                setDebouncedTreeRange(fullTreeRange);
            }
            // Show controls when activating filter
            setIsFilterSectionCollapsed(false);
        } else {
            // Deactivating filter - reload initial data without filtering and collapse controls
            setIsFilterSectionCollapsed(true);
        }
    }, [isFilterActive, filterMode, sequenceLength, treeIntervals]);

    const handleFilterModeChange = useCallback((newMode: FilterMode) => {
        setFilterMode(newMode);
        
        // Initialize the appropriate range when switching modes
        if (newMode === 'genomic') {
            setGenomicRange([0, sequenceLength]);
            setDebouncedGenomicRange([0, sequenceLength]);
        } else if (newMode === 'tree' && treeIntervals.length > 0) {
            const fullTreeRange: [number, number] = [0, treeIntervals.length - 1];
            setTreeRange(fullTreeRange);
            setDebouncedTreeRange(fullTreeRange);
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
                title = `SubARG at Root ${selectedNode?.id}`;
                break;
            case 'ancestors':
                title = `Parent ARG of Node ${selectedNode?.id}`;
                break;
            default:
                title = 'Full ARG';
        }
        
        if (isFilterActive && data?.metadata.genomic_start !== undefined && data?.metadata.genomic_end !== undefined) {
            title += ` (${formatGenomicPosition(data.metadata.genomic_start)} - ${formatGenomicPosition(data.metadata.genomic_end)})`;
        }
        
        return title;
    };

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.background }}>
                <div className="text-center">
                    <div 
                        className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
                        style={{ borderColor: colors.accentPrimary }}
                    ></div>
                    <p style={{ color: colors.text }}>Loading force-directed ARG visualization...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.background }}>
                <div className="text-center" style={{ color: colors.text }}>
                    <p className="text-lg mb-2">Error loading visualization</p>
                    <p className="text-sm" style={{ color: `${colors.text}B3` }}>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div 
            className="w-full h-full flex flex-col overflow-hidden"
            style={{ backgroundColor: colors.background }}
        >
            {/* Header - Three Row Layout */}
            <div 
                className="flex-shrink-0 border-b"
                style={{ 
                    backgroundColor: colors.background,
                    borderBottomColor: colors.border 
                }}
            >
                {/* Row 3: View title and filter controls */}
                <div className="px-4 py-2">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-4">
                                <h2 className="text-lg font-semibold" style={{ color: colors.headerText }}>
                                    {getViewTitle()}
                                </h2>
                                
                                {(sequenceLength > 0 || treeIntervals.length > 0) && (
                                    <div className="flex items-center gap-4">
                                        {sequenceLength > 0 && (
                                            <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: colors.headerText }}>
                                                <input
                                                    type="checkbox"
                                                    checked={isFilterActive}
                                                    onChange={handleToggleFilter}
                                                    className="w-4 h-4 rounded focus:ring-2"
                                                    style={{
                                                        accentColor: colors.accentPrimary
                                                    }}
                                                />
                                                Filter Genomic Range
                                            </label>
                                        )}
                                    </div>
                                )}
                                
                                {viewMode !== 'full' && (
                                    <button
                                        onClick={handleReturnToFull}
                                        className="font-medium px-3 py-1 rounded text-sm transition-colors border"
                                        style={{
                                            backgroundColor: colors.containerBackground,
                                            color: colors.text,
                                            borderColor: `${colors.accentPrimary}33` // 20% opacity
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = `${colors.accentPrimary}66`; // 40% opacity
                                            e.currentTarget.style.backgroundColor = `${colors.containerBackground}CC`; // 80% opacity
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
                            {isFilterActive && (
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
            </div>
            
            {/* Filter Controls Section - only show when filters are active */}
            {isFilterActive && (
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
                                    {/* Filter mode selection */}
                                    {treeIntervals.length > 0 && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm whitespace-nowrap" style={{ color: colors.text }}>
                                                Genomic Mode:
                                            </span>
                                            <div className="flex rounded overflow-hidden" style={{ backgroundColor: colors.containerBackground }}>
                                                <button
                                                    onClick={() => handleFilterModeChange('genomic')}
                                                    className={`px-3 py-1 text-xs font-medium transition-colors ${
                                                        filterMode === 'genomic' 
                                                            ? '' 
                                                            : 'hover:opacity-80'
                                                    }`}
                                                    style={{
                                                        backgroundColor: filterMode === 'genomic' ? colors.accentPrimary : colors.containerBackground,
                                                        color: filterMode === 'genomic' ? colors.background : colors.text
                                                    }}
                                                >
                                                    Genomic
                                                </button>
                                                <button
                                                    onClick={() => handleFilterModeChange('tree')}
                                                    className={`px-3 py-1 text-xs font-medium transition-colors ${
                                                        filterMode === 'tree' 
                                                            ? '' 
                                                            : 'hover:opacity-80'
                                                    }`}
                                                    style={{
                                                        backgroundColor: filterMode === 'tree' ? colors.accentPrimary : colors.containerBackground,
                                                        color: filterMode === 'tree' ? colors.background : colors.text
                                                    }}
                                                >
                                                    Tree Index
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="flex-1 max-w-md min-w-0">
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
                                    
                                    {/* Inline filter info */}
                                    <div className="text-xs flex-shrink-0" style={{ color: colors.text }}>
                                        {filterMode === 'genomic' ? (
                                            <span>
                                                {formatGenomicPosition(genomicRange[1] - genomicRange[0])} bp
                                                ({((genomicRange[1] - genomicRange[0]) / sequenceLength * 100).toFixed(1)}%)
                                                {data?.metadata.num_local_trees !== undefined && (
                                                    <> • {data.metadata.num_local_trees} trees</>
                                                )}
                                            </span>
                                        ) : filterMode === 'tree' && treeIntervals.length > 0 ? (
                                            <span>
                                                Trees {treeRange[0]}-{treeRange[1]} ({treeRange[1] - treeRange[0] + 1} of {treeIntervals.length})
                                                {data?.metadata.num_local_trees !== undefined && (
                                                    <> • {data.metadata.expected_tree_count ?? data.metadata.num_local_trees} displayed</>
                                                )}
                                                {data?.metadata.tree_count_mismatch && (
                                                    <> ⚠️ (actual: {data.metadata.num_local_trees})</>
                                                )}
                                            </span>
                                        ) : null}
                                        {loading && (
                                            <div className="inline-block ml-2 animate-spin rounded-full h-3 w-3 border border-t-transparent" style={{ borderColor: colors.accentPrimary }}></div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="flex-1 overflow-hidden">
                <div className="w-full h-full relative">
                    <ForceDirectedGraph 
                        ref={ref}
                        data={getFilteredData()}
                        onNodeClick={handleNodeClick}
                        onNodeRightClick={handleNodeRightClick}
                        onEdgeClick={handleEdgeClick}
                        focalNode={selectedNode}
                        nodeSizes={nodeSizes}
                        sampleOrder={sampleOrder}
                    />
                    
                    <ForceDirectedGraphControlPanel
                        sampleOrder={sampleOrder}
                        onSampleOrderChange={setSampleOrder}
                        nodeSizes={nodeSizes}
                        onNodeSizeChange={setNodeSizes}
                        isLoading={loading}
                    />
                    
                    <ForceDirectedGraphInfoPanel
                        originalNodeCount={calculateArgStats()?.originalNodes}
                        originalEdgeCount={calculateArgStats()?.originalEdges}
                        subargNodeCount={calculateArgStats()?.subArgNodes}
                        subargEdgeCount={calculateArgStats()?.subArgEdges}
                        displayedNodeCount={calculateArgStats()?.displayedNodes}
                        displayedEdgeCount={calculateArgStats()?.displayedEdges}
                        genomicRange={isFilterActive ? genomicRange : undefined}
                        sequenceLength={sequenceLength}
                        isFiltered={isFilterActive}
                        isFilterSectionCollapsed={isFilterSectionCollapsed}
                    />
                </div>
            </div>
        </div>
    );
}); 