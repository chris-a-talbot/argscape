import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ForceDirectedGraphContainer } from '../visualizations/ForceDirectedGraph/ForceDirectedGraphContainer';
import { ArgVisualizationHeader } from './ArgVisualizationHeader';
import { useTreeSequence } from '../../context/TreeSequenceContext';
import { useColorTheme } from '../../context/ColorThemeContext';
import { useRef, useEffect } from 'react';
import { useUrlParameters } from '../../hooks/useUrlParameters';
import { log } from '../../lib/logger';

export default function ArgVisualizationPage() {
    const { filename } = useParams<{ filename: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { maxSamples, setTreeSequence } = useTreeSequence();
    const { colors, setCurrentVisualizationType } = useColorTheme();
    const svgRef = useRef<SVGSVGElement>(null);

    const urlParams = useUrlParameters();
    const currentParams = searchParams.toString();

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
        // Navigate to the new tree sequence while maintaining all visualization settings
        navigate(`/graph/${encodeURIComponent(treeSequence.filename)}${currentParams ? `?${currentParams}` : ''}`);
    };

    return (
        <div
            className="h-screen flex flex-col overflow-hidden font-sans"
            style={{
                backgroundColor: colors.background,
                color: colors.text
            }}
        >
            <ArgVisualizationHeader
                filename={filename || ''}
                decodedFilename={decodedFilename}
                onTreeSequenceSelect={handleTreeSequenceSelect}
                currentParams={currentParams}
            />

            {/* Main content - Full width and height */}
            <main className="flex-1 overflow-hidden">
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
            </main>
        </div>
    );
} 