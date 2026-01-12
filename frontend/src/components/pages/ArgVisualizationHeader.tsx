import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useColorTheme } from '../../context/ColorThemeContext';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { ColorThemeDropdown } from '../ui/ColorThemeDropdown';
import ClickableLogo from '../ui/ClickableLogo';
import { TreeSequenceSelectorModal } from '../ui/TreeSequenceSelectorModal';
import { SwitchVizButton } from '../ui/SwitchVizButton';
import { log } from '../../lib/logger';

interface ArgVisualizationHeaderProps {
    filename: string;
    decodedFilename: string;
    onTreeSequenceSelect: (treeSequence: any) => void;
    currentParams: string;
    /** Whether to show the expand/collapse button. Default false for 2D visualizer. */
    showExpandButton?: boolean;
    /** Whether the tree sequence has spatial data for 3D visualization */
    hasSpatialData?: boolean;
    /** Whether tree sequence data is loaded */
    hasTreeSequence?: boolean;
}

export const ArgVisualizationHeader = ({
    filename,
    decodedFilename,
    onTreeSequenceSelect,
    currentParams: _currentParams,
    showExpandButton = false,
    hasSpatialData = false,
    hasTreeSequence = false
}: ArgVisualizationHeaderProps) => {
    const navigate = useNavigate();
    const { colors } = useColorTheme();
    const { navStyle } = useThemeStyles();
    const [showTreeSequenceSelector, setShowTreeSequenceSelector] = useState(false);
    const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(true);
    const [showFilenameTooltip, setShowFilenameTooltip] = useState(false);

    const handleTreeSequenceSelect = (treeSequence: any) => {
        log.user.action('switch-tree-sequence-force-directed', { treeSequence }, 'ArgVisualizationHeader');
        onTreeSequenceSelect(treeSequence);
        setShowTreeSequenceSelector(false);
    };

    if (!filename) {
        return (
            <div
                className="h-screen flex flex-col items-center justify-center"
                style={{
                    backgroundColor: colors.background,
                    color: colors.text
                }}
            >
                <h1 className="text-3xl font-bold mb-4">No filename provided</h1>
                <button
                    className="bg-sp-dark-blue hover:bg-sp-very-pale-green hover:text-sp-very-dark-blue text-sp-white font-bold py-2 px-6 rounded-lg mt-4 transition-colors"
                    onClick={() => navigate('/result')}
                >
                    Back to Results
                </button>
            </div>
        );
    }

    return (
        <>
            {/* Header */}
            <header
                className="border-b shadow-md flex-shrink-0 transition-colors duration-300"
                style={{
                    backgroundColor: navStyle.backgroundColor,
                    borderBottomColor: navStyle.borderBottomColor,
                    backdropFilter: navStyle.backdropFilter,
                    WebkitBackdropFilter: navStyle.WebkitBackdropFilter,
                    position: 'relative',
                    zIndex: 10001,
                }}
            >
                <div className="max-w-7xl mx-auto">
                    {isHeaderCollapsed ? (
                        /* Collapsed Header */
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
                                    currentViz="2d"
                                    filename={decodedFilename}
                                    currentParams={_currentParams}
                                    hasSpatialData={hasSpatialData}
                                    hasTreeSequence={hasTreeSequence}
                                />

                                <div
                                    className="text-sm font-mono truncate relative cursor-default"
                                    style={{ color: colors.accentPrimary }}
                                    onMouseEnter={() => setShowFilenameTooltip(true)}
                                    onMouseLeave={() => setShowFilenameTooltip(false)}
                                >
                                    {decodedFilename}
                                    {/* Custom tooltip for full filename */}
                                    {showFilenameTooltip && (
                                        <div
                                            className="absolute left-0 top-full mt-1 px-3 py-2 rounded shadow-lg text-xs font-mono max-w-md break-all whitespace-normal"
                                            style={{
                                                backgroundColor: colors.containerBackground,
                                                color: colors.text,
                                                border: `1px solid ${colors.border}`,
                                                backdropFilter: 'blur(8px)',
                                                zIndex: 10000,
                                            }}
                                        >
                                            {decodedFilename}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                                <ColorThemeDropdown />
                                {showExpandButton && (
                                    <button
                                        onClick={() => setIsHeaderCollapsed(false)}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors"
                                        style={{
                                            backgroundColor: colors.accentPrimary,
                                            color: colors.background
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.opacity = '0.8';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.opacity = '1';
                                        }}
                                        title="Expand header to access all options"
                                    >
                                        <span>Expand</span>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Expanded Header */
                        <div className="p-4">
                            {/* Logo and Back Button Row */}
                            <div className="relative flex items-center justify-center mb-4">
                                <button
                                    className="absolute left-0 inline-flex items-center gap-2 transition-colors duration-200"
                                    style={{ color: colors.accentPrimary }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.opacity = '0.8';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.opacity = '1';
                                    }}
                                    onClick={() => navigate('/result')}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Back to Results
                                </button>

                                <ClickableLogo size="medium" />

                                <button
                                    onClick={() => setIsHeaderCollapsed(true)}
                                    className="absolute right-0 px-3 py-1 rounded text-sm transition-colors"
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
                                    title="Collapse header"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                    </svg>
                                </button>
                            </div>

                            {/* Title and Actions Row */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <button
                                        onClick={() => setShowTreeSequenceSelector(!showTreeSequenceSelector)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors border flex-shrink-0"
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
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                        </svg>
                                        <span>Switch File</span>
                                    </button>

                                    <SwitchVizButton
                                        currentViz="2d"
                                        filename={decodedFilename}
                                        currentParams={_currentParams}
                                        hasSpatialData={hasSpatialData}
                                        hasTreeSequence={hasTreeSequence}
                                    />

                                    <div
                                        className="text-base font-mono break-all min-w-0"
                                        style={{ color: colors.accentPrimary }}
                                    >
                                        {decodedFilename}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <ColorThemeDropdown />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* Tree Sequence Selector Modal */}
            <TreeSequenceSelectorModal
                isOpen={showTreeSequenceSelector}
                onClose={() => setShowTreeSequenceSelector(false)}
                onSelect={handleTreeSequenceSelect}
            />
        </>
    );
};
