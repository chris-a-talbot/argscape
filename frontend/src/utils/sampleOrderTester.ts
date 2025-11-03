/**
 * Utility to quickly test sample orders and estimate edge crossings
 * without running full simulations. This allows pre-selection of the best
 * sample order before loading the full tree sequence.
 */

import * as d3 from 'd3';
import { GraphData, GraphNode, GraphEdge } from '../components/visualizations/ForceDirectedGraph/ForceDirectedGraph.types';
import { calculateEdgeCrossings } from '../components/visualizations/ForceDirectedGraph/ForceDirectedGraph.utils';
import { setupInitialNodePositions } from '../components/visualizations/ForceDirectedGraph/ForceDirectedGraph.constants';
import { GRAPH_CONSTANTS } from '../components/visualizations/ForceDirectedGraph/ForceDirectedGraph.constants';

export type SampleOrderType = 'first_minlex' | 'center_minlex' | 'consensus_minlex';

export interface OrderTestResult {
    order: SampleOrderType;
    estimatedCrossings: number;
    relativeScore: number; // 0-1, where 1 is best (fewest crossings)
}

/**
 * Run a minimal simulation (50-100 ticks) to estimate edge crossings
 * without waiting for full convergence. This is ~10-20x faster than full simulation.
 */
export async function testSampleOrder(
    graphData: GraphData,
    sampleOrder: SampleOrderType,
    options: {
        maxTicks?: number; // Default 75 ticks (about 1-2 seconds)
        reducedForces?: boolean; // Use reduced force strengths for speed
        width?: number;
        height?: number;
    } = {}
): Promise<number> {
    const {
        maxTicks = 200, // Increased to 200 ticks for better settling - simulations need more time
        reducedForces = true,
        width = 1200,
        height = 800
    } = options;

    // Clone nodes and edges to avoid mutating original data
    const nodes: GraphNode[] = JSON.parse(JSON.stringify(graphData.nodes));
    const edges: GraphEdge[] = JSON.parse(JSON.stringify(graphData.edges));

    // CRITICAL: Clear order_position to force re-sorting based on sampleOrder parameter
    // The backend sets order_position based on the sample order used when fetching.
    // Since we're testing different orders on the same data, we need to clear these
    // so setupInitialNodePositions will actually sort differently.
    nodes.forEach(node => {
        if (node.is_sample) {
            // Keep the ID for reference but clear order_position
            // This forces setupInitialNodePositions to use the sampleOrder parameter
            // instead of relying on pre-set order_position values
            delete node.order_position;
        }
    });

    // Setup initial positions with the given sample order
    // Since we cleared order_position, it will sort samples based on sampleOrder parameter
    setupInitialNodePositions(
        nodes,
        edges,
        width,
        height,
        sampleOrder,
        undefined, // nodeSizes - use defaults
        'equal', // temporalSpacingMode
        12, // temporalSpacing
        40, // sampleSpacing
        undefined // originalNodes
    );

    // Create a minimal simulation with slower decay for better settling
    const simulation = d3.forceSimulation<GraphNode>(nodes)
        .alpha(reducedForces ? 0.7 : GRAPH_CONSTANTS.FORCE_STRENGTH.ALPHA_START) // Higher initial alpha
        .alphaDecay(reducedForces ? 0.05 : GRAPH_CONSTANTS.FORCE_STRENGTH.ALPHA_DECAY) // Much slower decay for more settling
        .velocityDecay(0.7) // Higher velocity decay for more stable settling
        .force("link", d3.forceLink<GraphNode, GraphEdge>(edges)
            .id(d => d.id)
            .distance(d => {
                const source = typeof d.source === 'number' ? nodes.find(n => n.id === d.source) : d.source as GraphNode;
                const target = typeof d.target === 'number' ? nodes.find(n => n.id === d.target) : d.target as GraphNode;
                if (!source || !target) return 100;
                return (source.is_sample || target.is_sample) ? 80 : 60; // Shorter distances for speed
            })
            .strength(reducedForces ? 0.2 : 0.3))
        .force("charge", d3.forceManyBody()
            .strength(reducedForces ? -15 : -20)
            .distanceMax(300))
        .force("collision", d3.forceCollide<GraphNode>()
            .radius(d => {
                if (d.is_sample) return 12;
                if ((d as any).is_root) return 10;
                return 8;
            })
            .strength(0.5));

    // Run simulation for limited ticks
    return new Promise((resolve) => {
        let tickCount = 0;
        
        simulation.on("tick", () => {
            tickCount++;
            if (tickCount >= maxTicks) {
                simulation.stop();
                // Calculate crossings from current positions
                const crossings = calculateEdgeCrossings(nodes, edges);
                resolve(crossings);
            }
        });

        // Fallback: if simulation ends naturally before maxTicks, calculate crossings
        simulation.on("end", () => {
            const crossings = calculateEdgeCrossings(nodes, edges);
            resolve(crossings);
        });
    });
}

/**
 * Test multiple sample orders in parallel and return results sorted by quality.
 * This can run in a Web Worker to avoid blocking the UI.
 */
export async function testAllSampleOrders(
    graphData: GraphData,
    orders: SampleOrderType[] = ['first_minlex', 'center_minlex', 'consensus_minlex'],
    options: {
        maxTicks?: number;
        reducedForces?: boolean;
        width?: number;
        height?: number;
    } = {}
): Promise<OrderTestResult[]> {
    // Test all orders in parallel
    const results = await Promise.all(
        orders.map(async (order) => {
            const crossings = await testSampleOrder(graphData, order, options);
            return { order, estimatedCrossings: crossings, relativeScore: 0 };
        })
    );

    // Calculate relative scores (normalize so best = 1.0)
    const minCrossings = Math.min(...results.map(r => r.estimatedCrossings));
    const maxCrossings = Math.max(...results.map(r => r.estimatedCrossings));
    const range = maxCrossings - minCrossings;

    const sortedResults = results
        .map(result => ({
            ...result,
            relativeScore: range > 0 
                ? 1 - (result.estimatedCrossings - minCrossings) / range 
                : 1.0 // All equal
        }))
        .sort((a, b) => a.estimatedCrossings - b.estimatedCrossings); // Sort by crossings (ascending = best first)

    return sortedResults;
}

/**
 * Get the best sample order without loading tree sequence.
 * This uses the already-loaded graphData with different sample orderings.
 * 
 * Usage: Call this AFTER initial data load but BEFORE final visualization.
 * The initial load should use a default order (e.g., 'consensus_minlex'), then this
 * tests if a different order would be better.
 */
export async function findBestSampleOrder(
    graphData: GraphData,
    options: {
        maxTicks?: number;
        reducedForces?: boolean;
        width?: number;
        height?: number;
        timeout?: number; // Max time to wait in ms (default 5000ms)
    } = {}
): Promise<SampleOrderType | null> {
    const { timeout = 5000 } = options;

    try {
        // Run with timeout to avoid hanging
        const results = await Promise.race([
            testAllSampleOrders(graphData, ['first_minlex', 'center_minlex', 'consensus_minlex'], options),
            new Promise<OrderTestResult[]>((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), timeout)
            )
        ]) as OrderTestResult[];

        // Return the best order (first in sorted results)
        return results.length > 0 ? results[0].order : null;
    } catch (error) {
        console.warn('Sample order testing failed:', error);
        return null; // Fallback to default
    }
}

