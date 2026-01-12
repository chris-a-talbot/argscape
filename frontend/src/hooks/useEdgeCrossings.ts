import { useState, useCallback, useEffect } from 'react';
import { GraphData } from '../components/visualizations/ForceDirectedGraph/ForceDirectedGraph.types';

export interface EdgeCrossingsControls {
    edgeCrossings: number | null;
    isCalculatingEdgeCrossings: boolean;
    setEdgeCrossings: (count: number | null) => void;
    setIsCalculatingEdgeCrossings: (calculating: boolean) => void;
    handleEdgeCrossingsChange: (count: number) => void;
}

export const useEdgeCrossings = (data: GraphData | null): EdgeCrossingsControls => {
    const [edgeCrossings, setEdgeCrossings] = useState<number | null>(null);
    const [isCalculatingEdgeCrossings, setIsCalculatingEdgeCrossings] = useState(false);

    // Set calculating state when data changes
    useEffect(() => {
        if (data) {
            setIsCalculatingEdgeCrossings(true);
        }
    }, [data]);

    const handleEdgeCrossingsChange = useCallback((count: number) => {
        setEdgeCrossings(count);
        setIsCalculatingEdgeCrossings(false);
    }, []);

    return {
        edgeCrossings,
        isCalculatingEdgeCrossings,
        setEdgeCrossings,
        setIsCalculatingEdgeCrossings,
        handleEdgeCrossingsChange,
    };
};
