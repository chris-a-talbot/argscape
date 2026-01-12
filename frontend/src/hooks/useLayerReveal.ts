import { useState, useEffect, useCallback } from 'react';
import { GraphData } from '../components/visualizations/ForceDirectedGraph/ForceDirectedGraph.types';

export interface LayerRevealState {
    isPlaying: boolean;
    rate: number; // layers per second
    mode: 'hide' | 'fade';
    currentProgress: number; // 0 to 1
    initialTarget: [number, number]; // Store initial camera position
    simulationPaused: boolean; // Track if simulation should be paused
}

export interface LayerRevealActions {
    setIsPlaying: (playing: boolean) => void;
    setRate: (rate: number) => void;
    setMode: (mode: 'hide' | 'fade') => void;
    setCurrentProgress: (progress: number) => void;
    setInitialTarget: (target: [number, number]) => void;
    setSimulationPaused: (paused: boolean) => void;
    startReveal: (temporalState: { minTime: number; maxTime: number }) => void;
    pauseReveal: () => void;
    resetReveal: () => void;
}

export interface UseLayerRevealResult extends LayerRevealState, LayerRevealActions {}

export const useLayerReveal = (
    data: GraphData | null,
    temporalState: { isActive: boolean; minTime: number; maxTime: number; range: [number, number] },
    setTemporalState: (state: { isActive: boolean; minTime: number; maxTime: number; range: [number, number] } | ((prev: any) => any)) => void
): UseLayerRevealResult => {
    const [layerReveal, setLayerReveal] = useState<LayerRevealState>({
        isPlaying: false,
        rate: 2.0,
        mode: 'hide',
        currentProgress: 0,
        initialTarget: [0, 0],
        simulationPaused: false
    });

    // Layer-by-layer reveal effect
    useEffect(() => {
        if (!layerReveal.isPlaying || !data || !temporalState.isActive) return;

        // Get unique times from the data (sorted)
        const uniqueTimes = Array.from(new Set(data.nodes.map(node => node.time))).sort((a, b) => a - b);
        const numLayers = uniqueTimes.length;

        if (numLayers === 0) return;

        // Calculate time between layers based on rate (layers per second)
        const msPerLayer = 1000 / layerReveal.rate;

        // Start from the current progress
        const startLayerIndex = Math.floor(layerReveal.currentProgress * numLayers);
        let currentLayerIndex = startLayerIndex;

        // Set initial layer
        if (currentLayerIndex < numLayers) {
            setTemporalState(prev => ({
                ...prev,
                range: [temporalState.minTime, uniqueTimes[currentLayerIndex]]
            }));
        }

        const interval = setInterval(() => {
            currentLayerIndex++;

            if (currentLayerIndex >= numLayers) {
                // Animation complete - resume simulation
                clearInterval(interval);
                setLayerReveal(prev => ({
                    ...prev,
                    isPlaying: false,
                    currentProgress: 1,
                    simulationPaused: false // Signal to resume simulation
                }));
                setTemporalState(prev => ({
                    ...prev,
                    range: [temporalState.minTime, temporalState.maxTime]
                }));
            } else {
                // Update to next layer
                const progress = currentLayerIndex / numLayers;
                setLayerReveal(prev => ({
                    ...prev,
                    currentProgress: progress
                }));
                setTemporalState(prev => ({
                    ...prev,
                    range: [temporalState.minTime, uniqueTimes[currentLayerIndex]]
                }));
            }
        }, msPerLayer);

        return () => {
            clearInterval(interval);
            // If layer reveal is interrupted, resume simulation
            setLayerReveal(prev => ({
                ...prev,
                simulationPaused: false
            }));
        };
    }, [layerReveal.isPlaying, layerReveal.rate, data, temporalState.isActive, temporalState.minTime, temporalState.maxTime, setTemporalState]);

    const startReveal = useCallback((temporalStateParam: { minTime: number; maxTime: number }) => {
        if (!temporalState.isActive) {
            // Auto-enable temporal filter if not already active
            setTemporalState(prev => ({ ...prev, isActive: true }));
        }
        setLayerReveal(prev => ({
            ...prev,
            isPlaying: true,
            currentProgress: 0,
            simulationPaused: true // Pause simulation during reveal
        }));
        // Reset to show only oldest layer
        setTemporalState(prev => ({
            ...prev,
            range: [temporalStateParam.minTime, temporalStateParam.minTime]
        }));
    }, [temporalState.isActive, setTemporalState]);

    const pauseReveal = useCallback(() => {
        setLayerReveal(prev => ({ ...prev, isPlaying: false, simulationPaused: false }));
    }, []);

    const resetReveal = useCallback(() => {
        setLayerReveal(prev => ({
            ...prev,
            isPlaying: false,
            currentProgress: 0,
            simulationPaused: false
        }));
        setTemporalState(prev => ({
            ...prev,
            range: [temporalState.minTime, temporalState.minTime]
        }));
    }, [temporalState.minTime, setTemporalState]);

    return {
        // State
        isPlaying: layerReveal.isPlaying,
        rate: layerReveal.rate,
        mode: layerReveal.mode,
        currentProgress: layerReveal.currentProgress,
        initialTarget: layerReveal.initialTarget,
        simulationPaused: layerReveal.simulationPaused,

        // Actions
        setIsPlaying: (playing: boolean) => setLayerReveal(prev => ({ ...prev, isPlaying: playing })),
        setRate: (rate: number) => setLayerReveal(prev => ({ ...prev, rate })),
        setMode: (mode: 'hide' | 'fade') => setLayerReveal(prev => ({ ...prev, mode })),
        setCurrentProgress: (progress: number) => setLayerReveal(prev => ({ ...prev, currentProgress: progress })),
        setInitialTarget: (target: [number, number]) => setLayerReveal(prev => ({ ...prev, initialTarget: target })),
        setSimulationPaused: (paused: boolean) => setLayerReveal(prev => ({ ...prev, simulationPaused: paused })),
        startReveal,
        pauseReveal,
        resetReveal,
    };
};
