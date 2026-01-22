import { useEffect, useState, useCallback, forwardRef, ForwardedRef, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ForceDirectedGraph } from './ForceDirectedGraph';
import { ForceDirectedGraphControls } from './ForceDirectedGraphControls';
import { RangeSlider } from '../../ui/range-slider';
import { TreeRangeSlider } from '../../ui/tree-range-slider';
import { TemporalRangeSlider } from '../../ui/temporal-range-slider';
import { SampleOrderType } from '../../ui/sample-order-control';
import { ArgStatsData } from '../../ui/arg-stats-display';
import AlertModal from '../../ui/AlertModal';
import { AnimationPopout } from '../../ui/QuickActionsBar/panels/AnimationPopout';
import { useColorTheme } from '../../../context/ColorThemeContext';
import { useTreeSequence } from '../../../context/TreeSequenceContext';
import { formatGenomicPosition } from '../../../utils/colorUtils';
import { useElapsedTime } from '../../../hooks/useElapsedTime';
import { useFilteringState } from '../../../hooks/useFilteringState';
import { useClusteringState } from '../../../hooks/useClusteringState';
import { useGraphData } from '../../../hooks/useGraphData';
import { useViewModeState } from '../../../hooks/useViewModeState';
import { useVisualizationSettings } from '../../../hooks/useVisualizationSettings';
import { useLayerReveal } from '../../../hooks/useLayerReveal';
import { useDownloadImage } from '../../../hooks/useDownloadImage';
import { useSimulationControls } from '../../../hooks/useSimulationControls';
import { useForceTuning } from '../../../hooks/useForceTuning';
import { useSampleOrder } from '../../../hooks/useSampleOrder';
import { useEdgeCrossings } from '../../../hooks/useEdgeCrossings';
import { useWindowStats } from '../../../hooks/useWindowStats';
import { ForceDirectedLoadingState, ErrorState, NoDataState } from '../shared/LoadingStates';
import { Play, Pause } from 'lucide-react';

interface ForceDirectedGraphContainerProps {
    filename: string;
    max_samples?: number;
    temporalStart?: number;
    temporalEnd?: number;
    genomicStart?: number;
    genomicEnd?: number;
    treeStartIdx?: number;
    treeEndIdx?: number;
}

export const ForceDirectedGraphContainer = forwardRef<SVGSVGElement, ForceDirectedGraphContainerProps>(({
    filename,
    max_samples = 25,
    temporalStart,
    temporalEnd,
    genomicStart,
    genomicEnd,
    treeStartIdx,
    treeEndIdx
}, ref: ForwardedRef<SVGSVGElement>) => {
    const { colors, theme, setCurrentVisualizationType } = useColorTheme();
    const {
        treeSequence,
        sampleSubsetMode,
        sampleIds,
        sampleRange,
        randomSeed,
        selectedPopulations
    } = useTreeSequence();
    const [searchParams] = useSearchParams();

    // Set visualization type for color theme context
    useEffect(() => {
        setCurrentVisualizationType('force-directed');
    }, [setCurrentVisualizationType]);

    // Local state for UI controls
    const sampleOrderControls = useSampleOrder(
        searchParams.get('clustering') === 'true' ? 'dagre' : 'consensus_minlex'
    );

    const simulationControls = useSimulationControls();
    const forceTuningControls = useForceTuning();

    const [combineInternalNodes, setCombineInternalNodes] = useState(false);
    const [combineSampleNodes, setCombineSampleNodes] = useState(true);

    // Internal ref for SVG element (for download handlers)
    // We create our own ref and sync it with the forwarded ref
    const internalSvgRef = useRef<SVGSVGElement>(null);

    // Sync internal ref to forwarded ref for parent access
    useEffect(() => {
        if (internalSvgRef.current) {
            if (typeof ref === 'function') {
                ref(internalSvgRef.current);
            } else if (ref) {
                ref.current = internalSvgRef.current;
            }
        }
    });

    // Legend state - use refs to avoid triggering graph re-renders
    const legendRef = useRef<HTMLDivElement>(null);
    const legendContentRef = useRef<HTMLDivElement>(null);
    const legendChevronRef = useRef<SVGSVGElement>(null);
    const legendDragState = useRef({ isDragging: false, startX: 0, startY: 0, offsetX: 0, offsetY: 0, minimized: false });

    // Initialize sequence length and tree intervals from graph data
    const [sequenceLength, setSequenceLength] = useState(0);
    const [treeIntervals, setTreeIntervals] = useState<any[]>([]);

    // Use extracted hooks for complex state management
    const filteringState = useFilteringState(sequenceLength, treeIntervals);
    const clusteringState = useClusteringState(searchParams, treeSequence, 'full', sampleOrderControls.sampleOrder, null);

    const graphDataState = useGraphData({
        filename,
        max_samples,
        sampleOrder: sampleOrderControls.sampleOrder,
        temporalStart,
        temporalEnd,
        genomicStart,
        genomicEnd,
        treeStartIdx,
        treeEndIdx,
        isFilterActive: filteringState.isFilterActive,
        filterMode: filteringState.filterMode,
        debouncedGenomicRange: filteringState.debouncedGenomicRange,
        debouncedTreeRange: filteringState.debouncedTreeRange,
        genomicFilterMode: filteringState.genomicFilterMode,
        treeFilterMode: filteringState.treeFilterMode,
        sequenceLength: filteringState.genomicRange[1] || 0,
        treeIntervals: filteringState.treeIntervals,
        clusteringEnabled: clusteringState.enabled,
        clusteringMinTreeSize: clusteringState.minTreeSize,
        clusteringRequireDensity: clusteringState.requireDensity,
        clusteringDensityIntensity: clusteringState.densityIntensity,
        clusteringTemporalIntensity: clusteringState.temporalIntensity,
        // Sample subsetting parameters from TreeSequenceContext
        sampleSubsetMode,
        sampleIds,
        sampleRangeStart: sampleRange?.[0],
        sampleRangeEnd: sampleRange?.[1],
        randomSeed: randomSeed ?? undefined,
        samplePopulations: selectedPopulations,
    });

    // Parse initial focus params from URL
    const initialFocus = useMemo(() => {
        const focusRootParam = searchParams.get('focus_root');
        const focusSampleParam = searchParams.get('focus_sample');
        if (focusRootParam) {
            const id = parseInt(focusRootParam);
            return !isNaN(id) ? { focusRoot: id } : undefined;
        }
        if (focusSampleParam) {
            const id = parseInt(focusSampleParam);
            return !isNaN(id) ? { focusSample: id } : undefined;
        }
        return undefined;
    }, [searchParams]);

    const viewModeState = useViewModeState(
        graphDataState.data,
        clusteringState.saveClusteringStateIfNeeded,
        clusteringState.restoreClusteringStateIfNeeded,
        () => clusteringState.handleClusteringEnabledChange(false),
        simulationControls.triggerReset,
        initialFocus
    );

    const edgeCrossingsControls = useEdgeCrossings(graphDataState.data);

    // Window stats for filtered genomic regions
    const windowStatsResult = useWindowStats({
        filename: filename || null,
        isGenomicFilterActive: filteringState.isFilterActive,
        filterMode: filteringState.filterMode,
        genomicStart: filteringState.debouncedGenomicRange[0],
        genomicEnd: filteringState.debouncedGenomicRange[1],
        treeStartIdx: filteringState.debouncedTreeRange[0],
        treeEndIdx: filteringState.debouncedTreeRange[1],
        sequenceLength: sequenceLength,
    });

    // Update sequence length and tree intervals from graph data
    useEffect(() => {
        if (graphDataState.sequenceLength > 0) {
            setSequenceLength(graphDataState.sequenceLength);
        }
        if (graphDataState.treeIntervals.length > 0) {
            setTreeIntervals(graphDataState.treeIntervals);
        }
    }, [graphDataState.sequenceLength, graphDataState.treeIntervals]);

    const visualizationSettings = useVisualizationSettings();

    // Download handlers using the internal SVG ref
    const { handleDownloadImage: handleDownloadPNG } = useDownloadImage(internalSvgRef, filename);

    // SVG download handler
    const handleDownloadSVG = useCallback(() => {
        const svgElement = internalSvgRef.current;
        if (!svgElement) return;

        try {
            const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
            svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

            const svgData = new XMLSerializer().serializeToString(svgClone);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `${filename.replace(/\.(trees|tsz)$/, '')}_arg.svg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading SVG:', error);
        }
    }, [filename]);

    // Filter visibility toggles (show sliders alongside visualization)
    const [spatialFilterEnabled, setSpatialFilterEnabled] = useState(false);
    const [temporalFilterEnabled, setTemporalFilterEnabled] = useState(false);

    // Animation popout visibility
    const [animationPopoutOpen, setAnimationPopoutOpen] = useState(false);

    // Sync filteringState temporalState with graphDataState when data loads
    useEffect(() => {
        if (graphDataState.temporalState.maxTime > graphDataState.temporalState.minTime) {
            filteringState.setTemporalState({
                isActive: graphDataState.temporalState.isActive,
                minTime: graphDataState.temporalState.minTime,
                maxTime: graphDataState.temporalState.maxTime,
                range: [graphDataState.temporalState.minTime, graphDataState.temporalState.maxTime]
            });
        }
    }, [graphDataState.temporalState.minTime, graphDataState.temporalState.maxTime]);

    // Create combined temporal state: min/max from graphData, range from filteringState
    // isActive is true when the filter is enabled via toggle
    const combinedTemporalState = {
        isActive: temporalFilterEnabled,
        minTime: graphDataState.temporalState.minTime,
        maxTime: graphDataState.temporalState.maxTime,
        range: filteringState.temporalState.range as [number, number]
    };

    const layerReveal = useLayerReveal(
        graphDataState.data,
        combinedTemporalState,
        filteringState.setTemporalState
    );

    const elapsedSeconds = useElapsedTime(graphDataState.loading);

    // Legend minimize handler - direct DOM manipulation
    const handleLegendMinimize = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const content = legendContentRef.current;
        const chevron = legendChevronRef.current;
        if (!content || !chevron) return;

        legendDragState.current.minimized = !legendDragState.current.minimized;

        if (legendDragState.current.minimized) {
            content.style.display = 'none';
            chevron.innerHTML = '<path d="M3 5l3 3 3-3" stroke-linecap="round" stroke-linejoin="round" />';
        } else {
            content.style.display = 'flex';
            chevron.innerHTML = '<path d="M3 7l3-3 3 3" stroke-linecap="round" stroke-linejoin="round" />';
        }
    }, []);

    // Legend drag handlers - use direct DOM manipulation to avoid re-renders
    const handleLegendMouseDown = useCallback((e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button')) return; // Don't drag when clicking buttons
        e.preventDefault();
        e.stopPropagation();

        const legend = legendRef.current;
        if (!legend) return;

        const rect = legend.getBoundingClientRect();
        legendDragState.current.isDragging = true;
        legendDragState.current.startX = e.clientX;
        legendDragState.current.startY = e.clientY;
        legendDragState.current.offsetX = e.clientX - rect.left;
        legendDragState.current.offsetY = e.clientY - rect.top;

        legend.style.cursor = 'grabbing';
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!legendDragState.current.isDragging) return;

            const legend = legendRef.current;
            if (!legend) return;

            const parent = legend.parentElement;
            if (!parent) return;

            const parentRect = parent.getBoundingClientRect();
            const newLeft = e.clientX - parentRect.left - legendDragState.current.offsetX;
            const newTop = e.clientY - parentRect.top - legendDragState.current.offsetY;

            // Clamp to parent bounds
            const maxLeft = parentRect.width - legend.offsetWidth;
            const maxTop = parentRect.height - legend.offsetHeight;

            legend.style.left = `${Math.max(0, Math.min(newLeft, maxLeft))}px`;
            legend.style.top = `${Math.max(0, Math.min(newTop, maxTop))}px`;
            legend.style.right = 'auto';
            legend.style.bottom = 'auto';
        };

        const handleMouseUp = () => {
            if (!legendDragState.current.isDragging) return;

            legendDragState.current.isDragging = false;
            const legend = legendRef.current;
            if (legend) {
                legend.style.cursor = 'grab';
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    // Loading state
    if (graphDataState.loading) {
        return (
            <ForceDirectedLoadingState
                elapsedSeconds={elapsedSeconds}
                isOptimizingSampleOrder={graphDataState.isOptimizingSampleOrder}
                colors={colors}
            />
        );
    }

    // Error state
    if (graphDataState.error) {
        return <ErrorState error={graphDataState.error} colors={colors} />;
    }

    // No data state
    if (!graphDataState.data) {
        return <NoDataState colors={colors} />;
    }


    // Main render
    const getViewTitle = (): string => {
        let title = '';
        switch (viewModeState.viewMode) {
            case 'subgraph':
                title = `SubARG at Root ${viewModeState.selectedNode?.id}`;
                break;
            case 'ancestors':
                title = `Parent ARG of Node ${viewModeState.selectedNode?.id}`;
                break;
            default:
                title = 'Full ARG';
        }

        if (filteringState.isFilterActive && graphDataState.data?.metadata.genomic_start !== undefined && graphDataState.data?.metadata.genomic_end !== undefined) {
            title += ` (${formatGenomicPosition(graphDataState.data.metadata.genomic_start)} - ${formatGenomicPosition(graphDataState.data.metadata.genomic_end)})`;
        }

        return title;
    };

    const argStats: ArgStatsData | null = !graphDataState.subArgData || !treeSequence || !viewModeState.filteredData ? null : {
        originalNodes: graphDataState.data.metadata.original_num_nodes || treeSequence.num_nodes,
        originalEdges: graphDataState.data.metadata.original_num_edges || treeSequence.num_edges,
        subArgNodes: graphDataState.subArgData.nodes.length,
        subArgEdges: graphDataState.subArgData.edges.length,
        displayedNodes: viewModeState.filteredData.nodes.length,
        displayedEdges: viewModeState.filteredData.edges.length
    };

    return (
        <div className="flex flex-col h-full" style={{ backgroundColor: colors.background }} data-testid="graph-ready">
            {/* Minimal Header - Title and view controls only */}
            <div className="flex-shrink-0 border-b" style={{ backgroundColor: colors.background, borderBottomColor: colors.border }}>
                <div className="px-4 py-1.5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h2 className="text-sm font-medium" style={{ color: colors.headerText }}>{getViewTitle()}</h2>
                            {viewModeState.viewMode !== 'full' && (
                                <button
                                    onClick={viewModeState.handleReturnToFull}
                                    className="font-medium px-2 py-0.5 rounded text-xs transition-colors border"
                                    style={{ backgroundColor: colors.containerBackground, color: colors.text, borderColor: `${colors.accentPrimary}33` }}
                                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${colors.accentPrimary}66`; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${colors.accentPrimary}33`; }}
                                >
                                    Return to Full
                                </button>
                            )}
                        </div>
                        {/* Interaction hints */}
                        <div className="flex items-center gap-4 text-xs" style={{ color: colors.textSecondary }}>
                            <span className="opacity-60">Click: Subgraph | Right-click: Ancestors</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area - Full Width */}
            <div className="flex-1 overflow-hidden flex min-h-0 min-w-0">
                {/* Temporal slider on left when temporal filter is enabled */}
                {temporalFilterEnabled && combinedTemporalState.maxTime > combinedTemporalState.minTime && (
                    <div className="flex-shrink-0 border-r px-3 py-4 flex items-center justify-center" style={{ backgroundColor: colors.background, borderRightColor: colors.border }}>
                        <TemporalRangeSlider
                            min={combinedTemporalState.minTime}
                            max={combinedTemporalState.maxTime}
                            step={(combinedTemporalState.maxTime - combinedTemporalState.minTime) / 100}
                            value={combinedTemporalState.range}
                            onChange={(newRange) => filteringState.setTemporalState(prev => ({ ...prev, range: newRange }))}
                            formatValue={(v) => v.toFixed(0)}
                            height={500}
                            filterMode={filteringState.temporalFilterMode === 'subset' ? 'subset' : 'highlight'}
                            onFilterModeChange={(mode) => filteringState.setTemporalFilterMode(mode === 'subset' ? 'subset' : 'dim')}
                            dimOpacity={filteringState.temporalDimOpacity}
                            onDimOpacityChange={filteringState.setTemporalDimOpacity}
                        />
                    </div>
                )}

                {/* Visualization + optional bottom slider */}
                <div className="flex-1 flex flex-col overflow-hidden min-h-0 min-w-0">
                    {/* Main visualization area */}
                    <div className="flex-1 overflow-hidden relative min-h-0 min-w-0">
                            <ForceDirectedGraph
                                key={`fdg-${sampleOrderControls.layoutVersion}-${sampleOrderControls.sampleOrder}`}
                                data={viewModeState.filteredData}
                                width={undefined}
                                height={undefined}
                                onNodeClick={viewModeState.handleNodeClick}
                                onNodeRightClick={viewModeState.handleNodeRightClick}
                                onEdgeClick={() => {}}
                                focalNode={viewModeState.selectedNode}
                                nodeSizes={visualizationSettings.nodeSizes}
                                nodeIdSettings={visualizationSettings.nodeIdSettings}
                                edgeLabelSettings={visualizationSettings.edgeLabelSettings}
                                edgeMutationSettings={visualizationSettings.edgeMutationSettings}
                                colorByPopulation={visualizationSettings.colorByPopulation}
                                sampleOrder={sampleOrderControls.sampleOrder}
                                edgeThickness={visualizationSettings.edgeThickness}
                                edgeOpacity={visualizationSettings.edgeOpacity}
                                temporalSpacingMode={visualizationSettings.temporalSpacingMode}
                                temporalSpacing={visualizationSettings.temporalSpacing}
                                sampleSpacing={visualizationSettings.sampleSpacing}
                                temporalRange={temporalFilterEnabled ? combinedTemporalState.range : undefined}
                                temporalDimOpacity={filteringState.temporalDimOpacity}
                                genomicRange={spatialFilterEnabled && filteringState.filterMode === 'genomic' && filteringState.genomicFilterMode === 'dim' ? filteringState.genomicRange : undefined}
                                genomicDimOpacity={filteringState.genomicDimOpacity}
                                treeRange={spatialFilterEnabled && filteringState.filterMode === 'tree' && filteringState.treeFilterMode === 'dim' ? filteringState.treeRange : undefined}
                                treeIntervals={spatialFilterEnabled && filteringState.filterMode === 'tree' && filteringState.treeFilterMode === 'dim' ? filteringState.treeIntervals : undefined}
                                treeDimOpacity={filteringState.treeDimOpacity}
                                simulationPaused={layerReveal.simulationPaused || simulationControls.manualSimulationPaused || temporalFilterEnabled}
                                unpinTrigger={simulationControls.unpinTrigger}
                                onEdgeCrossingsChange={edgeCrossingsControls.handleEdgeCrossingsChange}
                                forceTuning={forceTuningControls.forceTuning}
                                resetTrigger={simulationControls.resetTrigger}
                                clusteringEnabled={clusteringState.enabled}
                                clusteringMinTreeSize={clusteringState.minTreeSize}
                                clusteringRequireDensity={clusteringState.requireDensity}
                                clusteringDensityIntensity={clusteringState.densityIntensity}
                                clusteringRequireTemporalCompactness={clusteringState.requireTemporalCompactness}
                                clusteringTemporalIntensity={clusteringState.temporalIntensity}
                                clusteringMaxSampleClusterSize={clusteringState.maxSampleClusterSize}
                                combineInternalNodes={combineInternalNodes}
                                combineSampleNodes={combineSampleNodes}
                                ref={internalSvgRef}
                            />

                            {/* Floating Quick Actions Bar */}
                            <ForceDirectedGraphControls
                                // Filtering
                                sequenceLength={graphDataState.sequenceLength}
                                treeIntervals={filteringState.treeIntervals}
                                genomicRange={filteringState.genomicRange}
                                treeRange={filteringState.treeRange}
                                onGenomicRangeChange={filteringState.handleGenomicRangeChange}
                                onTreeRangeChange={filteringState.handleTreeRangeChange}
                                filterMode={filteringState.filterMode}
                                onFilterModeChange={filteringState.handleFilterModeChange}
                                genomicFilterMode={filteringState.genomicFilterMode === 'subset' ? 'subset' : 'highlight'}
                                treeFilterMode={filteringState.treeFilterMode === 'subset' ? 'subset' : 'highlight'}
                                onGenomicFilterModeChange={(mode) => filteringState.setGenomicFilterMode(mode === 'subset' ? 'subset' : 'dim')}
                                onTreeFilterModeChange={(mode) => filteringState.setTreeFilterMode(mode === 'subset' ? 'subset' : 'dim')}
                                genomicDimOpacity={filteringState.genomicDimOpacity}
                                treeDimOpacity={filteringState.treeDimOpacity}
                                onGenomicDimOpacityChange={filteringState.setGenomicDimOpacity}
                                onTreeDimOpacityChange={filteringState.setTreeDimOpacity}
                                isFilterActive={filteringState.isFilterActive}
                                // Filter toggles
                                spatialFilterEnabled={spatialFilterEnabled}
                                onSpatialFilterToggle={setSpatialFilterEnabled}
                                temporalFilterEnabled={temporalFilterEnabled}
                                onTemporalFilterToggle={setTemporalFilterEnabled}
                                // Temporal filtering
                                temporalState={combinedTemporalState}
                                onTemporalRangeChange={(range) => filteringState.setTemporalState(prev => ({ ...prev, range }))}
                                temporalFilterMode={filteringState.temporalFilterMode === 'subset' ? 'subset' : 'highlight'}
                                onTemporalFilterModeChange={(mode) => filteringState.setTemporalFilterMode(mode === 'subset' ? 'subset' : 'dim')}
                                temporalDimOpacity={filteringState.temporalDimOpacity}
                                onTemporalDimOpacityChange={filteringState.setTemporalDimOpacity}
                                // Styling - basic
                                colorByPopulation={visualizationSettings.colorByPopulation}
                                onColorByPopulationChange={visualizationSettings.setColorByPopulation}
                                hasPopulations={graphDataState.data?.metadata?.has_populations}
                                edgeThickness={visualizationSettings.edgeThickness}
                                onEdgeThicknessChange={visualizationSettings.setEdgeThickness}
                                edgeOpacity={visualizationSettings.edgeOpacity}
                                onEdgeOpacityChange={visualizationSettings.setEdgeOpacity}
                                // Styling - advanced
                                nodeSizes={visualizationSettings.nodeSizes}
                                onNodeSizesChange={visualizationSettings.setNodeSizes}
                                nodeIdSettings={visualizationSettings.nodeIdSettings}
                                onNodeIdSettingsChange={visualizationSettings.setNodeIdSettings}
                                combineInternalNodes={combineInternalNodes}
                                onCombineInternalNodesChange={setCombineInternalNodes}
                                combineSampleNodes={combineSampleNodes}
                                onCombineSampleNodesChange={setCombineSampleNodes}
                                edgeLabelSettings={visualizationSettings.edgeLabelSettings}
                                onEdgeLabelSettingsChange={visualizationSettings.setEdgeLabelSettings}
                                edgeMutationSettings={visualizationSettings.edgeMutationSettings}
                                onEdgeMutationSettingsChange={visualizationSettings.setEdgeMutationSettings}
                                // Sample order
                                sampleOrder={sampleOrderControls.sampleOrder}
                                onSampleOrderChange={(order) => sampleOrderControls.handleSampleOrderChange(order)}
                                // Layout (backwards compat)
                                layoutPreset={sampleOrderControls.sampleOrder}
                                onLayoutPresetChange={(preset) => sampleOrderControls.handleSampleOrderChange(preset as SampleOrderType)}
                                edgeCrossings={edgeCrossingsControls.edgeCrossings}
                                isCalculatingEdgeCrossings={edgeCrossingsControls.isCalculatingEdgeCrossings}
                                // Spacing
                                temporalSpacing={visualizationSettings.temporalSpacing}
                                sampleSpacing={visualizationSettings.sampleSpacing}
                                temporalSpacingMode={visualizationSettings.temporalSpacingMode}
                                onTemporalSpacingChange={visualizationSettings.setTemporalSpacing}
                                onSampleSpacingChange={visualizationSettings.setSampleSpacing}
                                onTemporalSpacingModeChange={visualizationSettings.setTemporalSpacingMode}
                                // Force tuning
                                forceTuning={forceTuningControls.forceTuning}
                                onForceTuningChange={forceTuningControls.setForceTuning}
                                // Simulation
                                simulationPaused={simulationControls.manualSimulationPaused}
                                onSimulationPausedChange={simulationControls.setManualSimulationPaused}
                                onResetSimulation={simulationControls.triggerReset}
                                onUnpinAllNodes={simulationControls.triggerUnpinAll}
                                // Animation
                                layerRevealEnabled={layerReveal.isPlaying}
                                layerRevealRate={layerReveal.rate}
                                onLayerRevealPlay={() => layerReveal.startReveal({ minTime: combinedTemporalState.minTime, maxTime: combinedTemporalState.maxTime })}
                                onLayerRevealPause={layerReveal.pauseReveal}
                                onLayerRevealReset={layerReveal.resetReveal}
                                onLayerRevealRateChange={layerReveal.setRate}
                                // Stats
                                nodeEdgeStats={graphDataState.data ? {
                                    originalNodes: graphDataState.data.metadata.original_num_nodes || treeSequence?.num_nodes || graphDataState.data.nodes.length,
                                    subsetNodes: graphDataState.subArgData?.nodes.length || graphDataState.data.nodes.length,
                                    displayedNodes: viewModeState.filteredData?.nodes.length || graphDataState.data.nodes.length,
                                    originalEdges: graphDataState.data.metadata.original_num_edges || treeSequence?.num_edges || graphDataState.data.edges.length,
                                    subsetEdges: graphDataState.subArgData?.edges.length || graphDataState.data.edges.length,
                                    displayedEdges: viewModeState.filteredData?.edges.length || graphDataState.data.edges.length,
                                } : undefined}
                                sequenceStats={treeSequence ? {
                                    samples: treeSequence.num_samples,
                                    sites: treeSequence.num_sites || 0,
                                    trees: treeSequence.num_trees,
                                    mutations: treeSequence.num_mutations || 0,
                                    populations: treeSequence.statistics?.num_populations || undefined,
                                    individuals: undefined,
                                } : graphDataState.data ? {
                                    samples: graphDataState.data.metadata.num_samples || graphDataState.data.nodes.filter((n: any) => n.is_sample).length,
                                    sites: graphDataState.data.metadata.sequence_length || 0,
                                    trees: graphDataState.data.metadata.num_local_trees || 1,
                                    mutations: graphDataState.data.metadata.num_mutations || 0,
                                    populations: graphDataState.data.metadata.populations?.length || undefined,
                                    individuals: graphDataState.data.metadata.num_individuals || undefined,
                                } : undefined}
                                popGenStats={treeSequence?.statistics}
                                windowPopGenStats={windowStatsResult.windowStats}
                                windowStatsLoading={windowStatsResult.isLoading}
                                isGenomicFilterActive={filteringState.isFilterActive && (filteringState.filterMode === 'genomic' || filteringState.filterMode === 'tree')}
                                // Filter summary
                                filterSummary={filteringState.isFilterActive ? {
                                    genomicRange: filteringState.filterMode === 'genomic' ? {
                                        start: filteringState.debouncedGenomicRange[0],
                                        end: filteringState.debouncedGenomicRange[1],
                                        sequenceLength: graphDataState.sequenceLength,
                                    } : undefined,
                                    treeRange: filteringState.filterMode === 'tree' ? {
                                        startIndex: filteringState.debouncedTreeRange[0],
                                        endIndex: filteringState.debouncedTreeRange[1],
                                        totalTrees: filteringState.treeIntervals.length,
                                    } : undefined,
                                    temporalRange: temporalFilterEnabled ? {
                                        min: combinedTemporalState.range[0],
                                        max: combinedTemporalState.range[1],
                                        originalMin: combinedTemporalState.minTime,
                                        originalMax: combinedTemporalState.maxTime,
                                    } : undefined,
                                    mode: (filteringState.filterMode === 'genomic' ? filteringState.genomicFilterMode : filteringState.treeFilterMode) === 'subset' ? 'subset' : 'highlight',
                                } : undefined}
                                // Clustering/Performance
                                clusteringEnabled={clusteringState.enabled}
                                onClusteringEnabledChange={clusteringState.handleClusteringEnabledChange}
                                // Export
                                filename={filename}
                                onDownloadPNG={handleDownloadPNG}
                                onDownloadSVG={handleDownloadSVG}
                                // Layout
                                floating={true}
                            />

                            {temporalFilterEnabled && (
                                <div className="absolute left-1/2 -translate-x-1/2 top-2 px-2.5 py-1.5 rounded text-xs font-semibold border shadow-sm" style={{ backgroundColor: `${colors.containerBackground}E6`, color: colors.text, borderColor: colors.border, backdropFilter: 'blur(2px)' }}>
                                    t = {combinedTemporalState.range[1].toFixed(0)}
                                </div>
                            )}

                            {/* Animation toggle button */}
                            {combinedTemporalState.maxTime > combinedTemporalState.minTime && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: 16,
                                    left: 16,
                                    zIndex: 100,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    gap: 8,
                                }}>
                                    {/* Play button */}
                                    <button
                                        onClick={() => setAnimationPopoutOpen(!animationPopoutOpen)}
                                        style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                            background: theme === 'liquid' ? colors.glassBackground : colors.containerBackground,
                                            backdropFilter: theme === 'liquid' ? 'blur(20px)' : 'blur(2px)',
                                            WebkitBackdropFilter: theme === 'liquid' ? 'blur(20px)' : 'blur(2px)',
                                            boxShadow: theme === 'liquid'
                                                ? `0 8px 32px ${colors.glassShadowPrimary}, 0 2px 8px ${colors.glassShadowSecondary}`
                                                : `0 4px 12px rgba(0, 0, 0, 0.15)`,
                                            border: `1px solid ${theme === 'liquid' ? colors.glassBorder : colors.border}`,
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'scale(1.05)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'scale(1)';
                                        }}
                                        title="Animation controls"
                                        aria-label={layerReveal.isPlaying ? 'Pause animation' : 'Play animation'}
                                    >
                                        {layerReveal.isPlaying ? (
                                            <Pause size={18} color={colors.accentPrimary} />
                                        ) : (
                                            <Play size={18} color={colors.accentPrimary} />
                                        )}
                                    </button>
                                </div>
                            )}

                            {/* Animation popout */}
                            <AnimationPopout
                                isOpen={animationPopoutOpen}
                                onClose={() => setAnimationPopoutOpen(false)}
                                state={{
                                    enabled: combinedTemporalState.maxTime > combinedTemporalState.minTime,
                                    isPlaying: layerReveal.isPlaying,
                                    rate: layerReveal.rate,
                                    progress: layerReveal.currentProgress,
                                    mode: layerReveal.mode,
                                }}
                                onPlay={() => layerReveal.startReveal({ minTime: combinedTemporalState.minTime, maxTime: combinedTemporalState.maxTime })}
                                onPause={layerReveal.pauseReveal}
                                onReset={layerReveal.resetReveal}
                                onRateChange={layerReveal.setRate}
                                onModeChange={layerReveal.setMode}
                                position="left"
                            />

                            {/* Legend Card - minimizable and draggable */}
                            <div
                                ref={legendRef}
                                className="absolute rounded-lg border shadow-sm select-none"
                                style={{
                                    bottom: '0.75rem',
                                    right: '0.75rem',
                                    backgroundColor: `${colors.containerBackground}F2`,
                                    borderColor: colors.border,
                                    backdropFilter: 'blur(4px)',
                                    cursor: 'grab',
                                    zIndex: 10,
                                }}
                                onMouseDown={handleLegendMouseDown}
                            >
                                {/* Header with title and minimize button */}
                                <div
                                    className="flex items-center justify-between gap-2 px-2 py-1.5"
                                >
                                    <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                                        Legend
                                    </span>
                                    <button
                                        onClick={handleLegendMinimize}
                                        className="p-0.5 rounded hover:bg-black/10 transition-colors"
                                        style={{ color: colors.textSecondary }}
                                        title="Toggle legend"
                                    >
                                        <svg
                                            ref={legendChevronRef}
                                            className="w-3 h-3"
                                            viewBox="0 0 12 12"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <path d="M3 7l3-3 3 3" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                </div>
                                {/* Legend content - collapsible via direct DOM */}
                                <div
                                    ref={legendContentRef}
                                    className="flex flex-col gap-1.5 px-2 py-1.5 border-t"
                                    style={{ borderTopColor: colors.border }}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: `rgb(${colors.nodeSample[0]}, ${colors.nodeSample[1]}, ${colors.nodeSample[2]})` }}></div>
                                        <span className="text-xs" style={{ color: colors.text }}>Sample</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: `rgb(${colors.nodeDefault[0]}, ${colors.nodeDefault[1]}, ${colors.nodeDefault[2]})` }}></div>
                                        <span className="text-xs" style={{ color: colors.text }}>Internal</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: `rgb(${colors.nodeRoot[0]}, ${colors.nodeRoot[1]}, ${colors.nodeRoot[2]})` }}></div>
                                        <span className="text-xs" style={{ color: colors.text }}>Root</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                                            <line x1="1" y1="1" x2="9" y2="9" stroke={`rgb(${colors.mutationMarker[0]}, ${colors.mutationMarker[1]}, ${colors.mutationMarker[2]})`} strokeWidth="2" strokeLinecap="round" />
                                            <line x1="9" y1="1" x2="1" y2="9" stroke={`rgb(${colors.mutationMarker[0]}, ${colors.mutationMarker[1]}, ${colors.mutationMarker[2]})`} strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                        <span className="text-xs" style={{ color: colors.text }}>Mutation</span>
                                    </div>
                                </div>
                            </div>
                    </div>

                    {/* Spatial (genomic/tree) slider at bottom when enabled - slider at top of section */}
                    {spatialFilterEnabled && (
                        <div className="flex-shrink-0 border-t px-4 pt-2 pb-1" style={{ backgroundColor: colors.background, borderTopColor: colors.border }}>
                            {filteringState.filterMode === 'genomic' && graphDataState.sequenceLength > 0 ? (
                                <RangeSlider
                                    min={0}
                                    max={graphDataState.sequenceLength}
                                    step={Math.max(1, Math.floor(graphDataState.sequenceLength / 1000))}
                                    value={filteringState.genomicRange}
                                    onChange={filteringState.handleGenomicRangeChange}
                                    formatValue={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(2)}Mb` : v >= 1000 ? `${(v / 1000).toFixed(1)}kb` : `${v}bp`}
                                    label="Genomic Range"
                                    filterMode={filteringState.genomicFilterMode === 'subset' ? 'subset' : 'highlight'}
                                    onFilterModeChange={(mode) => filteringState.setGenomicFilterMode(mode === 'subset' ? 'subset' : 'dim')}
                                    dimOpacity={filteringState.genomicDimOpacity}
                                    onDimOpacityChange={filteringState.setGenomicDimOpacity}
                                />
                            ) : filteringState.treeIntervals.length > 0 ? (
                                <TreeRangeSlider
                                    treeIntervals={filteringState.treeIntervals}
                                    value={filteringState.treeRange}
                                    onChange={filteringState.handleTreeRangeChange}
                                    label="Tree Range"
                                    filterMode={filteringState.treeFilterMode === 'subset' ? 'subset' : 'highlight'}
                                    onFilterModeChange={(mode) => filteringState.setTreeFilterMode(mode === 'subset' ? 'subset' : 'dim')}
                                    dimOpacity={filteringState.treeDimOpacity}
                                    onDimOpacityChange={filteringState.setTreeDimOpacity}
                                />
                            ) : null}
                        </div>
                    )}
                </div>
            </div>

            <AlertModal
                isOpen={clusteringState.showAutoClusteringNotification}
                title="Clustering Auto-Enabled"
                message="This graph has been automatically loaded with subtree-clustering enabled and dagre-d3 layout mode for optimal rendering performance due to its large size. You can adjust these settings from the sidebar if needed."
                buttonText="Got it"
                type="info"
                onClose={() => clusteringState.setShowAutoClusteringNotification(false)}
            />
        </div>
    );
});