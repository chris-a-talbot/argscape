import { GraphNode, GraphEdge } from '../components/ForceDirectedGraph/ForceDirectedGraph.types';

// Helper function to get all descendants of a node
export const getDescendants = (node: GraphNode, nodes: GraphNode[], edges: GraphEdge[]): Set<number> => {
  const descendants = new Set<number>();
  const visited = new Set<number>();
  const queue = [node.id];
  
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
export const getAncestors = (node: GraphNode, nodes: GraphNode[], edges: GraphEdge[]): Set<number> => {
  const ancestors = new Set<number>();
  const visited = new Set<number>();
  const queue = [node.id];
  
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

// Helper function to check if a node is a root node (has children but no parents)
export const isRootNode = (node: GraphNode, nodes: GraphNode[], edges: GraphEdge[]): boolean => {
  // Check for incoming edges (parents)
  const hasParents = edges.some(e => {
    const targetId = typeof e.target === 'number' ? e.target : e.target.id;
    return targetId === node.id;
  });

  // Check for outgoing edges (children)  
  const hasChildren = edges.some(e => {
    const sourceId = typeof e.source === 'number' ? e.source : e.source.id;
    return sourceId === node.id;
  });

  // A root node has children but no parents
  return !hasParents && hasChildren;
};

// Helper function to filter graph data based on node set
export const filterGraphData = (
  originalNodes: GraphNode[],
  originalEdges: GraphEdge[],
  nodeIds: Set<number>
) => {
  const filteredNodes = originalNodes.filter(node => nodeIds.has(node.id));
  const filteredEdges = originalEdges.filter(edge => {
    const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id;
    const targetId = typeof edge.target === 'number' ? edge.target : edge.target.id;
    return nodeIds.has(sourceId) && nodeIds.has(targetId);
  });

  return { nodes: filteredNodes, edges: filteredEdges };
}; 