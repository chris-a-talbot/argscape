import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { GraphNode, GraphData } from '../components/visualizations/ForceDirectedGraph/ForceDirectedGraph.types';
import { getDescendants, getAncestors } from '../utils/graphTraversal';

type ViewMode = 'full' | 'subgraph' | 'ancestors';

export interface ViewModeState {
    viewMode: ViewMode;
    selectedNode: GraphNode | null;
}

export interface ViewModeActions {
    setViewMode: (mode: ViewMode) => void;
    setSelectedNode: (node: GraphNode | null) => void;
    handleNodeClick: (node: GraphNode) => void;
    handleNodeRightClick: (node: GraphNode) => void;
    handleReturnToFull: () => void;
}

export interface UseViewModeStateResult extends ViewModeState, ViewModeActions {
    filteredData: GraphData | null;
    resetTrigger: number;
}

export interface InitialFocusParams {
    focusRoot?: number;
    focusSample?: number;
}

export const useViewModeState = (
    data: GraphData | null,
    saveClusteringStateIfNeeded: () => void,
    restoreClusteringStateIfNeeded: () => void,
    setClusteringEnabled: (enabled: boolean) => void,
    setResetTrigger: (trigger: number) => void,
    initialFocus?: InitialFocusParams
): UseViewModeStateResult => {
    const [viewMode, setViewMode] = useState<ViewMode>('full');
    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
    const [resetTrigger, setLocalResetTrigger] = useState(0);
    const [initialFocusApplied, setInitialFocusApplied] = useState(false);

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

        // Disable clustering when entering focus view
        saveClusteringStateIfNeeded();
        setClusteringEnabled(false);

        setSelectedNode(targetNode);
        setViewMode(initialFocus?.focusRoot !== undefined ? 'subgraph' : 'ancestors');
        setInitialFocusApplied(true);
    }, [data, initialFocus, initialFocusApplied, saveClusteringStateIfNeeded, setClusteringEnabled]);

    // Refs to avoid recreating callbacks on every state change
    const selectedNodeRef = useRef(selectedNode);
    const viewModeRef = useRef(viewMode);

    useEffect(() => {
        selectedNodeRef.current = selectedNode;
        viewModeRef.current = viewMode;
    }, [selectedNode, viewMode]);

    // Effect to trigger simulation reset when viewMode or selectedNode changes (subARG/parent ARG loaded)
    // This ensures horizontal spacing is recalculated for the new graph subset
    const prevViewModeRef = useRef<ViewMode>('full');
    const prevSelectedNodeIdRef = useRef<number | null>(null);
    useEffect(() => {
        // Only trigger if viewMode or selectedNode actually changed (not on initial mount)
        const viewModeChanged = prevViewModeRef.current !== viewMode;
        const selectedNodeChanged = prevSelectedNodeIdRef.current !== (selectedNode?.id ?? null);

        // Skip if nothing changed (initial mount)
        if (!viewModeChanged && !selectedNodeChanged) {
            // Update refs for next comparison
            prevViewModeRef.current = viewMode;
            prevSelectedNodeIdRef.current = selectedNode?.id ?? null;
            return;
        }

        // Skip if returning to initial state (full view with no selected node)
        const wasInitialState = prevViewModeRef.current === 'full' && !prevSelectedNodeIdRef.current;
        const isInitialState = viewMode === 'full' && !selectedNode;
        if (wasInitialState && isInitialState) {
            // Update refs for next comparison
            prevViewModeRef.current = viewMode;
            prevSelectedNodeIdRef.current = null; // selectedNode is null when isInitialState is true
            return;
        }

        // Update refs for next comparison
        prevViewModeRef.current = viewMode;
        prevSelectedNodeIdRef.current = selectedNode?.id ?? null;

        // Trigger reset to recalculate horizontal spacing and re-initialize simulation
        // Small delay to let the filteredData update first
        const timeoutId = setTimeout(() => {
            setLocalResetTrigger(prev => prev + 1);
        }, 100);

        return () => clearTimeout(timeoutId);
    }, [viewMode, selectedNode?.id]);

    // Memoize filtered data to prevent unnecessary re-renders
    const filteredData = useMemo(() => {
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
                let allAncestors: Set<number>;

                // Handle sample clusters: combine ancestors of all samples in the cluster
                if (selectedNode.is_sample_cluster && selectedNode.cluster_nodes && selectedNode.cluster_nodes.length > 0) {
                    // Start with ancestors reachable through the cluster node
                    // (edges that were remapped from samples to point to the cluster node)
                    allAncestors = getAncestors(selectedNode, data.nodes, data.edges);

                    // Add the cluster node itself
                    allAncestors.add(selectedNode.id);

                    // Also try to find individual sample nodes that might still exist in data
                    // (in case some samples weren't fully clustered or are present for other reasons)
                    for (const sampleId of selectedNode.cluster_nodes) {
                        const sampleNode = data.nodes.find(n => n.id === sampleId);
                        if (sampleNode) {
                            // Sample node exists - get its ancestors and add to union
                            const sampleAncestors = getAncestors(sampleNode, data.nodes, data.edges);
                            sampleAncestors.forEach(id => allAncestors.add(id));
                            allAncestors.add(sampleId);
                        } else {
                            // Sample node was clustered and removed - include its ID anyway
                            // (even though it won't be in filteredNodes, this ensures completeness)
                            allAncestors.add(sampleId);
                        }
                    }
                } else {
                    // Regular node (not a sample cluster) - use normal ancestor computation
                    allAncestors = getAncestors(selectedNode, data.nodes, data.edges);
                    allAncestors.add(selectedNode.id);
                }

                const filteredNodes = data.nodes.filter(node => allAncestors.has(node.id));
                const filteredEdges = data.edges.filter(edge => {
                    const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
                    const targetId = typeof edge.target === 'number' ? edge.target : edge.target.id;
                    return allAncestors.has(sourceId) && allAncestors.has(targetId);
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
    }, [data, selectedNode, viewMode]);

    const handleNodeClick = useCallback((node: GraphNode) => {
        const currentViewMode = viewModeRef.current;
        const currentSelectedNode = selectedNodeRef.current;

        if (currentViewMode === 'full') {
            // Entering subARG view - save clustering state and disable clustering
            saveClusteringStateIfNeeded();
            setClusteringEnabled(false); // Disable clustering in subARG (expand cluster)

            setSelectedNode(node);
            setViewMode('subgraph');
        } else if (currentSelectedNode?.id === node.id) {
            // Same node clicked again - return to full view and restore clustering
            setViewMode('full');
            setSelectedNode(null);

            // Restore clustering state
            restoreClusteringStateIfNeeded();
        } else {
            // Different node clicked - show its subgraph (keep clustering disabled)
            setSelectedNode(node);
            setViewMode('subgraph');
        }
    }, [saveClusteringStateIfNeeded, restoreClusteringStateIfNeeded, setClusteringEnabled]);

    const handleNodeRightClick = useCallback((node: GraphNode) => {
        // Only save clustering state if we're entering from full view
        if (viewMode === 'full') {
            saveClusteringStateIfNeeded();
            setClusteringEnabled(false); // Disable clustering in parent ARG
        }
        setSelectedNode(node);
        setViewMode('ancestors');
    }, [viewMode, saveClusteringStateIfNeeded, setClusteringEnabled]);

    const handleReturnToFull = useCallback(() => {
        // Restore clustering state when returning to full view
        restoreClusteringStateIfNeeded();
        setViewMode('full');
        setSelectedNode(null);
    }, [restoreClusteringStateIfNeeded]);

    // Update the parent's reset trigger when our local reset trigger changes
    useEffect(() => {
        if (resetTrigger > 0) {
            setResetTrigger(resetTrigger);
        }
    }, [resetTrigger, setResetTrigger]);

    return {
        viewMode,
        selectedNode,
        filteredData,
        resetTrigger,
        setViewMode,
        setSelectedNode,
        handleNodeClick,
        handleNodeRightClick,
        handleReturnToFull,
    };
};
