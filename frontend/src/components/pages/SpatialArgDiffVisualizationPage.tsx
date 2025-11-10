import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useColorTheme } from '../../context/ColorThemeContext';
import { useTreeSequence } from '../../context/TreeSequenceContext';
import { useRef, useEffect, useState } from 'react';
import { export3DVisualizationAsImage, exportCanvasAsImage } from '../../lib/imageExport';
import { ColorThemeDropdown } from '../ui/ColorThemeDropdown';
import ClickableLogo from '../ui/ClickableLogo';
import { TreeSequenceSelectorModal } from '../ui/TreeSequenceSelectorModal';
import { SpatialDiffDownloadDropdown } from '../ui/SpatialDiffDownloadDropdown';
import SpatialArgDiffVisualizationContainer from '../visualizations/SpatialArgDiff/SpatialArgDiffVisualizationContainer';

export default function SpatialArgDiffVisualizationPage() {
    const { filename } = useParams<{ filename: string }>();
    const navigate = useNavigate();
    const { colors, setCurrentVisualizationType } = useColorTheme();
    const { maxSamples } = useTreeSequence();
    const containerRef = useRef<HTMLDivElement>(null);
    const [showTreeSequenceSelector, setShowTreeSequenceSelector] = useState(false);
    const [selectedTreeSequenceToChange, setSelectedTreeSequenceToChange] = useState<'first' | 'second' | null>(null);
    const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(true);
    const decodedFilename = decodeURIComponent(filename || '');
    const [searchParams] = useSearchParams();
    const secondFilename = searchParams.get('second') || '';
    const heatmapMode = searchParams.get('heatmap_mode') === 'true';

    // Set visualization type when component mounts
    useEffect(() => {
        setCurrentVisualizationType('spatial-diff');
    }, [setCurrentVisualizationType]);

    const handleTreeSequenceSelect = (treeSequence: any) => {
        if (selectedTreeSequenceToChange === 'first') {
            // Update first tree sequence, keep second the same
            navigate(`/spatial-diff/${encodeURIComponent(treeSequence.filename)}?second=${encodeURIComponent(secondFilename)}`);
        } else if (selectedTreeSequenceToChange === 'second') {
            // Update second tree sequence, keep first the same
            navigate(`/spatial-diff/${encodeURIComponent(decodedFilename)}?second=${encodeURIComponent(treeSequence.filename)}`);
        }
        setShowTreeSequenceSelector(false);
        setSelectedTreeSequenceToChange(null);
    };

    const handleDownloadImage = async () => {
        if (!containerRef.current) return;

        try {
            const imageFilename = `${decodedFilename.replace(/\.(trees|tsz)$/, '')}_spatial_diff.png`;
            const watermarkConfig = {
                text: 'ARGscape',
                subtext: decodedFilename,
                position: 'bottom-center' as const,
                color: colors.accentPrimary,
                backgroundColor: colors.background + 'CC' // 80% opacity
            };
            
            // Try high-quality export first
            const visualizationContainer = containerRef.current.querySelector('[data-3d-visualization]') as any;
            if (visualizationContainer?.getExportData) {
                const exportData = visualizationContainer.getExportData();
                const deckGLElement = containerRef.current.querySelector('[data-deck="true"]');
                const deckGLRef = deckGLElement ? { current: deckGLElement } : null;
                
                try {
                    await export3DVisualizationAsImage(exportData, deckGLRef, {
                        filename: imageFilename,
                        padding: 50,
                        maxWidth: 8192,
                        maxHeight: 8192,
                        backgroundColor: colors.exportBackground,
                        scale: 2,
                        watermark: watermarkConfig
                    });
                    console.log('High-resolution spatial diff image exported successfully');
                    return;
                } catch (exportError) {
                    console.warn('High-quality export failed, falling back to canvas capture:', exportError);
                }
            }
            
            // Fallback to canvas capture
            const canvas = containerRef.current.querySelector('canvas') as HTMLCanvasElement;
            if (!canvas) {
                throw new Error('No canvas found for export');
            }

            await exportCanvasAsImage(canvas, {
                filename: imageFilename,
                padding: 50,
                maxWidth: 4096,
                maxHeight: 4096,
                backgroundColor: colors.exportBackground,
                scale: 2,
                watermark: watermarkConfig
            });
            console.log('Spatial diff image captured from canvas');
        } catch (error) {
            console.error('Error downloading spatial diff image:', error);
        }
    };

    return (
        <div 
            className="h-screen flex flex-col overflow-hidden font-sans"
            style={{ backgroundColor: colors.background, color: colors.text }}
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
                            <div className="flex items-center gap-3 min-w-0 flex-1">
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
                                    onClick={() => {
                                        setSelectedTreeSequenceToChange('first');
                                        setShowTreeSequenceSelector(true);
                                    }}
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
                                    title="Change first tree sequence"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                    </svg>
                                    <span>Change</span>
                                </button>
                                
                                <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                                    <div 
                                        className="text-sm font-mono truncate"
                                        style={{ color: colors.accentPrimary }}
                                        title={decodedFilename}
                                    >
                                        {decodedFilename}
                                    </div>
                                    {secondFilename && (
                                        <>
                                            <span style={{ color: `${colors.text}66` }}>vs</span>
                                            <button
                                                onClick={() => {
                                                    setSelectedTreeSequenceToChange('second');
                                                    setShowTreeSequenceSelector(true);
                                                }}
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
                                                title="Change second tree sequence"
                                            >
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                                </svg>
                                                <span>Change</span>
                                            </button>
                                            <div 
                                                className="text-sm font-mono truncate"
                                                style={{ color: colors.accentPrimary }}
                                                title={secondFilename}
                                            >
                                                {secondFilename}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <ColorThemeDropdown />
                                <SpatialDiffDownloadDropdown 
                                    firstFilename={decodedFilename}
                                    secondFilename={secondFilename}
                                    onDownloadImage={handleDownloadImage}
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
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedTreeSequenceToChange('first');
                                                    setShowTreeSequenceSelector(true);
                                                }}
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
                                        {secondFilename && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedTreeSequenceToChange('second');
                                                        setShowTreeSequenceSelector(true);
                                                    }}
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
                                                    {secondFilename}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <ColorThemeDropdown />
                                    <SpatialDiffDownloadDropdown 
                                        firstFilename={decodedFilename}
                                        secondFilename={secondFilename}
                                        onDownloadImage={handleDownloadImage}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 overflow-hidden">
                <div ref={containerRef} className="w-full h-full">
                    <SpatialArgDiffVisualizationContainer 
                        firstFilename={decodedFilename}
                        secondFilename={secondFilename}
                        max_samples={maxSamples}
                        initialHeatmapMode={heatmapMode}
                    />
                </div>
            </main>

            {/* Tree Sequence Selector Modal */}
            <TreeSequenceSelectorModal
                isOpen={showTreeSequenceSelector}
                onClose={() => {
                    setShowTreeSequenceSelector(false);
                    setSelectedTreeSequenceToChange(null);
                }}
                onSelect={handleTreeSequenceSelect}
            />
        </div>
    );
} 