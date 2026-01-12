import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import SpatialArg3DVisualizationContainer from '../visualizations/SpatialArg3D/SpatialArg3DVisualizationContainer';
import { useTreeSequence } from '../../context/TreeSequenceContext';
import { useColorTheme } from '../../context/ColorThemeContext';
import { useRef, useEffect, useState, useMemo } from 'react';
import { ColorThemeDropdown } from '../ui/ColorThemeDropdown';
import { TreeSequenceSelectorModal } from '../ui/TreeSequenceSelectorModal';
import { SwitchVizButton } from '../ui/SwitchVizButton';
import { log } from '../../lib/logger';

import { useThemeStyles } from '../../hooks/useThemeStyles';

export default function SpatialArg3DVisualizationPage() {
    const { filename } = useParams<{ filename: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { maxSamples, setTreeSequence } = useTreeSequence();
    const { colors, setCurrentVisualizationType } = useColorTheme();
    const { navStyle } = useThemeStyles();
    const containerRef = useRef<HTMLDivElement>(null);
    const [showTreeSequenceSelector, setShowTreeSequenceSelector] = useState(false);

    // Parse URL parameters for filtering
    const urlParams = useMemo(() => {
        const params: {
            temporalStart?: number;
            temporalEnd?: number;
            genomicStart?: number;
            genomicEnd?: number;
            treeStartIdx?: number;
            treeEndIdx?: number;
            heatmapMode?: boolean;
        } = {};

        const temporalStart = searchParams.get('temporal_start');
        const temporalEnd = searchParams.get('temporal_end');
        const genomicStart = searchParams.get('genomic_start');
        const genomicEnd = searchParams.get('genomic_end');
        const treeStartIdx = searchParams.get('tree_start_idx');
        const treeEndIdx = searchParams.get('tree_end_idx');
        const heatmapMode = searchParams.get('heatmap_mode');

        if (temporalStart && temporalEnd) {
            params.temporalStart = parseFloat(temporalStart);
            params.temporalEnd = parseFloat(temporalEnd);
        }

        if (genomicStart && genomicEnd) {
            params.genomicStart = parseInt(genomicStart);
            params.genomicEnd = parseInt(genomicEnd);
        } else if (treeStartIdx && treeEndIdx) {
            params.treeStartIdx = parseInt(treeStartIdx);
            params.treeEndIdx = parseInt(treeEndIdx);
        }

        if (heatmapMode === 'true') {
            params.heatmapMode = true;
        }

        return params;
    }, [searchParams]);

    // Set visualization type when component mounts
    useEffect(() => {
        setCurrentVisualizationType('spatial-3d');
    }, [setCurrentVisualizationType]);

    if (!filename) {
        return (
            <div 
                className="min-h-screen flex flex-col items-center justify-center px-4 font-sans"
                style={{ backgroundColor: colors.background, color: colors.text }}
            >
                <h1 className="text-3xl font-bold mb-4">No filename provided</h1>
                <button 
                    className="font-bold py-2 px-6 rounded-lg mt-4 transition-colors"
                    style={{
                        backgroundColor: colors.containerBackground,
                        color: colors.text
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.accentPrimary;
                        e.currentTarget.style.color = colors.background;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = colors.containerBackground;
                        e.currentTarget.style.color = colors.text;
                    }}
                    onClick={() => navigate('/result')}
                >
                    Back to Results
                </button>
            </div>
        );
    }

    const decodedFilename = decodeURIComponent(filename);
    const currentParams = searchParams.toString();

    const handleTreeSequenceSelect = (treeSequence: any) => {
        log.user.action('switch-tree-sequence-spatial', { treeSequence }, 'SpatialArg3DVisualizationPage');
        setTreeSequence(treeSequence);
        setShowTreeSequenceSelector(false);
        // Navigate to the new tree sequence while maintaining all visualization settings
        navigate(`/spatial/${encodeURIComponent(treeSequence.filename)}${currentParams ? `?${currentParams}` : ''}`);
    };

    return (
        <div 
            className="h-screen flex flex-col overflow-hidden font-sans"
            style={{ backgroundColor: colors.background, color: colors.text }}
        >
            {/* Header */}
            <header
                className="border-b shadow-md flex-shrink-0 transition-colors duration-300 relative"
                style={{
                    backgroundColor: navStyle.backgroundColor,
                    borderBottomColor: navStyle.borderBottomColor,
                    backdropFilter: navStyle.backdropFilter,
                    WebkitBackdropFilter: navStyle.WebkitBackdropFilter,
                    zIndex: 10001,
                }}
            >
                <div className="max-w-7xl mx-auto">
                    <div className="px-4 py-2 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                            <button
                                className="inline-flex items-center gap-2 transition-colors duration-200 flex-shrink-0"
                                style={{ color: colors.accentPrimary }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.opacity = '0.8';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.opacity = '1';
                                }}
                                onClick={() => navigate('/result')}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Back
                            </button>

                            <button
                                onClick={() => setShowTreeSequenceSelector(!showTreeSequenceSelector)}
                                className="flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors flex-shrink-0 border"
                                style={{
                                    backgroundColor: colors.containerBackground,
                                    color: colors.text,
                                    borderColor: `${colors.accentPrimary}33`
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = colors.accentPrimary;
                                    e.currentTarget.style.color = colors.background;
                                    e.currentTarget.style.borderColor = colors.accentPrimary;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = colors.containerBackground;
                                    e.currentTarget.style.color = colors.text;
                                    e.currentTarget.style.borderColor = `${colors.accentPrimary}33`;
                                }}
                                title="Switch to a different tree sequence file"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                                <span>Switch File</span>
                                </button>

                            <SwitchVizButton
                                currentViz="3d"
                                filename={decodedFilename}
                                currentParams={currentParams}
                            />

                            <div
                                className="text-sm font-mono truncate"
                                style={{ color: colors.accentPrimary }}
                                title={decodedFilename}
                            >
                                {decodedFilename}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                            <ColorThemeDropdown />
                        </div>
                    </div>
                </div>
            </header>

            {/* Tree Sequence Selector Modal */}
            <TreeSequenceSelectorModal
                isOpen={showTreeSequenceSelector}
                onClose={() => setShowTreeSequenceSelector(false)}
                onSelect={handleTreeSequenceSelect}
            />

            {/* Main content - Full width and height */}
            <main ref={containerRef} className="flex-1 overflow-hidden">
                {useMemo(() => (
                    <SpatialArg3DVisualizationContainer
                        filename={decodedFilename}
                        max_samples={maxSamples}
                        temporalStart={urlParams.temporalStart}
                        temporalEnd={urlParams.temporalEnd}
                        genomicStart={urlParams.genomicStart}
                        genomicEnd={urlParams.genomicEnd}
                        treeStartIdx={urlParams.treeStartIdx}
                        treeEndIdx={urlParams.treeEndIdx}
                        initialHeatmapMode={urlParams.heatmapMode}
                    />
                ), [decodedFilename, maxSamples, urlParams])}
            </main>
        </div>
    );
} 