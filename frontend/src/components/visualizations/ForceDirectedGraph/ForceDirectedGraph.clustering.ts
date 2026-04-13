import { GraphNode, GraphEdge } from './ForceDirectedGraph.types';
import { getChildren } from './ForceDirectedGraph.utils';

// ── Named constants (extracted from magic numbers) ──────────────────────────

const CLUSTER_TIME_EPSILON = 0.01;
const SAMPLE_CLUSTER_ID_BASE = -1000;
const MIN_SAMPLES_FOR_CLUSTERING = 3;
const DEFAULT_MAX_SAMPLE_CLUSTER_SIZE = 25;
const DEFAULT_MIN_TREE_SIZE = 3;

// Density threshold: linear interpolation from 0.5 (lenient) to 3.0 (strict)
const DENSITY_THRESHOLD_BASE = 0.5;
const DENSITY_THRESHOLD_RANGE = 2.5;

// Temporal threshold: logarithmic scale 100 * 10^(-intensity * 2.5)
const TEMPORAL_THRESHOLD_BASE = 100.0;
const TEMPORAL_THRESHOLD_EXPONENT_SCALE = 2.5;

// Enable verbose console logging for debugging clustering behavior
const DEBUG_CLUSTERING = false;

// ── Helpers ─────────────────────────────────────────────────────────────────

type EdgeMaps = {
    outgoingEdgesMap: Map<number, GraphEdge[]>;
    incomingEdgesMap: Map<number, GraphEdge[]>;
    nodeMap: Map<number, GraphNode>;
};

function getEdgeId(edge: GraphEdge, end: 'source' | 'target'): number {
    const val = edge[end];
    return typeof val === 'number' ? val : (val as GraphNode).id;
}

/** Safe min/max for arrays of any size (avoids stack overflow from spread operator) */
function arrayMin(arr: number[]): number {
    let min = Infinity;
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] < min) min = arr[i];
    }
    return min;
}

function arrayMax(arr: number[]): number {
    let max = -Infinity;
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] > max) max = arr[i];
    }
    return max;
}

/** Check if a node is a root (no incoming edges among available nodes) */
function isRootNodeFast(
    nodeId: number,
    incomingEdgesMap: Map<number, GraphEdge[]>,
    clusteredNodeIds: Set<number>
): boolean {
    const incoming = incomingEdgesMap.get(nodeId);
    if (!incoming || incoming.length === 0) return true;
    // Check if all incoming edges come from already-clustered nodes
    for (const edge of incoming) {
        const sourceId = getEdgeId(edge, 'source');
        if (!clusteredNodeIds.has(sourceId)) return false;
    }
    return true;
}

// ── Subtree metrics ─────────────────────────────────────────────────────────

export interface SubtreeMetrics {
    size: number;
    depth: number;
    samples: number;
}

/**
 * Calculate subtree metrics for a node (size, depth, sample count).
 * Accepts pre-built edge maps to avoid O(E) filtering per getChildren call.
 * The `clusteredNodeIds` set is used to skip already-clustered nodes inline,
 * eliminating the need to create filtered node/edge arrays per candidate.
 */
export function calculateSubtreeMetrics(
    node: GraphNode,
    maps: EdgeMaps,
    clusteredNodeIds: Set<number>,
    visited: Set<number> = new Set()
): SubtreeMetrics {
    if (visited.has(node.id) || clusteredNodeIds.has(node.id)) {
        return { size: 0, depth: 0, samples: 0 };
    }
    visited.add(node.id);

    // Get children using pre-built maps, skipping clustered nodes inline
    const outgoing = maps.outgoingEdgesMap.get(node.id);
    if (!outgoing || outgoing.length === 0) {
        return { size: 1, depth: 0, samples: node.is_sample ? 1 : 0 };
    }

    let totalSize = 1;
    let maxDepth = 0;
    let totalSamples = node.is_sample ? 1 : 0;

    for (const edge of outgoing) {
        const targetId = getEdgeId(edge, 'target');
        if (clusteredNodeIds.has(targetId) || visited.has(targetId)) continue;
        const child = maps.nodeMap.get(targetId);
        if (!child) continue;

        const metrics = calculateSubtreeMetrics(child, maps, clusteredNodeIds, visited);
        totalSize += metrics.size;
        if (metrics.depth + 1 > maxDepth) maxDepth = metrics.depth + 1;
        totalSamples += metrics.samples;
    }

    return { size: totalSize, depth: maxDepth, samples: totalSamples };
}

// ── Cluster eligibility ─────────────────────────────────────────────────────

/**
 * Determine whether a subtree should be clustered, reusing pre-computed metrics.
 * Returns the metrics if the subtree passes all checks, or null if it should not be clustered.
 *
 * This unified function replaces the old shouldClusterSubtree + separate calculateSubtreeMetrics
 * calls, eliminating redundant tree traversals.
 */
export function evaluateClusterCandidate(
    node: GraphNode,
    maps: EdgeMaps,
    clusteredNodeIds: Set<number>,
    minTreeSize: number,
    requireDensity: boolean,
    densityIntensity: number,
    requireTemporalCompactness: boolean,
    temporalIntensity: number,
    globalAvgTimeSpacing: number
): SubtreeMetrics | null {
    // Never cluster sample nodes
    if (node.is_sample) return null;

    // Never cluster root nodes (no unclustered parents)
    if (isRootNodeFast(node.id, maps.incomingEdgesMap, clusteredNodeIds)) return null;

    // Never cluster nodes with direct sample children
    const outgoing = maps.outgoingEdgesMap.get(node.id);
    if (outgoing) {
        for (const edge of outgoing) {
            const targetId = getEdgeId(edge, 'target');
            if (clusteredNodeIds.has(targetId)) continue;
            const child = maps.nodeMap.get(targetId);
            if (child?.is_sample) return null;
        }
    }

    // Calculate subtree metrics once
    const metrics = calculateSubtreeMetrics(node, maps, clusteredNodeIds);

    if (metrics.size < minTreeSize) return null;

    // Density check (optional)
    if (requireDensity) {
        const density = metrics.size / Math.max(1, metrics.depth);
        const minDensity = DENSITY_THRESHOLD_BASE + (densityIntensity * DENSITY_THRESHOLD_RANGE);
        if (density < minDensity) return null;
    }

    // Temporal compactness check (optional)
    if (requireTemporalCompactness && metrics.depth > 0) {
        // Collect times from subtree nodes via BFS, using maps directly
        const times: number[] = [];
        const queue: GraphNode[] = [node];
        const visited = new Set<number>();

        while (queue.length > 0) {
            const current = queue.pop()!; // Use pop (stack) instead of shift (queue) for performance
            if (visited.has(current.id) || clusteredNodeIds.has(current.id)) continue;
            visited.add(current.id);
            times.push(current.time);

            const currentOutgoing = maps.outgoingEdgesMap.get(current.id);
            if (currentOutgoing) {
                for (const edge of currentOutgoing) {
                    const targetId = getEdgeId(edge, 'target');
                    if (visited.has(targetId) || clusteredNodeIds.has(targetId)) continue;
                    const child = maps.nodeMap.get(targetId);
                    if (child && !child.is_sample) queue.push(child);
                }
            }
        }

        if (times.length > 1) {
            const timeRange = arrayMax(times) - arrayMin(times);
            const avgTimeSpacing = timeRange / metrics.depth;
            const temporalThreshold = TEMPORAL_THRESHOLD_BASE * Math.pow(10, -temporalIntensity * TEMPORAL_THRESHOLD_EXPONENT_SCALE);

            if (avgTimeSpacing > globalAvgTimeSpacing * temporalThreshold) return null;
        }
    }

    return metrics;
}

// ── Internal node clustering ────────────────────────────────────────────────

/**
 * Create cluster nodes from dense subtrees.
 * Returns modified nodes and edges with clusters replacing subtrees.
 *
 * Performance optimizations vs. original:
 * - Pre-built edge maps passed to all recursive functions (eliminates O(E) per getChildren call)
 * - clusteredNodeIds checked inline instead of creating filtered arrays per candidate (eliminates O(N+E) per candidate)
 * - Subtree metrics computed once per candidate via evaluateClusterCandidate (was 4x before)
 * - Stack-safe arrayMin/arrayMax instead of Math.min/max spread
 */
export function createClusterNodes(
    originalNodes: GraphNode[],
    originalEdges: GraphEdge[],
    minTreeSize: number = DEFAULT_MIN_TREE_SIZE,
    requireDensity: boolean = false,
    densityIntensity: number = 0.5,
    requireTemporalCompactness: boolean = true,
    temporalIntensity: number = 0.5
): { nodes: GraphNode[]; edges: GraphEdge[]; originalParentMap: Map<number, Set<number>> } {
    const nodes = [...originalNodes];
    const edges = [...originalEdges];
    const clusteredNodeIds = new Set<number>();
    const clusterNodes: GraphNode[] = [];

    // Pre-build maps for O(1) lookups
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const outgoingEdgesMap = new Map<number, GraphEdge[]>();
    const incomingEdgesMap = new Map<number, GraphEdge[]>();

    for (const edge of edges) {
        const sourceId = getEdgeId(edge, 'source');
        const targetId = getEdgeId(edge, 'target');

        let outList = outgoingEdgesMap.get(sourceId);
        if (!outList) { outList = []; outgoingEdgesMap.set(sourceId, outList); }
        outList.push(edge);

        let inList = incomingEdgesMap.get(targetId);
        if (!inList) { inList = []; incomingEdgesMap.set(targetId, inList); }
        inList.push(edge);
    }

    const maps: EdgeMaps = { outgoingEdgesMap, incomingEdgesMap, nodeMap };

    // Build original parent map for samples (used by sample clustering later)
    const originalParentMap = new Map<number, Set<number>>();
    for (const node of nodes) {
        if (!node.is_sample) continue;
        const parentIds = new Set<number>();
        const incoming = incomingEdgesMap.get(node.id);
        if (incoming) {
            for (const edge of incoming) {
                parentIds.add(getEdgeId(edge, 'source'));
            }
        }
        originalParentMap.set(node.id, parentIds);
    }

    // Pre-compute global average time spacing for temporal compactness check
    let globalAvgTimeSpacing = 0;
    if (requireTemporalCompactness && nodes.length > 1) {
        let minTime = Infinity, maxTime = -Infinity;
        for (const n of nodes) {
            if (n.time < minTime) minTime = n.time;
            if (n.time > maxTime) maxTime = n.time;
        }
        globalAvgTimeSpacing = (maxTime - minTime) / nodes.length;
    }

    // Process top-down: oldest (highest time) to youngest
    const sortedByTime = [...nodes].sort((a, b) => b.time - a.time);

    let clusteredCount = 0;

    for (const node of sortedByTime) {
        if (clusteredNodeIds.has(node.id) || node.is_sample) continue;

        // Single call evaluates all criteria and returns metrics (or null)
        const metrics = evaluateClusterCandidate(
            node, maps, clusteredNodeIds,
            minTreeSize, requireDensity, densityIntensity,
            requireTemporalCompactness, temporalIntensity,
            globalAvgTimeSpacing
        );

        if (!metrics) continue;

        // Collect subtree nodes via BFS (using maps, skipping clustered)
        const subtreeNodes = new Set<number>();
        const queue: GraphNode[] = [node];
        const visited = new Set<number>();

        while (queue.length > 0) {
            const current = queue.pop()!;
            if (visited.has(current.id) || clusteredNodeIds.has(current.id)) continue;
            visited.add(current.id);
            subtreeNodes.add(current.id);

            const currentOutgoing = outgoingEdgesMap.get(current.id);
            if (currentOutgoing) {
                for (const edge of currentOutgoing) {
                    const targetId = getEdgeId(edge, 'target');
                    if (visited.has(targetId) || clusteredNodeIds.has(targetId)) continue;
                    const child = nodeMap.get(targetId);
                    if (child && !child.is_sample) queue.push(child);
                }
            }
        }

        // Verify actual collected size meets threshold
        if (subtreeNodes.size < minTreeSize) continue;

        // Check for outgoing edges to nodes outside the subtree
        let externalEdgeCount = 0;
        for (const subtreeNodeId of subtreeNodes) {
            const outgoing = outgoingEdgesMap.get(subtreeNodeId);
            if (!outgoing) continue;
            for (const edge of outgoing) {
                const targetId = getEdgeId(edge, 'target');
                if (!subtreeNodes.has(targetId)) {
                    externalEdgeCount++;
                    break; // One is enough to confirm viability
                }
            }
            if (externalEdgeCount > 0) break;
        }

        if (externalEdgeCount === 0) continue;

        // Validate topology: check external parents point forward in time
        const externalParentTimes: number[] = [];
        let hasTopologicalViolation = false;

        for (const subtreeNodeId of subtreeNodes) {
            const incoming = incomingEdgesMap.get(subtreeNodeId);
            if (!incoming) continue;
            for (const edge of incoming) {
                const sourceId = getEdgeId(edge, 'source');
                if (subtreeNodes.has(sourceId)) continue;

                const sourceNode = nodeMap.get(sourceId);
                const targetNode = nodeMap.get(subtreeNodeId);
                if (sourceNode && targetNode) {
                    if (sourceNode.time < targetNode.time) {
                        hasTopologicalViolation = true;
                        break;
                    }
                    externalParentTimes.push(sourceNode.time);
                }
            }
            if (hasTopologicalViolation) break;
        }

        if (hasTopologicalViolation) continue;

        // Calculate cluster time: just younger than youngest external parent
        let clusterTime = node.time;
        if (externalParentTimes.length > 0) {
            clusterTime = arrayMin(externalParentTimes) - CLUSTER_TIME_EPSILON;
        }

        // Create cluster node (reuses subtree root ID)
        clusterNodes.push({
            id: node.id,
            time: clusterTime,
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
        });

        subtreeNodes.forEach(id => clusteredNodeIds.add(id));
        clusteredCount++;
    }

    // Build result node list
    const resultNodes = nodes
        .filter(n => !clusteredNodeIds.has(n.id))
        .concat(clusterNodes);

    // Build clustered-node-to-cluster mapping for edge remapping
    const nodeToClusterMap = new Map<number, number>();
    for (const cn of clusterNodes) {
        if (cn.cluster_nodes) {
            for (const nodeId of cn.cluster_nodes) {
                nodeToClusterMap.set(nodeId, cn.id);
            }
        }
    }

    // Remap edges
    const remappedEdges: GraphEdge[] = [];
    const edgeSet = new Set<string>();

    for (const edge of edges) {
        const sourceId = getEdgeId(edge, 'source');
        const targetId = getEdgeId(edge, 'target');
        const mappedSourceId = nodeToClusterMap.get(sourceId) ?? sourceId;
        const mappedTargetId = nodeToClusterMap.get(targetId) ?? targetId;

        if (mappedSourceId === mappedTargetId) continue; // self-loop

        const edgeKey = `${mappedSourceId}-${mappedTargetId}`;
        if (edgeSet.has(edgeKey)) continue; // duplicate
        edgeSet.add(edgeKey);

        remappedEdges.push({
            source: mappedSourceId,
            target: mappedTargetId,
            left: edge.left,
            right: edge.right,
            bounds: edge.bounds,
            region_fraction: edge.region_fraction,
            has_mutations: edge.has_mutations,
            mutations: edge.mutations || []
        });
    }

    // Validate edges reference existing nodes
    const resultNodeIds = new Set(resultNodes.map(n => n.id));
    const validatedEdges = remappedEdges.filter(edge => {
        const sourceId = getEdgeId(edge, 'source');
        const targetId = getEdgeId(edge, 'target');
        return resultNodeIds.has(sourceId) && resultNodeIds.has(targetId);
    });

    // Remove orphaned internal nodes (non-sample nodes with zero children)
    const outgoingCounts = new Map<number, number>();
    for (const n of resultNodes) outgoingCounts.set(n.id, 0);
    for (const edge of validatedEdges) {
        const sourceId = getEdgeId(edge, 'source');
        outgoingCounts.set(sourceId, (outgoingCounts.get(sourceId) || 0) + 1);
    }

    const orphanIds = new Set<number>();
    for (const n of resultNodes) {
        if (!n.is_sample && (outgoingCounts.get(n.id) || 0) === 0) {
            orphanIds.add(n.id);
        }
    }

    if (orphanIds.size > 0) {
        const finalNodes = resultNodes.filter(n => !orphanIds.has(n.id));
        const finalNodeIds = new Set(finalNodes.map(n => n.id));
        const finalEdges = validatedEdges.filter(edge => {
            const sourceId = getEdgeId(edge, 'source');
            const targetId = getEdgeId(edge, 'target');
            return finalNodeIds.has(sourceId) && finalNodeIds.has(targetId);
        });

        if (DEBUG_CLUSTERING) {
            console.warn(`Clustering: removed ${orphanIds.size} orphaned internal nodes`);
        }

        return { nodes: finalNodes, edges: finalEdges, originalParentMap };
    }

    if (DEBUG_CLUSTERING) {
        console.log('Clustering:', {
            clustersCreated: clusterNodes.length,
            nodesRemoved: clusteredNodeIds.size,
            finalNodes: resultNodes.length,
            finalEdges: validatedEdges.length
        });
    }

    return { nodes: resultNodes, edges: validatedEdges, originalParentMap };
}

// ── Sample clustering ───────────────────────────────────────────────────────

/**
 * Group sample nodes connected to the same internal cluster node.
 * Only clusters samples where ALL parents (both current and original pre-clustering)
 * come from the same single cluster node, preserving recombinant ancestry visibility.
 */
export function createSampleClusters(
    originalNodes: GraphNode[],
    originalEdges: GraphEdge[],
    originalParentMap?: Map<number, Set<number>>,
    maxSampleClusterSize: number = DEFAULT_MAX_SAMPLE_CLUSTER_SIZE
): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const nodes = [...originalNodes];
    const edges = [...originalEdges];

    const samples = nodes.filter(n => n.is_sample);
    if (samples.length < MIN_SAMPLES_FOR_CLUSTERING) {
        return { nodes, edges };
    }

    // Pre-build maps
    const sampleNodeMap = new Map(nodes.map(n => [n.id, n]));
    const sampleIncomingEdgesMap = new Map<number, GraphEdge[]>();
    const sampleOutgoingEdgesMap = new Map<number, GraphEdge[]>();

    for (const edge of edges) {
        const sourceId = getEdgeId(edge, 'source');
        const targetId = getEdgeId(edge, 'target');

        let outList = sampleOutgoingEdgesMap.get(sourceId);
        if (!outList) { outList = []; sampleOutgoingEdgesMap.set(sourceId, outList); }
        outList.push(edge);

        let inList = sampleIncomingEdgesMap.get(targetId);
        if (!inList) { inList = []; sampleIncomingEdgesMap.set(targetId, inList); }
        inList.push(edge);
    }

    const getParents = (node: GraphNode): GraphNode[] => {
        const parentNodes: GraphNode[] = [];
        const incoming = sampleIncomingEdgesMap.get(node.id);
        if (!incoming) return parentNodes;
        for (const edge of incoming) {
            const sourceId = getEdgeId(edge, 'source');
            const parentNode = sampleNodeMap.get(sourceId);
            if (parentNode) parentNodes.push(parentNode);
        }
        return parentNodes;
    };

    // Find internal cluster nodes
    const internalClusterNodes = nodes.filter(n =>
        n.is_cluster && !n.is_sample_cluster && !n.is_sample
    );

    // Group samples by their cluster parent
    const clusterToSamplesMap = new Map<number, GraphNode[]>();

    for (const clusterNode of internalClusterNodes) {
        const candidateChildren = getChildren(clusterNode, nodes, edges, sampleOutgoingEdgesMap, sampleNodeMap)
            .filter(child => child.is_sample);

        const clusterSubtreeIds = new Set(clusterNode.cluster_nodes || [clusterNode.id]);

        const validSampleChildren = candidateChildren.filter(sample => {
            const currentParents = getParents(sample);
            if (currentParents.length === 0) return false;

            // All current parents must be this cluster node
            if (!currentParents.every(p => p.id === clusterNode.id)) return false;

            // All original parents must have been in this cluster's subtree
            if (originalParentMap?.has(sample.id)) {
                const origParents = originalParentMap.get(sample.id)!;
                for (const parentId of origParents) {
                    if (!clusterSubtreeIds.has(parentId)) return false;
                }
            }

            return true;
        });

        if (validSampleChildren.length >= MIN_SAMPLES_FOR_CLUSTERING) {
            clusterToSamplesMap.set(clusterNode.id, validSampleChildren);
        }
    }

    // Split oversized clusters
    const sampleClusters: GraphNode[][] = [];
    for (const cluster of clusterToSamplesMap.values()) {
        if (cluster.length > maxSampleClusterSize) {
            for (let i = 0; i < cluster.length; i += maxSampleClusterSize) {
                const sub = cluster.slice(i, i + maxSampleClusterSize);
                if (sub.length >= MIN_SAMPLES_FOR_CLUSTERING) sampleClusters.push(sub);
            }
        } else {
            sampleClusters.push(cluster);
        }
    }

    if (sampleClusters.length === 0) {
        return { nodes, edges };
    }

    // Create sample cluster nodes
    const clusteredSampleIds = new Set<number>();
    const sampleClusterNodes: GraphNode[] = [];

    for (const cluster of sampleClusters) {
        const representativeNode = cluster[0];
        const clusterNodeIds = cluster.map(n => n.id);
        clusterNodeIds.forEach(id => clusteredSampleIds.add(id));

        sampleClusterNodes.push({
            ...representativeNode,
            id: SAMPLE_CLUSTER_ID_BASE - sampleClusterNodes.length,
            order_position: undefined,
            is_cluster: true,
            is_sample_cluster: true,
            is_sample: true,
            cluster_nodes: clusterNodeIds,
            cluster_size: cluster.length,
            cluster_depth: 0,
            cluster_samples: cluster.length,
            label: `Samples [${cluster.length}]`,
            time: 0,
            x: undefined,
            y: undefined,
            fx: null,
            fy: null
        });
    }

    // Build result nodes
    const resultNodes = [
        ...nodes.filter(n => !clusteredSampleIds.has(n.id)),
        ...sampleClusterNodes
    ];

    // Remap edges
    const sampleToClusterMap = new Map<number, number>();
    for (const cn of sampleClusterNodes) {
        for (const sampleId of cn.cluster_nodes!) {
            sampleToClusterMap.set(sampleId, cn.id);
        }
    }

    const remappedEdges: GraphEdge[] = [];
    const edgeSet = new Set<string>();

    for (const edge of edges) {
        const sourceId = getEdgeId(edge, 'source');
        const targetId = getEdgeId(edge, 'target');

        if (clusteredSampleIds.has(sourceId) && clusteredSampleIds.has(targetId)) continue;

        const mappedSourceId = sampleToClusterMap.get(sourceId) ?? sourceId;
        const mappedTargetId = sampleToClusterMap.get(targetId) ?? targetId;

        if (mappedSourceId === mappedTargetId) continue;

        const edgeKey = `${mappedSourceId}-${mappedTargetId}`;
        if (edgeSet.has(edgeKey)) continue;
        edgeSet.add(edgeKey);

        remappedEdges.push({
            source: mappedSourceId,
            target: mappedTargetId,
            left: edge.left,
            right: edge.right,
            bounds: edge.bounds,
            region_fraction: edge.region_fraction,
            has_mutations: edge.has_mutations,
            mutations: edge.mutations || []
        });
    }

    // Validate edges
    const resultNodeIds = new Set(resultNodes.map(n => n.id));
    const validatedEdges = remappedEdges.filter(edge => {
        const sourceId = getEdgeId(edge, 'source');
        const targetId = getEdgeId(edge, 'target');
        return resultNodeIds.has(sourceId) && resultNodeIds.has(targetId);
    });

    return { nodes: resultNodes, edges: validatedEdges };
}

// ── Edge cluster info helper ────────────────────────────────────────────────

export function getEdgeClusterInfo(d: GraphEdge, combinedNodes: GraphNode[]) {
    const source = typeof d.source === 'number' ? combinedNodes.find(n => n.id === d.source) : d.source as GraphNode;
    const target = typeof d.target === 'number' ? combinedNodes.find(n => n.id === d.target) : d.target as GraphNode;
    const isSampleClusterEdge = source?.is_sample_cluster || target?.is_sample_cluster;
    const clusterSize = source?.is_sample_cluster ? (source.cluster_size || 1) : (target?.cluster_size || 1);
    return { source, target, isSampleClusterEdge, clusterSize };
}
