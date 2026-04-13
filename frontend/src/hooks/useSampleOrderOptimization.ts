import { useState, useRef, useEffect } from 'react';
import { api } from '../lib/api';
import { GraphData, SampleOrderType } from '../components/visualizations/ForceDirectedGraph/ForceDirectedGraph.types';
import { testSampleOrder, SampleOrderType as TestSampleOrderType } from '../utils/sampleOrderTester';

export interface SampleOrderOptimizationResult {
    isOptimizing: boolean;
    optimizeSampleOrder: (
        filename: string,
        currentData: GraphData,
        currentSampleOrder: SampleOrderType,
        apiOptions: any
    ) => Promise<{ optimizedData: GraphData; optimizedOrder: SampleOrderType }>;
}

export const useSampleOrderOptimization = (): SampleOrderOptimizationResult => {
    const [isOptimizing, setIsOptimizing] = useState(false);
    const isOptimizingRef = useRef(false);
    // Track if the component is still mounted to prevent state updates after unmount
    const isMountedRef = useRef(true);

    // Cleanup on unmount
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const optimizeSampleOrder = async (
        filename: string,
        currentData: GraphData,
        currentSampleOrder: SampleOrderType,
        apiOptions: any
    ): Promise<{ optimizedData: GraphData; optimizedOrder: SampleOrderType }> => {
        void filename;
        void apiOptions;

        // Disabled for now: returning data for a different backend-defined sample order
        // than the container/UI currently tracks can leave the 2D visualization in an
        // inconsistent state during initial load. Keep rendering deterministic until
        // the optimizer is reworked to update the owning sample-order state explicitly.
        return { optimizedData: currentData, optimizedOrder: currentSampleOrder };

        // Auto-optimize sample order for small graphs (< 500 nodes) BEFORE setting data
        // This prevents flashing between different orders
        // CRITICAL: We must fetch data for each order to test properly, since order_position
        // is set by the backend based on the sample order used
        const totalNodes = currentData.metadata.original_num_nodes || currentData.nodes.length;
        const shouldTestSampleOrder =
            totalNodes < 500 &&
            currentSampleOrder !== 'dagre' &&
            !(currentData.metadata.original_num_nodes && currentData.metadata.original_num_nodes > 250);

        if (!shouldTestSampleOrder) {
            return { optimizedData: currentData, optimizedOrder: currentSampleOrder };
        }

        // Show optimization loading state (only if still mounted)
        if (isMountedRef.current) {
            setIsOptimizing(true);
        }
        isOptimizingRef.current = true;

        try {
            // Fetch data for each order we want to test (required because order_position is backend-set)
            const ordersToTest: TestSampleOrderType[] = ['first_minlex', 'center_minlex', 'consensus_minlex'];
            const orderMap: Record<TestSampleOrderType, SampleOrderType> = {
                'first_minlex': 'first_minlex',
                'center_minlex': 'center_minlex',
                'consensus_minlex': 'consensus_minlex'
            };

            // Fetch data for all orders in parallel
            const testDataPromises = ordersToTest.map(async (testOrder) => {
                const mappedOrder = orderMap[testOrder];
                const testOptions = { ...apiOptions, sampleOrder: mappedOrder };
                const response = await api.getGraphData(filename, testOptions);
                const data = response.data as GraphData;
                return { order: testOrder, data };
            });

            const testDataResults = await Promise.all(testDataPromises);

            // Now test each order's data with its own layout
            const testResults = await Promise.all(
                testDataResults.map(async ({ order, data }) => {
                    const crossings = await testSampleOrder(data, order, {
                        maxTicks: 200, // Increased for better settling
                        reducedForces: true
                    });
                    return { order, estimatedCrossings: crossings };
                })
            );

            // Find the best order (lowest crossings)
            testResults.sort((a, b) => a.estimatedCrossings - b.estimatedCrossings);
            const bestResult = testResults[0];

            // Always use the best order if it's different
            const mappedBestOrder = orderMap[bestResult.order];

            if (mappedBestOrder !== currentSampleOrder) {
                // Use the data we already fetched for the best order
                const bestDataResult = testDataResults.find(r => r.order === bestResult.order);
                if (bestDataResult) {
                    return { optimizedData: bestDataResult.data, optimizedOrder: mappedBestOrder };
                }
            }

            // Return original if no better order found
            return { optimizedData: currentData, optimizedOrder: currentSampleOrder };
        } catch (err) {
            // Silently fail - use original data and order
            console.warn('Sample order optimization failed:', err);
            return { optimizedData: currentData, optimizedOrder: currentSampleOrder };
        } finally {
            if (isMountedRef.current) {
                setIsOptimizing(false);
            }
            isOptimizingRef.current = false;
        }
    };

    return {
        isOptimizing,
        optimizeSampleOrder
    };
};
