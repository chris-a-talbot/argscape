import React from 'react';
import { formatElapsedTime } from '../../../hooks/useElapsedTime';
import { isRailway } from '../../../config/constants';

interface LoadingStateProps {
    elapsedSeconds: number;
    isOptimizingSampleOrder?: boolean;
    colors: any;
}

export const ForceDirectedLoadingState: React.FC<LoadingStateProps> = ({
    elapsedSeconds,
    isOptimizingSampleOrder = false,
    colors
}) => {
    const elapsedTime = formatElapsedTime(elapsedSeconds);
    const showElapsedTime = elapsedSeconds > 5;
    const isLocal = !isRailway();

    return (
        <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.background }}>
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: colors.accentPrimary }}></div>
                <p style={{ color: colors.text }}>
                    {isOptimizingSampleOrder ? 'Optimizing layout...' : 'Loading force-directed ARG visualization...'}
                </p>
                {isOptimizingSampleOrder && (
                    <p className="text-sm mt-2" style={{ color: `${colors.text}99` }}>Testing sample orders for best layout</p>
                )}
                {showElapsedTime && (
                    <>
                        <p className="text-sm mt-3" style={{ color: `${colors.text}99` }}>Elapsed: {elapsedTime}</p>
                        {isLocal && elapsedSeconds > 30 && (
                            <p className="text-xs mt-2 max-w-md mx-auto" style={{ color: `${colors.text}80` }}>
                                Large datasets may take several minutes. Processing continues in the background...
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

interface ErrorStateProps {
    error: string;
    colors: any;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, colors }) => (
    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <div className="text-center" style={{ color: colors.text }}>
            <p className="text-lg mb-2">Error loading visualization</p>
            <p className="text-sm" style={{ color: `${colors.text}B3` }}>{error}</p>
        </div>
    </div>
);

interface NoDataStateProps {
    colors: any;
}

export const NoDataState: React.FC<NoDataStateProps> = ({ colors }) => (
    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <div className="text-center" style={{ color: colors.text }}>
            <p className="text-lg mb-2">No data available</p>
            <p className="text-sm" style={{ color: `${colors.text}B3` }}>The visualization data could not be loaded.</p>
        </div>
    </div>
);
