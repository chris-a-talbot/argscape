import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useColorTheme } from '../context/ColorThemeContext';
import { useRef, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { export3DVisualizationAsImage, exportCanvasAsImage } from '../lib/imageExport';
import { ColorThemeDropdown } from './ui/ColorThemeDropdown';
import ClickableLogo from './ui/ClickableLogo';
import { TreeSequenceSelectorModal } from './ui/TreeSequenceSelectorModal';
import { DownloadDropdown } from './ui/DownloadDropdown';
import SpatialArgDiffVisualizationContainer from './SpatialArgDiffVisualization/SpatialArgDiffVisualizationContainer';
import { log } from '../lib/logger';

export default function SpatialArgDiffVisualizationPage() {
    const { filename } = useParams<{ filename: string }>();
    const navigate = useNavigate();
    const { colors, setCurrentVisualizationType } = useColorTheme();
    const containerRef = useRef<HTMLDivElement>(null);
    const [showTreeSequenceSelector, setShowTreeSequenceSelector] = useState(false);
    const [selectedTreeSequenceToChange, setSelectedTreeSequenceToChange] = useState<'first' | 'second' | null>(null);
    const decodedFilename = decodeURIComponent(filename || '');
    const [searchParams] = useSearchParams();
    const secondFilename = searchParams.get('second') || '';

    // Set visualization type when component mounts
    useEffect(() => {
        setCurrentVisualizationType('spatial-diff');
    }, [setCurrentVisualizationType]);

    const handleTreeSequenceSelect = (treeSequence: any) => {
        if (selectedTreeSequenceToChange === 'first') {
            // Update first tree sequence
            navigate(`/visualize-spatial-diff/${treeSequence.filename}?second=${decodedFilename}`);
        } else if (selectedTreeSequenceToChange === 'second') {
            // Update second tree sequence
            navigate(`/visualize-spatial-diff/${decodedFilename}?second=${treeSequence.filename}`);
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
                className="border-b p-4 shadow-md flex-shrink-0"
                style={{ 
                    backgroundColor: colors.background, 
                    borderBottomColor: colors.border 
                }}
            >
                <div className="max-w-7xl mx-auto">
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
                    </div>
                    
                    {/* Title and Actions Row */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                            <span 
                                className="text-lg flex-shrink-0"
                                style={{ color: `${colors.text}B3` }}
                            >
                                Spatial ARG Diff
                            </span>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <div 
                                        className="text-base font-mono break-all min-w-0"
                                        style={{ color: colors.accentPrimary }}
                                    >
                                        {decodedFilename}
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedTreeSequenceToChange('first');
                                            setShowTreeSequenceSelector(true);
                                        }}
                                        className="font-medium px-3 py-1 rounded text-sm transition-colors border"
                                        style={{
                                            backgroundColor: colors.containerBackground,
                                            color: colors.text,
                                            borderColor: `${colors.accentPrimary}33`
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = `${colors.accentPrimary}66`;
                                            e.currentTarget.style.backgroundColor = `${colors.containerBackground}CC`;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = `${colors.accentPrimary}33`;
                                            e.currentTarget.style.backgroundColor = colors.containerBackground;
                                        }}
                                    >
                                        Change
                                    </button>
                                    <DownloadDropdown filename={decodedFilename} />
                                </div>
                                {secondFilename && (
                                    <div className="flex items-center gap-2">
                                        <div 
                                            className="text-base font-mono break-all min-w-0"
                                            style={{ color: colors.accentPrimary }}
                                        >
                                            {secondFilename}
                                        </div>
                                        <button
                                            onClick={() => {
                                                setSelectedTreeSequenceToChange('second');
                                                setShowTreeSequenceSelector(true);
                                            }}
                                            className="font-medium px-3 py-1 rounded text-sm transition-colors border"
                                            style={{
                                                backgroundColor: colors.containerBackground,
                                                color: colors.text,
                                                borderColor: `${colors.accentPrimary}33`
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.borderColor = `${colors.accentPrimary}66`;
                                                e.currentTarget.style.backgroundColor = `${colors.containerBackground}CC`;
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.borderColor = `${colors.accentPrimary}33`;
                                                e.currentTarget.style.backgroundColor = colors.containerBackground;
                                            }}
                                        >
                                            Change
                                        </button>
                                        <DownloadDropdown filename={secondFilename} />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <ColorThemeDropdown />
                            <button 
                                className="font-medium px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap"
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
                                onClick={handleDownloadImage}
                                title="Download spatial diff visualization as PNG"
                            >
                                Download Image
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 overflow-hidden">
                <div ref={containerRef} className="w-full h-full">
                    <SpatialArgDiffVisualizationContainer 
                        firstFilename={decodedFilename}
                        secondFilename={secondFilename}
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