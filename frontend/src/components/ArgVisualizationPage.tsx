import { useParams, useNavigate } from 'react-router-dom';
import { ForceDirectedGraphContainer } from './ForceDirectedGraph/ForceDirectedGraphContainer';
import { useTreeSequence } from '../context/TreeSequenceContext';
import { useColorTheme } from '../context/ColorThemeContext';
import { useRef } from 'react';
import { api } from '../lib/api';
import { exportSVGAsImage } from '../lib/imageExport';
import { ColorThemeDropdown } from './ui/ColorThemeDropdown';

export default function ArgVisualizationPage() {
    const { filename } = useParams<{ filename: string }>();
    const navigate = useNavigate();
    const { maxSamples, treeSequence: data } = useTreeSequence();
    const { colors } = useColorTheme();
    const svgRef = useRef<SVGSVGElement>(null);

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

    const handleDownload = async () => {
        if (!data) return;
        try {
            const blob = await api.downloadTreeSequence(data.filename);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const downloadFilename = data.filename.toLowerCase().endsWith('.trees') ? `${data.filename}.tsz` : data.filename;
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
            className="h-screen flex flex-col overflow-hidden"
            style={{ 
                backgroundColor: colors.background,
                color: colors.text 
            }}
        >
            {/* Header */}
            <header 
                className="p-4 shadow-md"
                style={{ 
                    backgroundColor: colors.background,
                    borderBottomColor: colors.border 
                }}
            >
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <button 
                        className="text-base font-medium px-2 py-1 rounded transition-colors"
                        style={{ 
                            color: colors.textSecondary,
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = colors.text;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = colors.textSecondary;
                        }}
                        onClick={() => navigate('/result')}
                    >
                        {'< Back to Results'}
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="flex items-baseline gap-4">
                            <h1 className="text-2xl font-bold" style={{ color: colors.text }}>
                                ARG<span style={{ color: colors.accentPrimary }}>scape</span>
                            </h1>
                            <span className="text-lg opacity-75" style={{ color: colors.text }}>ARG Visualization</span>
                            <div className="text-base font-mono break-all max-w-md" style={{ color: colors.textSecondary }}>
                                {decodedFilename}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <ColorThemeDropdown />
                        <button 
                            className="bg-sp-dark-blue hover:bg-sp-very-pale-green hover:text-sp-very-dark-blue text-sp-white font-medium px-4 py-2 rounded-lg text-base transition-colors"
                            onClick={handleDownloadImage}
                        >
                            Download Image
                        </button>
                        <button 
                            className="bg-sp-dark-blue hover:bg-sp-very-pale-green hover:text-sp-very-dark-blue text-sp-white font-medium px-4 py-2 rounded-lg text-base transition-colors"
                            onClick={handleDownload}
                        >
                            Download .tsz
                        </button>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 p-4 overflow-hidden">
                <div className="max-w-7xl mx-auto h-full">
                    <ForceDirectedGraphContainer 
                        ref={svgRef}
                        filename={decodedFilename}
                        max_samples={maxSamples}
                    />
                </div>
            </main>
        </div>
    );
} 