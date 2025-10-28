import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ForceDirectedGraphContainer } from './ForceDirectedGraph/ForceDirectedGraphContainer';
import { useTreeSequence } from '../context/TreeSequenceContext';
import { useColorTheme } from '../context/ColorThemeContext';
import { useRef, useEffect, useState, useMemo } from 'react';
import { api } from '../lib/api';
import { exportSVGAsImage } from '../lib/imageExport';
import { ColorThemeDropdown } from './ui/ColorThemeDropdown';
import ClickableLogo from './ui/ClickableLogo';
import { ComprehensiveDownloadDropdown } from './ui/ComprehensiveDownloadDropdown';
import { TreeSequenceSelectorModal } from './ui/TreeSequenceSelectorModal';
import { log } from '../lib/logger';

export default function ArgVisualizationPage() {
    const { filename } = useParams<{ filename: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { maxSamples, treeSequence: data, setTreeSequence } = useTreeSequence();
    const { colors, setCurrentVisualizationType } = useColorTheme();
    const svgRef = useRef<SVGSVGElement>(null);
    const [showTreeSequenceSelector, setShowTreeSequenceSelector] = useState(false);
    const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(true);

    // Parse URL parameters for filtering
    const urlParams = useMemo(() => {
        const params: {
            temporalStart?: number;
            temporalEnd?: number;
            genomicStart?: number;
            genomicEnd?: number;
            treeStartIdx?: number;
            treeEndIdx?: number;
        } = {};

        const temporalStart = searchParams.get('temporal_start');
        const temporalEnd = searchParams.get('temporal_end');
        const genomicStart = searchParams.get('genomic_start');
        const genomicEnd = searchParams.get('genomic_end');
        const treeStartIdx = searchParams.get('tree_start_idx');
        const treeEndIdx = searchParams.get('tree_end_idx');

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

        return params;
    }, [searchParams]);

    // Set visualization type when component mounts
    useEffect(() => {
        setCurrentVisualizationType('force-directed');
    }, [setCurrentVisualizationType]);

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

    const decodedFilename = decodeURIComponent(filename);

    const handleTreeSequenceSelect = (treeSequence: any) => {
        log.user.action('switch-tree-sequence-force-directed', { treeSequence }, 'ArgVisualizationPage');
        setTreeSequence(treeSequence);
        setShowTreeSequenceSelector(false);
        // Navigate to the new tree sequence while maintaining all visualization settings
        const currentParams = searchParams.toString();
        navigate(`/graph/${encodeURIComponent(treeSequence.filename)}${currentParams ? `?${currentParams}` : ''}`);
    };

    const handleDownloadImage = async () => {
        const svgElement = svgRef.current;
        if (!svgElement) return;

        try {
            const imageFilename = `${decodedFilename.replace(/\.(trees|tsz)$/, '')}_arg.png`;
            
            await exportSVGAsImage(svgElement, {
                filename: imageFilename,
                padding: 50,
                maxWidth: 8192,
                maxHeight: 8192,
                backgroundColor: colors.exportBackground,
                scale: 3, // High resolution export
                watermark: {
                    text: 'ARGscape',
                    subtext: decodedFilename,
                    position: 'bottom-center',
                    color: colors.accentPrimary,
                    backgroundColor: colors.background + 'CC' // 80% opacity
                }
            });

            console.log('High-resolution ARG image downloaded successfully');
        } catch (error) {
            console.error('Error downloading ARG image:', error);
        }
    };

    return (
        <div 
            className="h-screen flex flex-col overflow-hidden font-sans"
            style={{ 
                backgroundColor: colors.background,
                color: colors.text 
            }}
        >
            {/* Header */}
            <header 
                className="border-b shadow-md flex-shrink-0"
                style={{ 
                    backgroundColor: colors.background,
                    borderBottomColor: colors.border 
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
                                    title="Change tree sequence"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                    </svg>
                                    <span>Change</span>
                                </button>
                                
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
                                <ComprehensiveDownloadDropdown 
                                    onDownloadImage={handleDownloadImage}
                                    treeSequences={decodedFilename ? [{ filename: decodedFilename }] : []}
                                />
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
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                        </svg>
                                        <span>Change</span>
                                    </button>
                                    <div 
                                        className="text-base font-mono break-all min-w-0"
                                        style={{ color: colors.accentPrimary }}
                                    >
                                        {decodedFilename}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <ColorThemeDropdown />
                                    <ComprehensiveDownloadDropdown 
                                        onDownloadImage={handleDownloadImage}
                                        treeSequences={decodedFilename ? [{ filename: decodedFilename }] : []}
                                    />
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

            {/* Main content - Full width and height */}
            <main className="flex-1 overflow-hidden">
                {useMemo(() => (
                    <ForceDirectedGraphContainer 
                        ref={svgRef}
                        filename={decodedFilename}
                        max_samples={maxSamples}
                        temporalStart={urlParams.temporalStart}
                        temporalEnd={urlParams.temporalEnd}
                        genomicStart={urlParams.genomicStart}
                        genomicEnd={urlParams.genomicEnd}
                        treeStartIdx={urlParams.treeStartIdx}
                        treeEndIdx={urlParams.treeEndIdx}
                    />
                ), [decodedFilename, maxSamples, urlParams])}
            </main>
        </div>
    );
} 