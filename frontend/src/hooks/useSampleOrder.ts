import { useState, useCallback } from 'react';
import { SampleOrderType } from '../components/visualizations/ForceDirectedGraph/ForceDirectedGraph.types';

export interface SampleOrderControls {
    sampleOrder: SampleOrderType;
    layoutVersion: number;
    setSampleOrder: (order: SampleOrderType) => void;
    handleSampleOrderChange: (order: SampleOrderType, onCalculatingChange?: (calculating: boolean) => void) => void;
}

export const useSampleOrder = (
    initialOrder: SampleOrderType = 'consensus_minlex',
    onCalculatingChange?: (calculating: boolean) => void
): SampleOrderControls => {
    const [sampleOrder, setSampleOrder] = useState<SampleOrderType>(initialOrder);
    const [layoutVersion, setLayoutVersion] = useState(0);

    const handleSampleOrderChange = useCallback((order: SampleOrderType, calculatingCallback = onCalculatingChange) => {
        setSampleOrder(order);
        calculatingCallback?.(true);

        if (order === 'dagre') {
            setTimeout(() => {
                setLayoutVersion(prev => prev + 1);
            }, 100);
        } else {
            setLayoutVersion(prev => prev + 1);
        }
    }, [onCalculatingChange]);

    return {
        sampleOrder,
        layoutVersion,
        setSampleOrder,
        handleSampleOrderChange,
    };
};
