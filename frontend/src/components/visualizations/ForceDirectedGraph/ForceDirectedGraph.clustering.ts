import { GraphNode, GraphEdge } from './ForceDirectedGraph.types';
import { getChildren } from './ForceDirectedGraph.utils';
import { isRootNode } from '../../../utils/graphTraversal';

/**
 * Calculate subtree metrics for a node (size, depth, sample count)
 */
export function calculateSubtreeMetrics(
    node: GraphNode,
    nodes: GraphNode[],
    edges: GraphEdge[],
    visited: Set<number> = new Set()
): { size: number; depth: number; samples: number } {
    if (visited.has(node.id)) {
        return { size: 0, depth: 0, samples: 0 };
    }
    visited.add(node.id);
    
    const children = getChildren(node, nodes, edges);
    if (children.length === 0) {
        // Leaf node
        return {
            size: 1,
            depth: 0,
            samples: node.is_sample ? 1 : 0
        };
    }
    
    let totalSize = 1; // Count self
    let maxDepth = 0;
    let totalSamples = node.is_sample ? 1 : 0;
    
    for (const child of children) {
        const metrics = calculateSubtreeMetrics(child, nodes, edges, visited);
        totalSize += metrics.size;
        maxDepth = Math.max(maxDepth, metrics.depth + 1);
        totalSamples += metrics.samples;
    }
    
    return {
        size: totalSize,
        depth: maxDepth,
        samples: totalSamples
    };
}

/**
 * Check if a subtree should be clustered based on minimum size, optional density, and temporal compactness requirements
 * 
 * Clustering is controlled by:
 * - minTreeSize: Minimum number of nodes required in a subtree
 * - requireDensity/densityIntensity: Optional density filtering (nodes per depth level)
 * - requireTemporalCompactness/temporalIntensity: Optional temporal compactness filtering
 */
export function shouldClusterSubtree(
    node: GraphNode,
    nodes: GraphNode[],
    edges: GraphEdge[],
    minTreeSize: number = 3,  // Minimum subtree size to cluster
    requireDensity: boolean = false,  // Optional density requirement (default: off)
    densityIntensity: number = 0.5,  // Intensity of density requirement (0=no effect, 1=max effect)
    requireTemporalCompactness: boolean = true,  // Temporal compactness requirement (default: on)
    temporalIntensity: number = 0.5  // Intensity of temporal compactness (0=no effect, 1=max effect)
): boolean {
    // Never cluster sample nodes or their direct parents
    if (node.is_sample) {
        return false;
    }
    
    // Never cluster root nodes (no parents)
    if (isRootNode(node, nodes, edges)) {
        return false;
    }
    
    const children = getChildren(node, nodes, edges);
    const hasDirectSampleChildren = children.some(c => c.is_sample);
    if (hasDirectSampleChildren) {
        return false;
    }
    
    // Don't cluster nodes that are immediate parents of samples (already checked above)
    // But allow clustering further away - removed the 2-generation restriction for balance
    
    // Calculate subtree metrics
    const metrics = calculateSubtreeMetrics(node, nodes, edges);
    
    const subtreeSize = metrics.size;
    const subtreeDepth = metrics.depth;
    
    // Minimum size check - direct threshold
    if (subtreeSize < minTreeSize) {
        return false;
    }
    
    // Density requirement (optional, default off)
    if (requireDensity) {
        // Density intensity scales the minimum density requirement
        // Intensity 0.0: minDensity = 0.5 (no effect, very lenient)
        // Intensity 0.5: minDensity = 1.75 (moderate)
        // Intensity 1.0: minDensity = 3.0 (max effect, very strict)
        const density = subtreeSize / Math.max(1, subtreeDepth);
        // Linear interpolation: intensity 0 -> minDensity 0.5, intensity 1 -> minDensity 3.0
        const minDensity = 0.5 + (densityIntensity * 2.5);
        
        if (density < minDensity) {
            return false;
        }
    }
    
    // Temporal compactness check (optional, default on)
    if (requireTemporalCompactness) {
        const subtreeNodesList: GraphNode[] = [];
        const queue = [node];
        const visited = new Set<number>();
        
        while (queue.length > 0) {
            const current = queue.shift()!;
            if (visited.has(current.id)) continue;
            visited.add(current.id);
            subtreeNodesList.push(current);
            
            const currentChildren = getChildren(current, nodes, edges);
            for (const child of currentChildren) {
                if (!child.is_sample) {
                    queue.push(child);
                }
            }
        }
        
        const times = subtreeNodesList.map(n => n.time);
        const timeRange = Math.max(...times) - Math.min(...times);
        const avgTimeSpacing = timeRange / subtreeDepth;
        
        // Temporal threshold scales with intensity using logarithmic scale for smoother transitions
        // Intensity 0.0: threshold = 100.0 (no effect, very lenient - almost everything passes)
        // Intensity 0.05 (5%): threshold = ~75.0 (very lenient - most subtrees pass)
        // Intensity 0.1 (10%): threshold = ~56.2 (lenient)
        // Intensity 0.2 (20%): threshold = ~31.6 (moderate)
        // Intensity 0.5 (50%): threshold = ~5.6 (strict)
        // Intensity 1.0: threshold = ~0.32 (max effect, very strict - only very compact passes)
        const allNodeTimes = nodes.map(n => n.time);
        const globalTimeRange = Math.max(...allNodeTimes) - Math.min(...allNodeTimes);
        const avgGlobalTimeSpacing = globalTimeRange / nodes.length;
        // Logarithmic scale: threshold = 100 * 10^(-intensity * 2.5)
        // This provides smoother, more gradual changes especially at low intensities
        // The logarithmic curve prevents sudden jumps and allows fine-tuning throughout the range
        const temporalThreshold = 100.0 * Math.pow(10, -temporalIntensity * 2.5);
        
        if (avgTimeSpacing > avgGlobalTimeSpacing * temporalThreshold) {
            return false;
        }
    }
    
    return true;
}

/**
 * Create cluster nodes from dense subtrees
 * Returns modified nodes and edges with clusters replacing subtrees
 */
export function createClusterNodes(
    originalNodes: GraphNode[],
    originalEdges: GraphEdge[],
    minTreeSize: number = 3,
    requireDensity: boolean = false,
    densityIntensity: number = 0.5,
    requireTemporalCompactness: boolean = true,
    temporalIntensity: number = 0.5
): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const nodes = [...originalNodes];
    const edges = [...originalEdges];
    const clusteredNodeIds = new Set<number>();
    const clusterNodes: GraphNode[] = [];
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    
    // Debug: analyze graph structure
    let debugStats = {
        totalNodes: nodes.length,
        internalNodes: nodes.filter(n => !n.is_sample).length,
        candidatesChecked: 0,
        passedSizeCheck: 0,
        passedDensityCheck: 0,
        clustered: 0
    };
    
    // Find nodes to cluster - work TOP-DOWN: oldest to youngest (roots to samples)
    // This allows us to cluster large subtrees first before they get fragmented
    // In an ARG: samples have time=0 (youngest), roots have highest time (oldest)
    // Sort: b.time - a.time means highest time first = oldest first = roots first
    const sortedByTime = [...nodes].sort((a, b) => b.time - a.time); // Oldest first (top-down)
    
    for (const node of sortedByTime) {
        // Skip if already clustered
        if (clusteredNodeIds.has(node.id)) {
            continue;
        }
        
        // Skip samples
        if (node.is_sample) continue;
        
        debugStats.candidatesChecked++;
        
        // Check subtree metrics for debugging
        const metrics = calculateSubtreeMetrics(node, nodes, edges);
        const density = metrics.size / Math.max(1, metrics.depth);
        
        if (metrics.size >= minTreeSize) {
            debugStats.passedSizeCheck++;
        }
        if (requireDensity) {
            const minDensity = 0.5 + (densityIntensity * 2.5);
            if (density >= minDensity) {
                debugStats.passedDensityCheck++;
            }
        }
        
        // Check if this node's subtree should be clustered
        if (shouldClusterSubtree(node, nodes, edges, minTreeSize, requireDensity, densityIntensity, requireTemporalCompactness, temporalIntensity)) {
            debugStats.clustered++;
            // Collect all nodes in subtree
            const subtreeNodes = new Set<number>();
            const queue = [node];
            const visited = new Set<number>();
            
            while (queue.length > 0) {
                const current = queue.shift()!;
                if (visited.has(current.id) || clusteredNodeIds.has(current.id)) {
                    continue;
                }
                visited.add(current.id);
                subtreeNodes.add(current.id);
                
                const children = getChildren(current, nodes, edges);
                for (const child of children) {
                    if (!child.is_sample && !clusteredNodeIds.has(child.id)) {
                        queue.push(child);
                    }
                }
            }
            
            // Calculate cluster metrics
            const metrics = calculateSubtreeMetrics(node, nodes, edges);
            
            // Create cluster node
            const clusterNode: GraphNode = {
                id: node.id, // Use the root node's ID
                time: node.time,
                is_sample: false,
                individual: node.individual,
                is_cluster: true,
                cluster_nodes: Array.from(subtreeNodes),
                cluster_size: metrics.size,
                cluster_depth: metrics.depth,
                cluster_samples: metrics.samples,
                timeIndex: node.timeIndex,
                layer: node.layer,
                x: node.x,
                y: node.y,
                fx: node.fx,
                fy: node.fy
            };
            
            clusterNodes.push(clusterNode);
            
            // Mark all subtree nodes as clustered
            subtreeNodes.forEach(id => clusteredNodeIds.add(id));
        }
    }
    
    // Build new node list: non-clustered nodes + cluster nodes
    const resultNodes = nodes
        .filter(n => !clusteredNodeIds.has(n.id))
        .concat(clusterNodes);
    
    // Create a mapping from clustered node IDs to their cluster node ID
    const nodeToClusterMap = new Map<number, number>();
    for (const clusterNode of clusterNodes) {
        if (clusterNode.cluster_nodes) {
            for (const nodeId of clusterNode.cluster_nodes) {
                nodeToClusterMap.set(nodeId, clusterNode.id);
            }
        }
    }
    
    // Update edges: remap clustered nodes to their cluster representatives
    // and remove pure internal edges (both endpoints in same cluster)
    const remappedEdges: GraphEdge[] = [];
    const edgeSet = new Set<string>(); // Track unique edges to avoid duplicates
    
    for (const edge of edges) {
        const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
        const targetId = typeof edge.target === 'number' ? edge.target : edge.target.id;
        
        // Remap source and target to cluster nodes if they're clustered
        const mappedSourceId = nodeToClusterMap.get(sourceId) ?? sourceId;
        const mappedTargetId = nodeToClusterMap.get(targetId) ?? targetId;
        
        // Skip self-loops (edges within same cluster)
        if (mappedSourceId === mappedTargetId) {
            continue;
        }
        
        // Create unique key for this edge to avoid duplicates
        const edgeKey = `${mappedSourceId}-${mappedTargetId}`;
        if (edgeSet.has(edgeKey)) {
            continue; // Skip duplicate edge
        }
        edgeSet.add(edgeKey);
        
        // Create new edge with remapped endpoints
        remappedEdges.push({
            source: mappedSourceId,
            target: mappedTargetId,
            left: edge.left,
            right: edge.right,
            bounds: edge.bounds,
            region_fraction: edge.region_fraction,
            has_mutations: edge.has_mutations
        });
    }
    
    // Debug output
    console.log('Clustering debug:', {
        ...debugStats,
        clusterNodesCreated: clusterNodes.length,
        nodesRemoved: clusteredNodeIds.size,
        finalNodeCount: resultNodes.length,
        originalEdges: edges.length,
        finalEdges: remappedEdges.length,
        edgesRemoved: edges.length - remappedEdges.length,
        minTreeSize: minTreeSize,
        requireDensity: requireDensity,
        densityIntensity: densityIntensity,
        requireTemporalCompactness: requireTemporalCompactness,
        temporalIntensity: temporalIntensity
    });
    
    return { nodes: resultNodes, edges: remappedEdges };
}

/**
 * Create sample clusters for samples connected to the same internal cluster node
 * This reduces edge clutter by grouping samples that are direct children of the same cluster node
 * Only clusters samples where ALL parents come from the same single internal cluster node
 */
export function createSampleClusters(
    originalNodes: GraphNode[],
    originalEdges: GraphEdge[],
    _sampleOrder: string  // Keep parameter for API compatibility, but ignore it
): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const nodes = [...originalNodes];
    const edges = [...originalEdges];
    
    // Find all samples (no sorting needed - order is ignored)
    const samples = nodes.filter(n => n.is_sample);
    
    if (samples.length < 3) {
        // Need at least 3 samples to make clustering worthwhile
        return { nodes, edges };
    }
    
    // Helper to find all parents of a node
    const getParents = (node: GraphNode): GraphNode[] => {
        const parentNodes: GraphNode[] = [];
        for (const edge of edges) {
            const targetId = typeof edge.target === 'number' ? edge.target : edge.target.id;
            const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
            if (targetId === node.id) {
                const parentNode = nodes.find(n => n.id === sourceId);
                if (parentNode) {
                    parentNodes.push(parentNode);
                }
            }
        }
        return parentNodes;
    };
    
    // Find all internal cluster nodes (cluster nodes that are NOT sample clusters)
    const internalClusterNodes = nodes.filter(n => 
        n.is_cluster && !n.is_sample_cluster && !n.is_sample
    );
    
    // Create a set of cluster node IDs for fast lookup
    const clusterNodeIds = new Set(internalClusterNodes.map(n => n.id));
    
    // Group samples by their internal cluster node parent
    // Map: clusterNodeId -> array of sample children
    // Only include samples where ALL parents come from the same single cluster node
    const clusterToSamplesMap = new Map<number, GraphNode[]>();
    
    for (const clusterNode of internalClusterNodes) {
        // Find all direct sample children of this cluster node
        const candidateChildren = getChildren(clusterNode, nodes, edges)
            .filter(child => child.is_sample);
        
        // Filter to only include samples where ALL parents are from this cluster node
        // (i.e., no mixed parents from cluster + non-cluster, or multiple clusters)
        const validSampleChildren = candidateChildren.filter(sample => {
            const allParents = getParents(sample);
            
            // Must have at least one parent (should always be true, but safety check)
            if (allParents.length === 0) {
                return false;
            }
            
            // Check if ALL parents are from the same single cluster node
            // First, check if all parents are cluster nodes
            const allParentsAreClusterNodes = allParents.every(p => clusterNodeIds.has(p.id));
            if (!allParentsAreClusterNodes) {
                return false;  // Sample has mix of cluster and non-cluster parents
            }
            
            // Check if all parents are from the SAME cluster node
            const uniqueClusterParents = new Set(
                allParents.map(p => p.id).filter(id => clusterNodeIds.has(id))
            );
            
            return uniqueClusterParents.size === 1 && uniqueClusterParents.has(clusterNode.id);
        });
        
        // Only create cluster if there are 3+ valid sample children
        if (validSampleChildren.length >= 3) {
            clusterToSamplesMap.set(clusterNode.id, validSampleChildren);
        }
    }
    
    // Convert map values to clusters array, handling max cluster size of 10
    const sampleClusters: GraphNode[][] = [];
    
    for (const cluster of clusterToSamplesMap.values()) {
        if (cluster.length > 10) {
            // Split large clusters into multiple clusters of max 10
            for (let i = 0; i < cluster.length; i += 10) {
                const subCluster = cluster.slice(i, Math.min(i + 10, cluster.length));
                if (subCluster.length >= 3) {
                    sampleClusters.push(subCluster);
                }
            }
        } else {
            sampleClusters.push(cluster);
        }
    }
    
    if (sampleClusters.length === 0) {
        // No sample clusters to create
        return { nodes, edges };
    }
    
    console.log(`Creating ${sampleClusters.length} sample clusters from ${samples.length} samples`);
    
    // Create cluster nodes
    const clusteredSampleIds = new Set<number>();
    const sampleClusterNodes: GraphNode[] = [];
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    
    for (const cluster of sampleClusters) {
        const representativeNode = cluster[0];
        const clusterNodeIds = cluster.map(n => n.id);
        
        // Mark samples as clustered
        clusterNodeIds.forEach(id => clusteredSampleIds.add(id));
        
        // Create a cluster node
        // No order_position needed - layout will position based on cluster node parent
        const clusterNode: GraphNode = {
            ...representativeNode,
            id: -1000 - sampleClusterNodes.length, // Negative ID for sample clusters
            order_position: undefined,  // Explicitly undefined - not used
            is_cluster: true,
            is_sample_cluster: true,
            is_sample: true, // Keep is_sample true so layout treats it like a sample
            cluster_nodes: clusterNodeIds,
            cluster_size: cluster.length,
            cluster_depth: 0, // Samples have no depth
            cluster_samples: cluster.length,
            label: `Samples [${cluster.length}]`,
            time: 0, // Explicitly set time=0 to ensure sample-level positioning
            // Don't set x/y - let the layout algorithm position them fresh
            // This prevents issues when switching between layout modes (dagre vs force-directed)
            x: undefined,
            y: undefined,
            fx: null,
            fy: null
        };
        
        sampleClusterNodes.push(clusterNode);
    }
    
    // Filter out clustered samples
    const resultNodes = [
        ...nodes.filter(n => !clusteredSampleIds.has(n.id)),
        ...sampleClusterNodes
    ];
    
    // Remap edges: any edge pointing to a clustered sample should point to the cluster
    const sampleToClusterMap = new Map<number, number>();
    for (const clusterNode of sampleClusterNodes) {
        for (const sampleId of clusterNode.cluster_nodes!) {
            sampleToClusterMap.set(sampleId, clusterNode.id);
        }
    }
    
    const remappedEdges: GraphEdge[] = [];
    const edgeSet = new Set<string>();
    
    for (const edge of edges) {
        const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
        const targetId = typeof edge.target === 'number' ? edge.target : edge.target.id;
        
        // Skip edges between clustered samples (internal edges)
        if (clusteredSampleIds.has(sourceId) && clusteredSampleIds.has(targetId)) {
            continue;
        }
        
        // Remap endpoints
        const mappedSourceId = sampleToClusterMap.get(sourceId) ?? sourceId;
        const mappedTargetId = sampleToClusterMap.get(targetId) ?? targetId;
        
        // Skip self-loops
        if (mappedSourceId === mappedTargetId) {
            continue;
        }
        
        // Deduplicate edges
        const edgeKey = `${mappedSourceId}-${mappedTargetId}`;
        if (edgeSet.has(edgeKey)) {
            continue;
        }
        edgeSet.add(edgeKey);
        
        remappedEdges.push({
            source: mappedSourceId,
            target: mappedTargetId,
            left: edge.left,
            right: edge.right,
            bounds: edge.bounds,
            region_fraction: edge.region_fraction,
            has_mutations: edge.has_mutations
        });
    }
    
    console.log(`Sample clustering: ${nodes.length} nodes -> ${resultNodes.length} nodes (${clusteredSampleIds.size} samples clustered)`);
    
    return { nodes: resultNodes, edges: remappedEdges };
}

// Helper to check if edge connects to sample cluster
export function getEdgeClusterInfo(d: GraphEdge, combinedNodes: GraphNode[]) {
    const source = typeof d.source === 'number' ? combinedNodes.find(n => n.id === d.source) : d.source as GraphNode;
    const target = typeof d.target === 'number' ? combinedNodes.find(n => n.id === d.target) : d.target as GraphNode;
    const isSampleClusterEdge = source?.is_sample_cluster || target?.is_sample_cluster;
    const clusterSize = source?.is_sample_cluster ? (source.cluster_size || 1) : (target?.cluster_size || 1);
    return { source, target, isSampleClusterEdge, clusterSize };
};