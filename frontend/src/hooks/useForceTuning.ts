import { useState } from 'react';
import { ForceTuningSettings } from '../components/visualizations/ForceDirectedGraph/ForceDirectedGraph.types';

const DEFAULT_FORCE_TUNING: ForceTuningSettings = {
    chargeScale: 1,
    linkStrengthScale: 0.4,
    xStrengthScale: 4,
    yStrengthScale: 1,
    collisionRadiusScale: 1.1,
    collisionStrength: 0.7,
    edgeCrossingScale: 1,
    edgeBundlingScale: 1,
    descendantRangeScale: 1,
};

export interface ForceTuningControls {
    forceTuning: ForceTuningSettings;
    setForceTuning: (settings: ForceTuningSettings | ((prev: ForceTuningSettings) => ForceTuningSettings)) => void;
}

export const useForceTuning = (): ForceTuningControls => {
    const [forceTuning, setForceTuning] = useState<ForceTuningSettings>(DEFAULT_FORCE_TUNING);

    return {
        forceTuning,
        setForceTuning,
    };
};
