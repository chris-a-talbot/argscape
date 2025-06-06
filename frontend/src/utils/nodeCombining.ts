import { GraphNode, GraphEdge } from '../components/ForceDirectedGraph/ForceDirectedGraph.types';

/**
 * Check if two nodes have identical relationships and location
 */
function haveIdenticalRelationshipsAndLocation(node1: GraphNode, node2: GraphNode, edges: GraphEdge[]): boolean {
  // Must have identical spatial location
  if (!node1.location || !node2.location) return false;
  if (node1.location.x !== node2.location.x || node1.location.y !== node2.location.y) return false;
  
  // Get connected edges for both nodes
  const edges1 = edges.filter(e => {
    const sourceId = typeof e.source === 'number' ? e.source : e.source.id;
    const targetId = typeof e.target === 'number' ? e.target : e.target.id;
    return sourceId === node1.id || targetId === node1.id;
  });
  
  const edges2 = edges.filter(e => {
    const sourceId = typeof e.source === 'number' ? e.source : e.source.id;
    const targetId = typeof e.target === 'number' ? e.target : e.target.id;
    return sourceId === node2.id || targetId === node2.id;
  });
  
  if (edges1.length !== edges2.length) return false;
  
  // Create sets of connected node IDs for both nodes
  const connectedNodes1 = new Set<number>();
  const connectedNodes2 = new Set<number>();
  
  edges1.forEach(e => {
    const sourceId = typeof e.source === 'number' ? e.source : e.source.id;
    const targetId = typeof e.target === 'number' ? e.target : e.target.id;
    if (sourceId !== node1.id) connectedNodes1.add(sourceId);
    if (targetId !== node1.id) connectedNodes1.add(targetId);
  });
  
  edges2.forEach(e => {
    const sourceId = typeof e.source === 'number' ? e.source : e.source.id;
    const targetId = typeof e.target === 'number' ? e.target : e.target.id;
    if (sourceId !== node2.id) connectedNodes2.add(sourceId);
    if (targetId !== node2.id) connectedNodes2.add(targetId);
  });
  
  // Check if the sets are identical
  if (connectedNodes1.size !== connectedNodes2.size) return false;
  for (const id of connectedNodes1) {
    if (!connectedNodes2.has(id)) return false;
  }
  return true;
}

/**
 * Combine nodes with identical time, relationships, and location
 * NEVER combines sample nodes - they represent actual samples and should always be distinct
 */
export function combineIdenticalNodes(nodes: GraphNode[], edges: GraphEdge[]): { nodes: GraphNode[], edges: GraphEdge[] } {
  const processedNodes = new Set<number>();
  const newNodes: GraphNode[] = [];
  const newEdges: GraphEdge[] = [];
  const nodeMap = new Map<number, number>(); // Maps old node IDs to new combined node IDs
  
  // First pass: identify nodes to combine
  for (let i = 0; i < nodes.length; i++) {
    if (processedNodes.has(nodes[i].id)) continue;
    
    const node1 = nodes[i];
    const identicalNodes: GraphNode[] = [node1];
    
    // NEVER combine sample nodes - they represent actual samples and should always be distinct
    if (node1.is_sample) {
      newNodes.push(node1);
      nodeMap.set(node1.id, node1.id);
      processedNodes.add(node1.id);
      continue;
    }
    
    // Find all nodes with identical time, relationships, and location (only for non-sample nodes)
    for (let j = i + 1; j < nodes.length; j++) {
      const node2 = nodes[j];
      if (processedNodes.has(node2.id)) continue;
      
      // Skip if either node is a sample node - samples should never be combined
      if (node2.is_sample) continue;
      
      if (node1.time === node2.time && 
          node1.is_sample === node2.is_sample && 
          haveIdenticalRelationshipsAndLocation(node1, node2, edges)) {
        identicalNodes.push(node2);
        processedNodes.add(node2.id);
      }
    }
    
    if (identicalNodes.length > 1) {
      // Create a combined node
      const combinedNode: GraphNode = {
        ...node1,
        id: node1.id, // Use the first node's ID
        is_combined: true,
        combined_nodes: identicalNodes.map(n => n.id)
      };
      newNodes.push(combinedNode);
      
      // Map all combined node IDs to the new combined node ID
      identicalNodes.forEach(n => nodeMap.set(n.id, combinedNode.id));
    } else {
      newNodes.push(node1);
      nodeMap.set(node1.id, node1.id);
    }
    
    processedNodes.add(node1.id);
  }
  
  // Second pass: update edges to use new node IDs and remove duplicates
  const edgeSet = new Set<string>();
  edges.forEach(edge => {
    const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
    const targetId = typeof edge.target === 'number' ? edge.target : edge.target.id;
    
    const newSourceId = nodeMap.get(sourceId);
    const newTargetId = nodeMap.get(targetId);
    
    if (newSourceId !== undefined && newTargetId !== undefined && newSourceId !== newTargetId) {
      // Create a unique key for this edge to avoid duplicates
      const edgeKey = `${Math.min(newSourceId, newTargetId)}-${Math.max(newSourceId, newTargetId)}`;
      if (!edgeSet.has(edgeKey)) {
        edgeSet.add(edgeKey);
        newEdges.push({
          ...edge,
          source: newSourceId,
          target: newTargetId
        });
      }
    }
  });
  
  return { nodes: newNodes, edges: newEdges };
} 