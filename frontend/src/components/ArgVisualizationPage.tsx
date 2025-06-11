import { useParams, useNavigate } from 'react-router-dom';
import { ForceDirectedGraphContainer } from './ForceDirectedGraph/ForceDirectedGraphContainer';
import { useTreeSequence } from '../context/TreeSequenceContext';
import { useColorTheme } from '../context/ColorThemeContext';
import { useRef, useEffect, useState, useMemo } from 'react';
import { api } from '../lib/api';
import { exportSVGAsImage } from '../lib/imageExport';
import { ColorThemeDropdown } from './ui/ColorThemeDropdown';
import ClickableLogo from './ui/ClickableLogo';
import { DownloadDropdown } from './ui/DownloadDropdown';
import { TreeSequenceSelectorModal } from './ui/TreeSequenceSelectorModal';
import { log } from '../lib/logger';

export default function ArgVisualizationPage() {
    const { filename } = useParams<{ filename: string }>();
    const navigate = useNavigate();
    const { maxSamples, treeSequence: data, setTreeSequence } = useTreeSequence();
    const { colors, setCurrentVisualizationType } = useColorTheme();
    const svgRef = useRef<SVGSVGElement>(null);
    const [showTreeSequenceSelector, setShowTreeSequenceSelector] = useState(false);

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
        navigate(`/visualize/${encodeURIComponent(treeSequence.filename)}`);
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
                className="border-b p-4 shadow-md flex-shrink-0"
                style={{ 
                    backgroundColor: colors.background,
                    borderBottomColor: colors.border 
                }}
            >
                <div className="max-w-7xl mx-auto">
                    {/* Row 1: Logo and Back Button */}
                    <div className="relative flex items-center justify-center mb-4">
                        <button 
                            className="absolute left-0 inline-flex items-center gap-2 transition-colors duration-200"
                            style={{ color: colors.accentPrimary }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.color = `${colors.accentPrimary}CC`; // 80% opacity
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.color = colors.accentPrimary;
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
                    
                    {/* Row 2: Title, filename and Actions */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                            <span className="text-lg flex-shrink-0" style={{ color: `${colors.text}B3` }}>
                                ARG Visualization
                            </span>
                            <div className="text-base font-mono break-all min-w-0" style={{ color: colors.accentPrimary }}>
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
                                className="font-medium px-4 py-2 rounded-lg text-sm transition-colors"
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
                                title="Download ARG visualization as PNG"
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
                {useMemo(() => (
                    <ForceDirectedGraphContainer 
                        ref={svgRef}
                        filename={decodedFilename}
                        max_samples={maxSamples}
                    />
                ), [decodedFilename, maxSamples])}
            </main>
        </div>
    );
} 