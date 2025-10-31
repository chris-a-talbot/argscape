import { GraphNode, GraphEdge } from '../components/visualizations/ForceDirectedGraph/ForceDirectedGraph.types';

/**
 * Diagnostic function to analyze node relationships and potential combining issues
 * Call this to understand what's happening in your data
 */
export function analyzeNodeCombining(nodes: GraphNode[], edges: GraphEdge[]): void {
  // Only log in development mode
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Node Analysis:', {
      total: nodes.length,
      samples: nodes.filter(n => n.is_sample).length,
      internal: nodes.filter(n => !n.is_sample).length
    });
  }
}

/**
 * Check if two nodes have identical parent and child relationships across the entire ARG
 * This is used to identify recombination node pairs or other nodes that represent the same event
 */
function haveIdenticalRelationships(node1: GraphNode, node2: GraphNode, edges: GraphEdge[]): boolean {
  // Get all parent and child relationships for both nodes
  const parents1 = new Set<number>();
  const parents2 = new Set<number>();
  const children1 = new Set<number>();
  const children2 = new Set<number>();
  
  edges.forEach(edge => {
    const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
    const targetId = typeof edge.target === 'number' ? edge.target : edge.target.id;
    
    // For node1
    if (targetId === node1.id) {
      parents1.add(sourceId);
    }
    if (sourceId === node1.id) {
      children1.add(targetId);
    }
    
    // For node2
    if (targetId === node2.id) {
      parents2.add(sourceId);
    }
    if (sourceId === node2.id) {
      children2.add(targetId);
    }
  });
  
  // Check if parent sets are identical
  if (parents1.size !== parents2.size) {
    return false;
  }
  for (const parentId of parents1) {
    if (!parents2.has(parentId)) {
      return false;
    }
  }
  
  // Check if children sets are identical
  if (children1.size !== children2.size) {
    return false;
  }
  for (const childId of children1) {
    if (!children2.has(childId)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Check if two nodes belong to the same individual
 */
function areSameIndividual(node1: GraphNode, node2: GraphNode): boolean {
  // Both nodes must have valid individual assignments
  if (node1.individual === -1 || node2.individual === -1) {
    return false;
  }
  
  return node1.individual === node2.individual;
}

/**
 * Get recombination node pairs using D3ARG-style detection
 * In D3ARG: rcnm = np.where(ts.nodes_flags & msprime.NODE_IS_RE_EVENT)[0][1::2]
 * This creates pairs from consecutive recombination nodes, combining the second with the first
 */
function getRecombinationNodePairs(nodes: GraphNode[]): Map<number, number> {
  const NODE_IS_RE_EVENT = 131072;
  const recombinationNodes: number[] = [];
  
  // Find all nodes with recombination flag
  nodes.forEach(node => {
    if (node.ts_flags !== undefined && (node.ts_flags & NODE_IS_RE_EVENT) !== 0) {
      recombinationNodes.push(node.id);
    }
  });
  
  // Sort by node ID
  recombinationNodes.sort((a, b) => a - b);
  
  // Create pairs: only pair consecutive flagged nodes that have identical times
  // This ensures we only combine nodes from the same recombination event
  const nodePairs = new Map<number, number>(); // Maps: nodeToReplace -> nodeToKeep
  
  for (let i = 1; i < recombinationNodes.length; i += 2) {
    const nodeToReplace = recombinationNodes[i]; // The second node in the pair
    const nodeToKeep = recombinationNodes[i - 1]; // The first node in the pair
    
    // Find the actual node objects to check their times
    const node1 = nodes.find(n => n.id === nodeToKeep);
    const node2 = nodes.find(n => n.id === nodeToReplace);
    
    // Only pair if they have identical times (same recombination event)
    if (node1 && node2 && node1.time === node2.time) {
      nodePairs.set(nodeToReplace, nodeToKeep);
    }
  }
  
  console.log(`🧬 Recombination pairs: ${recombinationNodes.length} flagged nodes → ${nodePairs.size} valid pairs`);
  if (recombinationNodes.length > 0) {
    console.log(`   Flagged nodes: [${recombinationNodes.join(', ')}]`);
    if (nodePairs.size > 0) {
      console.log(`   Valid pairs: [${Array.from(nodePairs.entries()).map(([replace, keep]) => `${replace}→${keep}`).join(', ')}]`);
    } else {
      console.log(`   ⚠️  No valid pairs (consecutive flagged nodes must have identical times)`);
    }
    
    // Debug: Show times for flagged nodes
    const nodeDetails = recombinationNodes.map(id => {
      const node = nodes.find(n => n.id === id);
      return `${id}(t=${node?.time})`;
    });
    console.log(`   Node times: [${nodeDetails.join(', ')}]`);
  }
  
  return nodePairs;
}

/**
 * Check if two nodes are a recombination pair based on the D3ARG-style pairing
 */
function areRecombinationPair(node1: GraphNode, node2: GraphNode, recombNodePairs: Map<number, number>): boolean {
  // Check if either node is mapped to the other in the recombination pairs
  const node1MapsToNode2 = recombNodePairs.get(node1.id) === node2.id;
  const node2MapsToNode1 = recombNodePairs.get(node2.id) === node1.id;
  
  return node1MapsToNode2 || node2MapsToNode1;
}

/**
 * Check if two nodes should be combined based on various criteria
 */
function shouldCombineNodes(node1: GraphNode, node2: GraphNode, edges: GraphEdge[], recombNodePairs: Map<number, number>): { shouldCombine: boolean; reason: string } {
  // Check 1: D3ARG-style recombination pairs (PRIORITY - combine regardless of relationships)
  if (areRecombinationPair(node1, node2, recombNodePairs)) {
    return { shouldCombine: true, reason: 'recombination_pair' };
  }
  
  // Check 2: Same individual (most reliable for sample nodes)
  if (areSameIndividual(node1, node2)) {
    // Same individual nodes should have same time and relationships
    if (node1.time === node2.time && haveIdenticalRelationships(node1, node2, edges)) {
      return { shouldCombine: true, reason: 'same_individual' };
    }
  }
  
  return { shouldCombine: false, reason: 'no_match' };
}

/**
 * Merge edge bounds/regions for edges with the same source and target
 */
function mergeEdgeBounds(edges: GraphEdge[]): string {
  if (edges.length === 0) return '';
  if (edges.length === 1) return edges[0].bounds || `${edges[0].left}-${edges[0].right}`;
  
  // Collect all intervals
  const intervals: [number, number][] = [];
  edges.forEach(edge => {
    if (edge.bounds) {
      // Parse existing bounds like "0-1 5-8 9-10"
      const bounds = edge.bounds.split(' ').map(bound => {
        const [left, right] = bound.split('-').map(Number);
        return [left, right] as [number, number];
      });
      intervals.push(...bounds);
    } else {
      intervals.push([edge.left, edge.right]);
    }
  });
  
  // Sort intervals by start position
  intervals.sort((a, b) => a[0] - b[0]);
  
  // Merge overlapping intervals
  const merged: [number, number][] = [];
  for (const interval of intervals) {
    if (merged.length === 0 || merged[merged.length - 1][1] < interval[0]) {
      merged.push(interval);
    } else {
      merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], interval[1]);
    }
  }
  
  // Convert back to string format
  return merged.map(([left, right]) => `${left}-${right}`).join(' ');
}

/**
 * Combine nodes that are genealogically identical (types 1 & 2)
 * This is used for force-directed graphs where visual clarity comes from genealogical relationships
 */
export function combineGenealogyIdenticalNodes(nodes: GraphNode[], edges: GraphEdge[]): { nodes: GraphNode[], edges: GraphEdge[] } {
  const processedNodes = new Set<number>();
  const newNodes: GraphNode[] = [];
  const nodeMap = new Map<number, number>(); // Maps old node IDs to new combined node IDs
  
  // Get recombination node pairs for D3ARG-style detection
  const recombNodePairs = getRecombinationNodePairs(nodes);
  
  // Sort nodes by ID to ensure consistent processing order
  const sortedNodes = [...nodes].sort((a, b) => a.id - b.id);
  
  // Debug logging only in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔗 Starting genealogical combining (${nodes.length} nodes)...`);
  }
  
  // Find groups of nodes that should be combined genealogically
  for (let i = 0; i < sortedNodes.length; i++) {
    if (processedNodes.has(sortedNodes[i].id)) continue;
    
    const node1 = sortedNodes[i];
    const combinableNodes: GraphNode[] = [node1];
    const combiningReasons: string[] = [];
    
    // Find all nodes that can be combined with this one genealogically
    for (let j = i + 1; j < sortedNodes.length; j++) {
      const node2 = sortedNodes[j];
      if (processedNodes.has(node2.id)) continue;
      
      const { shouldCombine, reason } = shouldCombineNodes(node1, node2, edges, recombNodePairs);
      
      if (shouldCombine) {
        combinableNodes.push(node2);
        combiningReasons.push(reason);
        processedNodes.add(node2.id);
      }
    }
    
    if (combinableNodes.length > 1) {
      // Create a combined node using the LESSER ID (tskit approach)
      const sortedIds = combinableNodes.map(n => n.id).sort((a, b) => a - b);
      const representativeNode = combinableNodes.find(n => n.id === sortedIds[0])!;
      
      // Debug logging only in development
      if (process.env.NODE_ENV === 'development') {
        if (combiningReasons[0] === 'recombination_pair') {
          console.log(`🧬 Combined recombination pair: ${sortedIds[0]}/${sortedIds[1]}`);
        } else {
          console.log(`🔗 Combined ${combiningReasons[0]}: ${sortedIds.join('/')}`);
        }
      }
      
      const combinedNode: GraphNode = {
        ...representativeNode,
        id: sortedIds[0], // Use the lesser ID
        is_combined: true,
        combined_nodes: sortedIds,
        label: sortedIds.join('/'), // tskit format: "id1/id2/id3"
        is_recombination: representativeNode.is_recombination,
        ts_flags: representativeNode.ts_flags,
        individual: representativeNode.individual
      };
      newNodes.push(combinedNode);
      
      // Map all combined node IDs to the new combined node ID (lesser ID)
      combinableNodes.forEach(n => nodeMap.set(n.id, combinedNode.id));
    } else {
      // Single node, just copy with a simple label
      const singleNode = {
        ...node1,
        label: node1.id.toString()
      };
      newNodes.push(singleNode);
      nodeMap.set(node1.id, node1.id);
    }
    
    processedNodes.add(node1.id);
  }
  
  console.log(`✅ Genealogical combining: ${nodes.length} → ${newNodes.length} nodes`);
  
  // Create merged edges for genealogically combined nodes
  const newEdges = createMergedEdges(edges, nodeMap);
  
  return { nodes: newNodes, edges: newEdges };
}

/**
 * Combine nodes for spatial visualization (all three types, with location-aware logic)
 * This preserves all edges while combining nodes for visual clarity
 */
export function combineSpatiallyColocatedNodes(nodes: GraphNode[], edges: GraphEdge[]): { nodes: GraphNode[], edges: GraphEdge[] } {
  // First, apply genealogical combining but ONLY for nodes with identical spatial locations
  const genealogicallyCombined = combineGenealogyIdenticalNodesWithLocationCheck(nodes, edges);
  
  // Then, apply spatial combining for remaining nodes at same locations (type 3)
  return applySpatialLocationCombining(genealogicallyCombined.nodes, genealogicallyCombined.edges);
}

/**
 * Apply genealogical combining only for nodes that also have identical spatial locations
 */
function combineGenealogyIdenticalNodesWithLocationCheck(nodes: GraphNode[], edges: GraphEdge[]): { nodes: GraphNode[], edges: GraphEdge[] } {
  const processedNodes = new Set<number>();
  const newNodes: GraphNode[] = [];
  const nodeMap = new Map<number, number>();
  
  // Get recombination node pairs for D3ARG-style detection
  const recombNodePairs = getRecombinationNodePairs(nodes);
  
  const sortedNodes = [...nodes].sort((a, b) => a.id - b.id);
  
  // Location-aware combining (internal step)
  
  for (let i = 0; i < sortedNodes.length; i++) {
    if (processedNodes.has(sortedNodes[i].id)) continue;
    
    const node1 = sortedNodes[i];
    const combinableNodes: GraphNode[] = [node1];
    
    for (let j = i + 1; j < sortedNodes.length; j++) {
      const node2 = sortedNodes[j];
      if (processedNodes.has(node2.id)) continue;
      
      const { shouldCombine, reason } = shouldCombineNodes(node1, node2, edges, recombNodePairs);
      
      // Additional check: only combine if they have identical spatial locations
      const haveSameLocation = nodesHaveIdenticalLocation(node1, node2);
      
      if (shouldCombine && haveSameLocation) {
        combinableNodes.push(node2);
        processedNodes.add(node2.id);
        // Combined nodes with same location (minimal logging)
      }
    }
    
    if (combinableNodes.length > 1) {
      const sortedIds = combinableNodes.map(n => n.id).sort((a, b) => a - b);
      const representativeNode = combinableNodes.find(n => n.id === sortedIds[0])!;
      
      const combinedNode: GraphNode = {
        ...representativeNode,
        id: sortedIds[0],
        is_combined: true,
        combined_nodes: sortedIds,
        label: sortedIds.join('/'),
        is_recombination: representativeNode.is_recombination,
        ts_flags: representativeNode.ts_flags,
        individual: representativeNode.individual
      };
      newNodes.push(combinedNode);
      combinableNodes.forEach(n => nodeMap.set(n.id, combinedNode.id));
    } else {
      const singleNode = { ...node1, label: node1.id.toString() };
      newNodes.push(singleNode);
      nodeMap.set(node1.id, node1.id);
    }
    
    processedNodes.add(node1.id);
  }
  
  const newEdges = createMergedEdges(edges, nodeMap);
  return { nodes: newNodes, edges: newEdges };
}

/**
 * Apply spatial location combining (type 3) - combine nodes at same location for visual clarity
 * This preserves ALL edges from ALL original nodes
 */
function applySpatialLocationCombining(nodes: GraphNode[], edges: GraphEdge[]): { nodes: GraphNode[], edges: GraphEdge[] } {
  const processedNodes = new Set<number>();
  const newNodes: GraphNode[] = [];
  const nodeMap = new Map<number, number>();
  
  // Spatial combining is usually minimal, so less logging needed
  
  for (let i = 0; i < nodes.length; i++) {
    if (processedNodes.has(nodes[i].id)) continue;
    
    const node1 = nodes[i];
    const colocatedNodes: GraphNode[] = [node1];
    
    // Find all other nodes at the exact same spatial location
    for (let j = i + 1; j < nodes.length; j++) {
      const node2 = nodes[j];
      if (processedNodes.has(node2.id)) continue;
      
      if (nodesHaveIdenticalLocation(node1, node2)) {
        colocatedNodes.push(node2);
        processedNodes.add(node2.id);
        // Spatially combining colocated nodes
      }
    }
    
    if (colocatedNodes.length > 1) {
      const sortedIds = colocatedNodes.map(n => n.id).sort((a, b) => a - b);
      const representativeNode = colocatedNodes.find(n => n.id === sortedIds[0])!;
      
      const combinedNode: GraphNode = {
        ...representativeNode,
        id: sortedIds[0],
        is_combined: true,
        combined_nodes: sortedIds,
        label: sortedIds.join('/'),
        // Preserve individual assignment from representative
        individual: representativeNode.individual,
        // Mark as spatially combined to distinguish from genealogical combining
        spatial_combine_only: true
      };
      newNodes.push(combinedNode);
      colocatedNodes.forEach(n => nodeMap.set(n.id, combinedNode.id));
    } else {
      const singleNode = { ...node1, label: node1.id.toString() };
      newNodes.push(singleNode);
      nodeMap.set(node1.id, node1.id);
    }
    
    processedNodes.add(node1.id);
  }
  
  // For spatial combining, we need to preserve ALL edges, not merge them
  const newEdges = createPreservedEdges(edges, nodeMap);
  return { nodes: newNodes, edges: newEdges };
}

/**
 * Check if two nodes have identical spatial locations
 */
function nodesHaveIdenticalLocation(node1: GraphNode, node2: GraphNode): boolean {
  if (!node1.location || !node2.location) return false;
  
  const SPATIAL_TOLERANCE = 1e-10; // Very small tolerance for floating point comparison
  
  return Math.abs(node1.location.x - node2.location.x) < SPATIAL_TOLERANCE &&
         Math.abs(node1.location.y - node2.location.y) < SPATIAL_TOLERANCE;
}

/**
 * Create merged edges for genealogical combining (original logic)
 */
function createMergedEdges(edges: GraphEdge[], nodeMap: Map<number, number>): GraphEdge[] {
  const edgeGroups = new Map<string, GraphEdge[]>();
  
  edges.forEach(edge => {
    const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
    const targetId = typeof edge.target === 'number' ? edge.target : edge.target.id;
    
    const newSourceId = nodeMap.get(sourceId);
    const newTargetId = nodeMap.get(targetId);
    
    if (newSourceId !== undefined && newTargetId !== undefined && newSourceId !== newTargetId) {
      const edgeKey = `${newSourceId}-${newTargetId}`;
      if (!edgeGroups.has(edgeKey)) {
        edgeGroups.set(edgeKey, []);
      }
      edgeGroups.get(edgeKey)!.push({
        ...edge,
        source: newSourceId,
        target: newTargetId
      });
    }
  });
  
  const newEdges: GraphEdge[] = [];
  edgeGroups.forEach((edgeGroup) => {
    if (edgeGroup.length === 1) {
      const edge = edgeGroup[0];
      newEdges.push({
        ...edge,
        bounds: edge.bounds || `${edge.left}-${edge.right}`
      });
    } else {
      // Multiple edges between same nodes - merge them
      const firstEdge = edgeGroup[0];
      const mergedBounds = mergeEdgeBounds(edgeGroup);
      const totalRegionFraction = edgeGroup.reduce((sum, e) => sum + (e.region_fraction || 0), 0);
      
      newEdges.push({
        ...firstEdge,
        bounds: mergedBounds,
        region_fraction: totalRegionFraction,
        left: Math.min(...edgeGroup.map(e => e.left)),
        right: Math.max(...edgeGroup.map(e => e.right))
      });
    }
  });
  
  return newEdges;
}

/**
 * Create preserved edges for spatial combining - preserve ALL edges from original nodes
 */
function createPreservedEdges(edges: GraphEdge[], nodeMap: Map<number, number>): GraphEdge[] {
  const newEdges: GraphEdge[] = [];
  
  edges.forEach(edge => {
    const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
    const targetId = typeof edge.target === 'number' ? edge.target : edge.target.id;
    
    const newSourceId = nodeMap.get(sourceId);
    const newTargetId = nodeMap.get(targetId);
    
    // Preserve edge if both nodes exist and they're not the same after combining
    if (newSourceId !== undefined && newTargetId !== undefined && newSourceId !== newTargetId) {
      newEdges.push({
        ...edge,
        source: newSourceId,
        target: newTargetId,
        bounds: edge.bounds || `${edge.left}-${edge.right}`
      });
    }
  });
  
  return newEdges;
} 