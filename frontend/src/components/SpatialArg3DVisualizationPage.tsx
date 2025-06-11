import { useParams, useNavigate } from 'react-router-dom';
import SpatialArg3DVisualizationContainer from './SpatialArg3DVisualization/SpatialArg3DVisualizationContainer';
import { useTreeSequence } from '../context/TreeSequenceContext';
import { useColorTheme } from '../context/ColorThemeContext';
import { useRef, useEffect, useState, useMemo } from 'react';
import { api } from '../lib/api';
import { export3DVisualizationAsImage, exportCanvasAsImage } from '../lib/imageExport';
import { ColorThemeDropdown } from './ui/ColorThemeDropdown';
import ClickableLogo from './ui/ClickableLogo';
import { TreeSequenceSelectorModal } from './ui/TreeSequenceSelectorModal';
import { log } from '../lib/logger';
import { DownloadDropdown } from './ui/DownloadDropdown';

export default function SpatialArg3DVisualizationPage() {
    const { filename } = useParams<{ filename: string }>();
    const navigate = useNavigate();
    const { maxSamples, treeSequence: data, setTreeSequence } = useTreeSequence();
    const { colors, setCurrentVisualizationType } = useColorTheme();
    const containerRef = useRef<HTMLDivElement>(null);
    const [showTreeSequenceSelector, setShowTreeSequenceSelector] = useState(false);

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

    const handleTreeSequenceSelect = (treeSequence: any) => {
        log.user.action('switch-tree-sequence-spatial', { treeSequence }, 'SpatialArg3DVisualizationPage');
        setTreeSequence(treeSequence);
        setShowTreeSequenceSelector(false);
        // Navigate to the new tree sequence while maintaining all visualization settings
        navigate(`/visualize-spatial/${encodeURIComponent(treeSequence.filename)}`);
    };

    const handleDownload = async () => {
        if (!data) return;
        try {
            const blob = await api.downloadTreeSequence(data.filename, 'trees');
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const downloadFilename = `${data.filename.replace(/\.(trees|tsz)$/, '')}.trees`;
            link.setAttribute('download', downloadFilename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            console.log('Download button clicked for file:', data.filename);
        } catch (error) {
            console.error('Error downloading file:', error);
        }
    };

    const handleDownloadImage = async () => {
        if (!containerRef.current) return;

        try {
            const imageFilename = `${decodedFilename.replace(/\.(trees|tsz)$/, '')}_3d_spatial_arg.png`;
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
                    console.log('High-resolution 3D spatial ARG image exported successfully');
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
            console.log('3D spatial ARG image captured from canvas');
        } catch (error) {
            console.error('Error downloading 3D spatial ARG image:', error);
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
                                3D Spatial ARG
                            </span>
                            <div 
                                className="text-base font-mono break-all min-w-0"
                                style={{ color: colors.accentPrimary }}
                            >
                                {decodedFilename}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <ColorThemeDropdown />
                            <button 
                                className="font-medium px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap border"
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
                                onClick={() => setShowTreeSequenceSelector(!showTreeSequenceSelector)}
                            >
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                    </svg>
                                    Switch Tree Sequence
                                </div>
                            </button>
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
                                title="Download 3D visualization as PNG"
                            >
                                Download Image
                            </button>
                            {data && <DownloadDropdown filename={data.filename} />}
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
            <main className="flex-1 overflow-hidden">
                <div ref={containerRef} className="w-full h-full">
                    {useMemo(() => (
                        <SpatialArg3DVisualizationContainer 
                            filename={decodedFilename}
                            max_samples={maxSamples}
                        />
                    ), [decodedFilename, maxSamples])}
                </div>
            </main>
        </div>
    );
} 