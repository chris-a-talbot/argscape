import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GraphNode, GraphData } from '../components/visualizations/ForceDirectedGraph/ForceDirectedGraph.types';

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
    const [searchParams, setSearchParams] = useSearchParams();
    const [viewMode, setViewMode] = useState<ViewMode>('full');
    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
    const [resetTrigger, setLocalResetTrigger] = useState(0);
    const [initialFocusApplied, setInitialFocusApplied] = useState(false);

    const viewModeGraphCache = useMemo(() => {
        if (!data) return null;

        const nodeMap = new Map<number, GraphNode>(data.nodes.map(node => [node.id, node]));
        const outgoingMap = new Map<number, number[]>();
        const incomingMap = new Map<number, number[]>();

        for (const edge of data.edges) {
            const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
            const targetId = typeof edge.target === 'number' ? edge.target : edge.target.id;

            const outgoing = outgoingMap.get(sourceId);
            if (outgoing) {
                outgoing.push(targetId);
            } else {
                outgoingMap.set(sourceId, [targetId]);
            }

            const incoming = incomingMap.get(targetId);
            if (incoming) {
                incoming.push(sourceId);
            } else {
                incomingMap.set(targetId, [sourceId]);
            }
        }

        const descendantCache = new Map<number, Set<number>>();
        const ancestorCache = new Map<number, Set<number>>();

        const getDescendantIds = (nodeId: number): Set<number> => {
            const cached = descendantCache.get(nodeId);
            if (cached) return cached;

            const descendants = new Set<number>();
            const visited = new Set<number>();
            const queue = [nodeId];

            while (queue.length > 0) {
                const currentId = queue.shift()!;
                if (visited.has(currentId)) continue;
                visited.add(currentId);

                for (const childId of outgoingMap.get(currentId) ?? []) {
                    if (!visited.has(childId)) {
                        descendants.add(childId);
                        queue.push(childId);
                    }
                }
            }

            descendantCache.set(nodeId, descendants);
            return descendants;
        };

        const getAncestorIds = (nodeId: number): Set<number> => {
            const cached = ancestorCache.get(nodeId);
            if (cached) return cached;

            const ancestors = new Set<number>();
            const visited = new Set<number>();
            const queue = [nodeId];

            while (queue.length > 0) {
                const currentId = queue.shift()!;
                if (visited.has(currentId)) continue;
                visited.add(currentId);

                for (const parentId of incomingMap.get(currentId) ?? []) {
                    if (!visited.has(parentId)) {
                        ancestors.add(parentId);
                        queue.push(parentId);
                    }
                }
            }

            ancestorCache.set(nodeId, ancestors);
            return ancestors;
        };

        return {
            nodeMap,
            getDescendantIds,
            getAncestorIds,
        };
    }, [data]);

    // Apply initial focus when data becomes available
    useEffect(() => {
        if (!data || initialFocusApplied) return;

        const focusNodeId = initialFocus?.focusRoot ?? initialFocus?.focusSample;
        if (focusNodeId === undefined) return;

        const targetNode = viewModeGraphCache?.nodeMap.get(focusNodeId) ?? data.nodes.find(n => n.id === focusNodeId);
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
    }, [data, initialFocus, initialFocusApplied, saveClusteringStateIfNeeded, setClusteringEnabled, viewModeGraphCache]);

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

        // Trigger reset on the next animation frame so filteredData is already updated,
        // without paying an extra fixed 100ms delay on every view transition.
        const frameId = requestAnimationFrame(() => {
            setLocalResetTrigger(prev => prev + 1);
        });

        return () => cancelAnimationFrame(frameId);
    }, [viewMode, selectedNode?.id]);

    // Update URL parameters when focal node is selected/deselected
    useEffect(() => {
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
    }, [viewMode, selectedNode, searchParams, setSearchParams]);

    // Memoize filtered data to prevent unnecessary re-renders
    const filteredData = useMemo(() => {
        if (!data || !selectedNode || !viewModeGraphCache) return data;

        switch (viewMode) {
            case 'subgraph': {
                const descendants = new Set(viewModeGraphCache.getDescendantIds(selectedNode.id));
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
                    allAncestors = new Set(viewModeGraphCache.getAncestorIds(selectedNode.id));

                    // Add the cluster node itself
                    allAncestors.add(selectedNode.id);

                    // Also try to find individual sample nodes that might still exist in data
                    // (in case some samples weren't fully clustered or are present for other reasons)
                    for (const sampleId of selectedNode.cluster_nodes) {
                        const sampleNode = viewModeGraphCache.nodeMap.get(sampleId);
                        if (sampleNode) {
                            // Sample node exists - get its ancestors and add to union
                            const sampleAncestors = viewModeGraphCache.getAncestorIds(sampleNode.id);
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
                    allAncestors = new Set(viewModeGraphCache.getAncestorIds(selectedNode.id));
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
    }, [data, selectedNode, viewMode, viewModeGraphCache]);

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
