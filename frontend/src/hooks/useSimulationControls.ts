import { useState, useCallback } from 'react';

export interface SimulationControls {
    // State
    manualSimulationPaused: boolean;
    unpinTrigger: number;
    resetTrigger: number;

    // Actions
    setManualSimulationPaused: (paused: boolean) => void;
    triggerUnpinAll: () => void;
    triggerReset: () => void;
}

export const useSimulationControls = (): SimulationControls => {
    const [manualSimulationPaused, setManualSimulationPaused] = useState(false);
    const [unpinTrigger, setUnpinTrigger] = useState(0);
    const [resetTrigger, setResetTrigger] = useState(0);

    const triggerUnpinAll = useCallback(() => {
        setUnpinTrigger(prev => prev + 1);
    }, []);

    const triggerReset = useCallback(() => {
        setResetTrigger(prev => prev + 1);
    }, []);

    return {
        manualSimulationPaused,
        unpinTrigger,
        resetTrigger,
        setManualSimulationPaused,
        triggerUnpinAll,
        triggerReset,
    };
};
