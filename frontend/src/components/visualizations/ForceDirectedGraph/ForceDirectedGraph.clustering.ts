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
): { nodes: GraphNode[]; edges: GraphEdge[]; originalParentMap: Map<number, Set<number>> } {
    const nodes = [...originalNodes];
    const edges = [...originalEdges];
    const clusteredNodeIds = new Set<number>();
    const clusterNodes: GraphNode[] = [];
    
    // Pre-build maps for O(1) lookups (major performance optimization)
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    
    // Build edge index maps for fast lookups: O(edges) once instead of O(edges) per query
    const outgoingEdgesMap = new Map<number, GraphEdge[]>(); // sourceId -> edges
    const incomingEdgesMap = new Map<number, GraphEdge[]>(); // targetId -> edges
    
    for (const edge of edges) {
        const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
        const targetId = typeof edge.target === 'number' ? edge.target : edge.target.id;
        
        if (!outgoingEdgesMap.has(sourceId)) outgoingEdgesMap.set(sourceId, []);
        outgoingEdgesMap.get(sourceId)!.push(edge);
        
        if (!incomingEdgesMap.has(targetId)) incomingEdgesMap.set(targetId, []);
        incomingEdgesMap.get(targetId)!.push(edge);
    }
    
    // Build a map of original parent relationships for samples
    // Now O(samples) instead of O(samples * edges) using incomingEdgesMap
    const originalParentMap = new Map<number, Set<number>>();
    const samples = nodes.filter(n => n.is_sample);
    for (const sample of samples) {
        const parentIds = new Set<number>();
        const incomingEdges = incomingEdgesMap.get(sample.id) || [];
        for (const edge of incomingEdges) {
            const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
            parentIds.add(sourceId);
        }
        originalParentMap.set(sample.id, parentIds);
    }
    
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
        
        // Filter out already-clustered nodes for accurate metric calculation
        // This is crucial for ARGs where nodes can have multiple parents and shared descendants
        const availableNodes = nodes.filter(n => !clusteredNodeIds.has(n.id));
        const availableEdges = edges.filter(e => {
            const sourceId = typeof e.source === 'number' ? e.source : e.source.id;
            const targetId = typeof e.target === 'number' ? e.target : e.target.id;
            return !clusteredNodeIds.has(sourceId) && !clusteredNodeIds.has(targetId);
        });
        
        // Check subtree metrics using only available (non-clustered) nodes
        const metrics = calculateSubtreeMetrics(node, availableNodes, availableEdges);
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
        
        // Check if this node's subtree should be clustered using available nodes
        if (shouldClusterSubtree(node, availableNodes, availableEdges, minTreeSize, requireDensity, densityIntensity, requireTemporalCompactness, temporalIntensity)) {
            debugStats.clustered++;
            // Collect all nodes in subtree (using available nodes only)
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
                
                const children = getChildren(current, availableNodes, availableEdges);
                for (const child of children) {
                    if (!child.is_sample && !clusteredNodeIds.has(child.id)) {
                        queue.push(child);
                    }
                }
            }
            
            // Only create cluster if we actually found nodes to cluster
            // (subtree must have more than just the root node)
            if (subtreeNodes.size < minTreeSize) {
                console.log(`Skipping cluster for node ${node.id}: actual subtree size ${subtreeNodes.size} < minTreeSize ${minTreeSize} (metrics were calculated including already-clustered descendants)`);
                continue;
            }
            
            // CRITICAL: Check if this cluster will have any outgoing edges after remapping
            // Count edges from nodes in this subtree to nodes OUTSIDE this subtree
            // Optimized: Only check edges from subtree nodes, not all edges
            let externalEdgeCount = 0;
            for (const subtreeNodeId of subtreeNodes) {
                const outgoingEdges = outgoingEdgesMap.get(subtreeNodeId) || [];
                for (const edge of outgoingEdges) {
                    const targetId = typeof edge.target === 'number' ? edge.target : edge.target.id;
                    if (!subtreeNodes.has(targetId)) {
                        externalEdgeCount++;
                    }
                }
            }
            
            if (externalEdgeCount === 0) {
                console.warn(`Skipping cluster for node ${node.id}: no outgoing edges from cluster (all ${subtreeNodes.size} nodes have only internal or already-clustered connections). SubtreeNodes: [${Array.from(subtreeNodes).join(', ')}]`);
                continue;
            }
            
            console.log(`Creating cluster for node ${node.id}: ${subtreeNodes.size} nodes, ${externalEdgeCount} outgoing edges`);
            
            // Recalculate metrics based on actual collected subtree
            const actualMetrics = calculateSubtreeMetrics(node, availableNodes, availableEdges);
            
            // CRITICAL: Determine the correct time value for the cluster
            // For visual consistency, set cluster time to be just younger than the youngest (most recent)
            // external parent that points into it. This ensures edges flow "forward in time" visually.
            //
            // Strategy:
            // 1. Find all external parents (nodes pointing INTO cluster)
            // 2. Find minimum (youngest) parent time
            // 3. Set cluster time = min(parent times) - small epsilon
            // 4. This makes cluster appear "below" its parents, preventing visual "tips"
            
            const rootTime = node.time;
            
            // Collect external parent times and validate topology
            // Optimized: Only check incoming edges to subtree nodes using edge maps
            const externalParentTimes: number[] = [];
            let hasTopologicalViolation = false;
            
            for (const subtreeNodeId of subtreeNodes) {
                const incomingEdges = incomingEdgesMap.get(subtreeNodeId) || [];
                for (const edge of incomingEdges) {
                    const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
                    
                    // Edge from external node into our cluster?
                    if (!subtreeNodes.has(sourceId)) {
                        const sourceNode = nodeMap.get(sourceId);
                        const targetNode = nodeMap.get(subtreeNodeId);
                        
                        if (sourceNode && targetNode) {
                            // Check for genuine topological violation
                            if (sourceNode.time < targetNode.time) {
                                console.warn(`Skipping cluster for node ${node.id}: topological violation - external parent ${sourceId} (t=${sourceNode.time}) < cluster node ${subtreeNodeId} (t=${targetNode.time})`);
                                hasTopologicalViolation = true;
                                break;
                            }
                            externalParentTimes.push(sourceNode.time);
                        }
                    }
                }
                if (hasTopologicalViolation) break;
            }
            
            if (hasTopologicalViolation) {
                continue;
            }
            
            // Calculate cluster time: just younger than youngest external parent
            let clusterTime = rootTime; // Default to root time
            
            if (externalParentTimes.length > 0) {
                // Find youngest (minimum) external parent time
                const minExternalParentTime = Math.min(...externalParentTimes);
                
                // Set cluster time just below youngest parent for visual consistency
                // This ensures edges flow "downward" in time (parent → cluster where parent.time > cluster.time)
                clusterTime = minExternalParentTime - 0.01;
                
                console.log(`Cluster ${node.id} time: root=${rootTime}, minExternalParent=${minExternalParentTime}, adjusted=${clusterTime}`);
            } else {
                // No external parents - use root time
                console.log(`Cluster ${node.id} time: ${clusterTime} (no external parents)`);
            }
            
            // Create cluster node
            const clusterNode: GraphNode = {
                id: node.id, // Use the root node's ID
                time: clusterTime,
                is_sample: false,
                individual: node.individual,
                is_cluster: true,
                cluster_nodes: Array.from(subtreeNodes),
                cluster_size: actualMetrics.size,
                cluster_depth: actualMetrics.depth,
                cluster_samples: actualMetrics.samples,
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
    
    // Track detailed remapping statistics
    let selfLoopsSkipped = 0;
    let duplicatesSkipped = 0;
    let edgesMapped = 0;
    
    for (const edge of edges) {
        const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
        const targetId = typeof edge.target === 'number' ? edge.target : edge.target.id;
        
        // Remap source and target to cluster nodes if they're clustered
        const mappedSourceId = nodeToClusterMap.get(sourceId) ?? sourceId;
        const mappedTargetId = nodeToClusterMap.get(targetId) ?? targetId;
        
        // Skip self-loops (edges within same cluster)
        if (mappedSourceId === mappedTargetId) {
            selfLoopsSkipped++;
            continue;
        }
        
        // Create unique key for this edge to avoid duplicates
        const edgeKey = `${mappedSourceId}-${mappedTargetId}`;
        if (edgeSet.has(edgeKey)) {
            duplicatesSkipped++;
            continue; // Skip duplicate edge
        }
        edgeSet.add(edgeKey);
        
        edgesMapped++;
        
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
    
    console.log('Edge remapping stats:', {
        originalEdges: edges.length,
        selfLoopsSkipped,
        duplicatesSkipped,
        edgesMapped,
        remappedEdges: remappedEdges.length
    });
    
    // Validate: Ensure all edges point to nodes that exist in resultNodes
    const resultNodeIds = new Set(resultNodes.map(n => n.id));
    const validatedEdges = remappedEdges.filter(edge => {
        const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
        const targetId = typeof edge.target === 'number' ? edge.target : edge.target.id;
        const isValid = resultNodeIds.has(sourceId) && resultNodeIds.has(targetId);
        if (!isValid) {
            console.warn(`Clustering: Removing invalid edge ${sourceId}->${targetId} (nodes don't exist in result)`);
        }
        return isValid;
    });
    
    // Critical validation: Ensure no internal nodes have zero children
    // Build a map of outgoing edge counts per node
    const outgoingEdgeCountsMap = new Map<number, number>();
    for (const node of resultNodes) {
        outgoingEdgeCountsMap.set(node.id, 0);
    }
    for (const edge of validatedEdges) {
        const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
        outgoingEdgeCountsMap.set(sourceId, (outgoingEdgeCountsMap.get(sourceId) || 0) + 1);
    }
    
    // Check for internal nodes (non-samples) with zero children
    const orphanedInternalNodes: GraphNode[] = [];
    for (const node of resultNodes) {
        if (!node.is_sample && (outgoingEdgeCountsMap.get(node.id) || 0) === 0) {
            orphanedInternalNodes.push(node);
        }
    }
    
    if (orphanedInternalNodes.length > 0) {
        console.error('CLUSTERING ERROR: Found internal nodes with zero children:', orphanedInternalNodes.map(n => ({
            id: n.id,
            is_cluster: n.is_cluster,
            cluster_nodes: n.cluster_nodes,
            time: n.time
        })));
        
        // Remove these orphaned nodes from the result
        const validNodeIds = new Set(resultNodes.map(n => n.id));
        orphanedInternalNodes.forEach(n => validNodeIds.delete(n.id));
        const finalNodes = resultNodes.filter(n => validNodeIds.has(n.id));
        
        // Also remove any edges that reference these orphaned nodes
        const finalEdges = validatedEdges.filter(edge => {
            const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
            const targetId = typeof edge.target === 'number' ? edge.target : edge.target.id;
            return validNodeIds.has(sourceId) && validNodeIds.has(targetId);
        });
        
        console.warn(`Removed ${orphanedInternalNodes.length} orphaned internal nodes and re-validated edges`);
        
        // Debug output
        console.log('Clustering debug (with orphan removal):', {
            ...debugStats,
            clusterNodesCreated: clusterNodes.length,
            nodesRemoved: clusteredNodeIds.size,
            orphanedNodesRemoved: orphanedInternalNodes.length,
            finalNodeCount: finalNodes.length,
            originalEdges: edges.length,
            finalEdges: finalEdges.length,
            minTreeSize: minTreeSize,
            requireDensity: requireDensity,
            densityIntensity: densityIntensity,
            requireTemporalCompactness: requireTemporalCompactness,
            temporalIntensity: temporalIntensity
        });
        
        return { nodes: finalNodes, edges: finalEdges, originalParentMap };
    }
    
    // Debug output
    console.log('Clustering debug:', {
        ...debugStats,
        clusterNodesCreated: clusterNodes.length,
        nodesRemoved: clusteredNodeIds.size,
        finalNodeCount: resultNodes.length,
        originalEdges: edges.length,
        finalEdges: remappedEdges.length,
        validatedEdges: validatedEdges.length,
        invalidEdgesRemoved: remappedEdges.length - validatedEdges.length,
        edgesRemoved: edges.length - remappedEdges.length,
        minTreeSize: minTreeSize,
        requireDensity: requireDensity,
        densityIntensity: densityIntensity,
        requireTemporalCompactness: requireTemporalCompactness,
        temporalIntensity: temporalIntensity
    });
    
    return { nodes: resultNodes, edges: validatedEdges, originalParentMap };
}

/**
 * Create sample clusters for samples connected to the same internal cluster node
 * This reduces edge clutter by grouping samples that are direct children of the same cluster node
 * Only clusters samples where ALL parents come from the same single internal cluster node
 */
export function createSampleClusters(
    originalNodes: GraphNode[],
    originalEdges: GraphEdge[],
    _sampleOrder: string,  // Keep parameter for API compatibility, but ignore it
    originalParentMap?: Map<number, Set<number>>,  // Optional: map from sample ID to original parent IDs before clustering
    maxSampleClusterSize: number = 25  // Maximum number of samples per cluster (default: 25)
): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const nodes = [...originalNodes];
    const edges = [...originalEdges];
    
    // Find all samples (no sorting needed - order is ignored)
    const samples = nodes.filter(n => n.is_sample);
    
    if (samples.length < 3) {
        // Need at least 3 samples to make clustering worthwhile
        return { nodes, edges };
    }
    
    // Pre-build maps for O(1) lookups (performance optimization)
    const sampleNodeMap = new Map(nodes.map(n => [n.id, n]));
    const sampleIncomingEdgesMap = new Map<number, GraphEdge[]>();
    const sampleOutgoingEdgesMap = new Map<number, GraphEdge[]>();
    
    for (const edge of edges) {
        const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
        const targetId = typeof edge.target === 'number' ? edge.target : edge.target.id;
        
        if (!sampleOutgoingEdgesMap.has(sourceId)) sampleOutgoingEdgesMap.set(sourceId, []);
        sampleOutgoingEdgesMap.get(sourceId)!.push(edge);
        
        if (!sampleIncomingEdgesMap.has(targetId)) sampleIncomingEdgesMap.set(targetId, []);
        sampleIncomingEdgesMap.get(targetId)!.push(edge);
    }
    
    // Helper to find all parents of a node (optimized with edge maps)
    const getParents = (node: GraphNode): GraphNode[] => {
        const parentNodes: GraphNode[] = [];
        const incomingEdges = sampleIncomingEdgesMap.get(node.id) || [];
        for (const edge of incomingEdges) {
            const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
            const parentNode = sampleNodeMap.get(sourceId);
            if (parentNode) {
                parentNodes.push(parentNode);
            }
        }
        return parentNodes;
    };
    
    // Find all internal cluster nodes (cluster nodes that are NOT sample clusters)
    const internalClusterNodes = nodes.filter(n => 
        n.is_cluster && !n.is_sample_cluster && !n.is_sample
    );
    
    // Group samples by their internal cluster node parent
    // Map: clusterNodeId -> array of sample children
    // Only include samples where ALL parents come from the same single cluster node
    const clusterToSamplesMap = new Map<number, GraphNode[]>();
    
    for (const clusterNode of internalClusterNodes) {
        // Find all direct sample children of this cluster node
        const candidateChildren = getChildren(clusterNode, nodes, edges, sampleOutgoingEdgesMap, sampleNodeMap)
            .filter(child => child.is_sample);
        
        // Get the set of original node IDs that were clustered into this cluster
        const clusterSubtreeIds = new Set(clusterNode.cluster_nodes || [clusterNode.id]);
        
        // Filter to only include samples where ALL original parents were in this cluster's subtree
        // This ensures we don't hide samples that have recombinant ancestry from outside the cluster
        const validSampleChildren = candidateChildren.filter(sample => {
            // Check current parents in post-clustering graph
            const currentParents = getParents(sample);
            
            // Must have at least one parent (should always be true, but safety check)
            if (currentParents.length === 0) {
                console.warn(`Sample ${sample.id} has no parents after clustering - skipping sample clustering`);
                return false;
            }
            
            // Check if ALL current parents are from the same single cluster node
            const allParentsAreThisCluster = currentParents.every(p => p.id === clusterNode.id);
            if (!allParentsAreThisCluster) {
                return false;  // Sample has parents from other clusters or non-clustered nodes
            }
            
            // Additional check: Were ALL of the sample's ORIGINAL parents (before clustering)
            // part of the subtree that became this cluster?
            // This prevents sample-clustering of samples with recombinant ancestry from outside the cluster
            if (originalParentMap && originalParentMap.has(sample.id)) {
                const originalParents = originalParentMap.get(sample.id)!;
                const allOriginalParentsInCluster = Array.from(originalParents).every(
                    parentId => clusterSubtreeIds.has(parentId)
                );
                
                if (!allOriginalParentsInCluster) {
                    console.log(`Excluding sample ${sample.id} from sample clustering: has original parents outside cluster ${clusterNode.id}`);
                    return false;
                }
            }
            
            return true;
        });
        
        // Only create cluster if there are 3+ valid sample children
        if (validSampleChildren.length >= 3) {
            clusterToSamplesMap.set(clusterNode.id, validSampleChildren);
        }
    }
    
    // Convert map values to clusters array, handling max cluster size
    const sampleClusters: GraphNode[][] = [];
    
    for (const cluster of clusterToSamplesMap.values()) {
        if (cluster.length > maxSampleClusterSize) {
            // Split large clusters into multiple clusters of max size
            for (let i = 0; i < cluster.length; i += maxSampleClusterSize) {
                const subCluster = cluster.slice(i, Math.min(i + maxSampleClusterSize, cluster.length));
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
    
    // Validate: Ensure all edges point to nodes that exist in resultNodes
    const resultNodeIds = new Set(resultNodes.map(n => n.id));
    const validatedEdges = remappedEdges.filter(edge => {
        const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
        const targetId = typeof edge.target === 'number' ? edge.target : edge.target.id;
        const isValid = resultNodeIds.has(sourceId) && resultNodeIds.has(targetId);
        if (!isValid) {
            console.warn(`Sample clustering: Removing invalid edge ${sourceId}->${targetId} (nodes don't exist in result)`);
        }
        return isValid;
    });
    
    console.log(`Sample clustering: ${nodes.length} nodes -> ${resultNodes.length} nodes (${clusteredSampleIds.size} samples clustered, ${remappedEdges.length - validatedEdges.length} invalid edges removed)`);
    
    return { nodes: resultNodes, edges: validatedEdges };
}

// Helper to check if edge connects to sample cluster
export function getEdgeClusterInfo(d: GraphEdge, combinedNodes: GraphNode[]) {
    const source = typeof d.source === 'number' ? combinedNodes.find(n => n.id === d.source) : d.source as GraphNode;
    const target = typeof d.target === 'number' ? combinedNodes.find(n => n.id === d.target) : d.target as GraphNode;
    const isSampleClusterEdge = source?.is_sample_cluster || target?.is_sample_cluster;
    const clusterSize = source?.is_sample_cluster ? (source.cluster_size || 1) : (target?.cluster_size || 1);
    return { source, target, isSampleClusterEdge, clusterSize };
};