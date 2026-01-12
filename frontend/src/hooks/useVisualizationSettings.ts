import { useState, useEffect, useRef, useCallback } from 'react';
import { NodeSizeSettings, NodeIdSettings, EdgeLabelSettings, EdgeMutationSettings, TemporalSpacingMode } from '../components/visualizations/ForceDirectedGraph/ForceDirectedGraph.types';

export interface VisualizationSettings {
    nodeSizes: NodeSizeSettings;
    nodeIdSettings: NodeIdSettings;
    edgeLabelSettings: EdgeLabelSettings;
    edgeMutationSettings: EdgeMutationSettings;
    edgeThickness: number;
    edgeOpacity: number;
    temporalSpacingMode: TemporalSpacingMode;
    temporalSpacing: number;
    sampleSpacing: number;
    colorByPopulation: boolean;
}

export interface VisualizationSettingsActions {
    setNodeSizes: (sizes: NodeSizeSettings) => void;
    setNodeIdSettings: (settings: NodeIdSettings) => void;
    setEdgeLabelSettings: (settings: EdgeLabelSettings) => void;
    setEdgeMutationSettings: (settings: EdgeMutationSettings) => void;
    setEdgeThickness: (thickness: number) => void;
    setEdgeOpacity: (opacity: number) => void;
    setTemporalSpacingMode: (mode: TemporalSpacingMode) => void;
    setTemporalSpacing: (spacing: number) => void;
    setSampleSpacing: (spacing: number) => void;
    setColorByPopulation: (enabled: boolean) => void;
}

export interface UseVisualizationSettingsResult extends VisualizationSettings, VisualizationSettingsActions {
    visualSettings: VisualizationSettings;
    setVisualSettings: (settings: VisualizationSettings | ((prev: VisualizationSettings) => VisualizationSettings)) => void;
}

const DEFAULT_NODE_SIZES: NodeSizeSettings = {
    sample: 12,
    root: 10,
    other: 8
};

const DEFAULT_NODE_ID_SETTINGS: NodeIdSettings = {
    showSampleIds: true,
    showRootIds: true,
    showInternalIds: false
};

const DEFAULT_EDGE_LABEL_SETTINGS: EdgeLabelSettings = {
    showEdgeLabels: false,
    labelFontSize: 14
};

const DEFAULT_EDGE_MUTATION_SETTINGS: EdgeMutationSettings = {
    showMutationMarkers: true,
    markerSize: 40
};

const DEFAULT_VISUAL_SETTINGS: VisualizationSettings = {
    nodeSizes: DEFAULT_NODE_SIZES,
    nodeIdSettings: DEFAULT_NODE_ID_SETTINGS,
    edgeLabelSettings: DEFAULT_EDGE_LABEL_SETTINGS,
    edgeMutationSettings: DEFAULT_EDGE_MUTATION_SETTINGS,
    edgeThickness: 2.5,
    edgeOpacity: 95,
    temporalSpacingMode: 'equal' as TemporalSpacingMode,
    temporalSpacing: 14,
    sampleSpacing: 40,
    colorByPopulation: false
};

export const useVisualizationSettings = (): UseVisualizationSettingsResult => {
    const [visualSettings, setVisualSettings] = useState<VisualizationSettings>(DEFAULT_VISUAL_SETTINGS);

    // Destructure for easier access
    const {
        nodeSizes,
        nodeIdSettings,
        edgeLabelSettings,
        edgeMutationSettings,
        edgeThickness,
        edgeOpacity,
        temporalSpacingMode,
        temporalSpacing,
        sampleSpacing,
        colorByPopulation
    } = visualSettings;

    // Effect to trigger simulation reset when sampleSpacing changes
    // This ensures horizontal spacing is recalculated and simulation re-initialized
    const prevSampleSpacingRef = useRef<number | undefined>(undefined);
    useEffect(() => {
        // Only trigger if sampleSpacing actually changed (not on initial mount)
        if (prevSampleSpacingRef.current === undefined) {
            prevSampleSpacingRef.current = sampleSpacing;
            return;
        }

        if (prevSampleSpacingRef.current === sampleSpacing) return;

        // Update ref for next comparison
        prevSampleSpacingRef.current = sampleSpacing;

        // Note: resetTrigger logic should be handled by parent component
    }, [sampleSpacing]);

    // Individual setters that update the full settings object
    const setNodeSizes = useCallback((sizes: NodeSizeSettings) => {
        setVisualSettings(prev => ({ ...prev, nodeSizes: sizes }));
    }, []);

    const setNodeIdSettings = useCallback((settings: NodeIdSettings) => {
        setVisualSettings(prev => ({ ...prev, nodeIdSettings: settings }));
    }, []);

    const setEdgeLabelSettings = useCallback((settings: EdgeLabelSettings) => {
        setVisualSettings(prev => ({ ...prev, edgeLabelSettings: settings }));
    }, []);

    const setEdgeMutationSettings = useCallback((settings: EdgeMutationSettings) => {
        setVisualSettings(prev => ({ ...prev, edgeMutationSettings: settings }));
    }, []);

    const setEdgeThickness = useCallback((thickness: number) => {
        setVisualSettings(prev => ({ ...prev, edgeThickness: thickness }));
    }, []);

    const setEdgeOpacity = useCallback((opacity: number) => {
        setVisualSettings(prev => ({ ...prev, edgeOpacity: opacity }));
    }, []);

    const setTemporalSpacingMode = useCallback((mode: TemporalSpacingMode) => {
        setVisualSettings(prev => ({ ...prev, temporalSpacingMode: mode }));
    }, []);

    const setTemporalSpacing = useCallback((spacing: number) => {
        setVisualSettings(prev => ({ ...prev, temporalSpacing: spacing }));
    }, []);

    const setSampleSpacing = useCallback((spacing: number) => {
        setVisualSettings(prev => ({ ...prev, sampleSpacing: spacing }));
    }, []);

    const setColorByPopulation = useCallback((enabled: boolean) => {
        setVisualSettings(prev => ({ ...prev, colorByPopulation: enabled }));
    }, []);

    return {
        // State
        nodeSizes,
        nodeIdSettings,
        edgeLabelSettings,
        edgeMutationSettings,
        edgeThickness,
        edgeOpacity,
        temporalSpacingMode,
        temporalSpacing,
        sampleSpacing,
        colorByPopulation,
        visualSettings,

        // Actions
        setNodeSizes,
        setNodeIdSettings,
        setEdgeLabelSettings,
        setEdgeMutationSettings,
        setEdgeThickness,
        setEdgeOpacity,
        setTemporalSpacingMode,
        setTemporalSpacing,
        setSampleSpacing,
        setColorByPopulation,
        setVisualSettings,
    };
};
