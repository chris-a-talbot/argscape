import { useState, useRef, useEffect, useCallback } from 'react';
import { SampleOrderType } from '../components/visualizations/ForceDirectedGraph/ForceDirectedGraph.types';

export interface ClusteringState {
    enabled: boolean;
    minTreeSize: number;
    requireDensity: boolean;
    densityIntensity: number;
    requireTemporalCompactness: boolean;
    temporalIntensity: number;
    maxSampleClusterSize: number;
}

export interface ClusteringActions {
    setClusteringEnabled: (enabled: boolean) => void;
    setClusteringMinTreeSize: (size: number) => void;
    setClusteringRequireDensity: (require: boolean) => void;
    setClusteringDensityIntensity: (intensity: number) => void;
    setClusteringRequireTemporalCompactness: (require: boolean) => void;
    setClusteringTemporalIntensity: (intensity: number) => void;
    setClusteringMaxSampleClusterSize: (size: number) => void;
    handleClusteringEnabledChange: (enabled: boolean) => void;
}

export interface SavedClusteringState extends ClusteringState {}

export interface UseClusteringStateResult extends ClusteringState, ClusteringActions {
    initialized: boolean;
    wasAutoEnabled: boolean;
    showAutoClusteringNotification: boolean;
    setShowAutoClusteringNotification: (show: boolean) => void;
    savedClusteringState: SavedClusteringState | null;
    setSavedClusteringState: (state: SavedClusteringState | null) => void;
    saveClusteringStateIfNeeded: () => void;
    restoreClusteringStateIfNeeded: () => void;
}

export const useClusteringState = (
    searchParams: URLSearchParams,
    treeSequence: any,
    viewMode: 'full' | 'subgraph' | 'ancestors',
    sampleOrder: SampleOrderType,
    data: any
): UseClusteringStateResult => {
    // Initialize clustering state - OFF by default, only enabled via URL param
    const [clusteringEnabled, setClusteringEnabled] = useState(() => {
        const clusteringParam = searchParams.get('clustering');
        return clusteringParam === 'true';
    });

    const [clusteringMinTreeSize, setClusteringMinTreeSize] = useState(() => {
        const clusteringParam = searchParams.get('clustering');
        return clusteringParam === 'true' ? 2 : 3;
    });

    const [clusteringRequireDensity, setClusteringRequireDensity] = useState(() => {
        const clusteringParam = searchParams.get('clustering');
        return clusteringParam === 'true';
    });

    const [clusteringDensityIntensity, setClusteringDensityIntensity] = useState(() => {
        const clusteringParam = searchParams.get('clustering');
        return clusteringParam === 'true' ? 0.05 : 0.5;
    });

    const [clusteringRequireTemporalCompactness, setClusteringRequireTemporalCompactness] = useState(true);

    const [clusteringTemporalIntensity, setClusteringTemporalIntensity] = useState(() => {
        const clusteringParam = searchParams.get('clustering');
        return clusteringParam === 'true' ? 0.25 : 0.5;
    });

    const [clusteringMaxSampleClusterSize, setClusteringMaxSampleClusterSize] = useState(25);

    // Track if clustering has been initialized
    const [initialized, _setInitialized] = useState(() => {
        const clusteringParam = searchParams.get('clustering');
        return clusteringParam === 'true';
    });

    // Track if clustering was auto-enabled (for opening the panel by default)
    const [wasAutoEnabled, _setWasAutoEnabled] = useState(false);

    // Track if we should show notification about auto-enabled clustering
    const [showAutoClusteringNotification, setShowAutoClusteringNotification] = useState(false);

    // Store clustering state before viewing subARG (to restore later)
    const [savedClusteringState, setSavedClusteringState] = useState<SavedClusteringState | null>(null);

    // Track previous clustering settings to detect changes
    const prevClusteringSettings = useRef({
        enabled: clusteringEnabled,
        minTreeSize: clusteringMinTreeSize,
        requireDensity: clusteringRequireDensity,
        densityIntensity: clusteringDensityIntensity,
        requireTemporalCompactness: clusteringRequireTemporalCompactness,
        temporalIntensity: clusteringTemporalIntensity,
        maxSampleClusterSize: clusteringMaxSampleClusterSize
    });

    // Reset layout when clustering settings change to ensure proper sample/cluster placement
    // This prevents overlapping nodes and ensures correct positioning in dagre mode
    // Only trigger after initialization is complete to avoid interfering with initial load
    useEffect(() => {
        // Don't trigger during initialization
        if (!initialized) {
            // Update the ref to current values for future comparisons
            prevClusteringSettings.current = {
                enabled: clusteringEnabled,
                minTreeSize: clusteringMinTreeSize,
                requireDensity: clusteringRequireDensity,
                densityIntensity: clusteringDensityIntensity,
                requireTemporalCompactness: clusteringRequireTemporalCompactness,
                temporalIntensity: clusteringTemporalIntensity,
                maxSampleClusterSize: clusteringMaxSampleClusterSize
            };
            return;
        }

        const prev = prevClusteringSettings.current;
        const hasChanged =
            prev.enabled !== clusteringEnabled ||
            prev.minTreeSize !== clusteringMinTreeSize ||
            prev.requireDensity !== clusteringRequireDensity ||
            prev.densityIntensity !== clusteringDensityIntensity ||
            prev.requireTemporalCompactness !== clusteringRequireTemporalCompactness ||
            prev.temporalIntensity !== clusteringTemporalIntensity ||
            prev.maxSampleClusterSize !== clusteringMaxSampleClusterSize;

        if (hasChanged && data) {
            console.log('Clustering settings changed:', {
                enabled: `${prev.enabled} → ${clusteringEnabled}`,
                minTreeSize: `${prev.minTreeSize} → ${clusteringMinTreeSize}`,
                requireDensity: `${prev.requireDensity} → ${clusteringRequireDensity}`,
                densityIntensity: `${prev.densityIntensity} → ${clusteringDensityIntensity}`,
                requireTemporalCompactness: `${prev.requireTemporalCompactness} → ${clusteringRequireTemporalCompactness}`,
                temporalIntensity: `${prev.temporalIntensity} → ${clusteringTemporalIntensity}`
            });
            // For dagre mode, don't trigger reset - the main rendering effect will handle position recalculation
            // For non-dagre modes, trigger reset to recalculate sample spacing
            if (sampleOrder !== 'dagre') {
                console.log('Triggering layout reset - this will recalculate sample spacing');
                // Note: resetTrigger logic should be handled by the parent component
            } else {
                console.log('Clustering changed in dagre mode - main rendering effect will handle position recalculation');
            }

            // Update the ref for next comparison
            prevClusteringSettings.current = {
                enabled: clusteringEnabled,
                minTreeSize: clusteringMinTreeSize,
                requireDensity: clusteringRequireDensity,
                densityIntensity: clusteringDensityIntensity,
                requireTemporalCompactness: clusteringRequireTemporalCompactness,
                temporalIntensity: clusteringTemporalIntensity,
                maxSampleClusterSize: clusteringMaxSampleClusterSize
            };
        }
    }, [
        clusteringEnabled,
        clusteringMinTreeSize,
        clusteringRequireDensity,
        clusteringDensityIntensity,
        clusteringRequireTemporalCompactness,
        clusteringTemporalIntensity,
        clusteringMaxSampleClusterSize,
        initialized,
        data,
        sampleOrder
    ]);

    // Helper function to save clustering state when leaving full view
    const saveClusteringStateIfNeeded = useCallback(() => {
        // Only save if we're in full view and haven't saved yet
        if (viewMode === 'full' && !savedClusteringState) {
            setSavedClusteringState({
                enabled: clusteringEnabled,
                minTreeSize: clusteringMinTreeSize,
                requireDensity: clusteringRequireDensity,
                densityIntensity: clusteringDensityIntensity,
                requireTemporalCompactness: clusteringRequireTemporalCompactness,
                temporalIntensity: clusteringTemporalIntensity,
                maxSampleClusterSize: clusteringMaxSampleClusterSize
            });
        }
    }, [
        viewMode,
        savedClusteringState,
        clusteringEnabled,
        clusteringMinTreeSize,
        clusteringRequireDensity,
        clusteringDensityIntensity,
        clusteringRequireTemporalCompactness,
        clusteringTemporalIntensity,
        clusteringMaxSampleClusterSize
    ]);

    // Helper function to restore clustering state when returning to full view
    const restoreClusteringStateIfNeeded = useCallback(() => {
        if (savedClusteringState) {
            setClusteringEnabled(savedClusteringState.enabled);
            setClusteringMinTreeSize(savedClusteringState.minTreeSize);
            setClusteringRequireDensity(savedClusteringState.requireDensity);
            setClusteringDensityIntensity(savedClusteringState.densityIntensity);
            setClusteringRequireTemporalCompactness(savedClusteringState.requireTemporalCompactness);
            setClusteringTemporalIntensity(savedClusteringState.temporalIntensity);
            setClusteringMaxSampleClusterSize(savedClusteringState.maxSampleClusterSize);
            setSavedClusteringState(null);
        }
    }, [savedClusteringState]);

    // Handler for when clustering is enabled/disabled from within the visualizer
    // Sets temporal intensity to 40% when enabled by user interaction
    const handleClusteringEnabledChange = useCallback((enabled: boolean) => {
        if (enabled && !clusteringEnabled) {
            // User just enabled clustering - set temporal intensity to 40%
            setClusteringTemporalIntensity(0.40);
        }
        setClusteringEnabled(enabled);
    }, [clusteringEnabled]);

    return {
        // State
        enabled: clusteringEnabled,
        minTreeSize: clusteringMinTreeSize,
        requireDensity: clusteringRequireDensity,
        densityIntensity: clusteringDensityIntensity,
        requireTemporalCompactness: clusteringRequireTemporalCompactness,
        temporalIntensity: clusteringTemporalIntensity,
        maxSampleClusterSize: clusteringMaxSampleClusterSize,
        initialized,
        wasAutoEnabled,
        showAutoClusteringNotification,
        savedClusteringState,

        // Actions
        setClusteringEnabled,
        setClusteringMinTreeSize,
        setClusteringRequireDensity,
        setClusteringDensityIntensity,
        setClusteringRequireTemporalCompactness,
        setClusteringTemporalIntensity,
        setClusteringMaxSampleClusterSize,
        setShowAutoClusteringNotification,
        setSavedClusteringState,
        saveClusteringStateIfNeeded,
        restoreClusteringStateIfNeeded,
        handleClusteringEnabledChange,
    };
};
