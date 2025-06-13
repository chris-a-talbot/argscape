import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useColorTheme } from '../../context/ColorThemeContext';
import { useTreeSequence } from '../../context/TreeSequenceContext';
import { api } from '../../lib/api';
import { GraphData, GraphNode, GraphEdge, GeographicShape } from '../ForceDirectedGraph/ForceDirectedGraph.types';
import SpatialArgDiffVisualization from './SpatialArgDiffVisualization';
import { TreeSequenceSelectorModal } from '../ui/TreeSequenceSelectorModal';
import { useGeographicDiffState } from '../../hooks/useGeographicDiffState';
import { GeographicMode } from '../../hooks/useGeographicDiffState';
import { SpatialArgDiffControlPanel } from './SpatialArgDiffControlPanel';
import { TemporalSpacingMode } from '../SpatialArg3DVisualization/SpatialArg3DVisualization.types';

// Helper function to validate spatial data
const validateSpatialData = (graphData: GraphData): boolean => {
  const nodesWithSpatial = graphData.nodes.filter((node: GraphNode) => 
    node.location?.x !== undefined && node.location?.y !== undefined
  );
  return nodesWithSpatial.length > 0;
};

interface SpatialArgDiffVisualizationContainerProps {
  firstFilename: string;
  secondFilename: string;
}

// Default visual settings
const DEFAULT_VISUAL_SETTINGS = {
  temporalSpacing: 12,
  spatialSpacing: 160,
  temporalGridOpacity: 30,
  geographicShapeOpacity: 70,
  maxNodeRadius: 25,
  diffEdgeWidth: 3,
  temporalSpacingMode: 'equal' as TemporalSpacingMode
};

export const SpatialArgDiffVisualizationContainer: React.FC<SpatialArgDiffVisualizationContainerProps> = ({
  firstFilename,
  secondFilename
}) => {
  const { colors } = useColorTheme();
  const navigate = useNavigate();
  
  // Visual settings state
  const [temporalSpacing, setTemporalSpacing] = useState(DEFAULT_VISUAL_SETTINGS.temporalSpacing);
  const [spatialSpacing, setSpatialSpacing] = useState(DEFAULT_VISUAL_SETTINGS.spatialSpacing);
  const [temporalGridOpacity, setTemporalGridOpacity] = useState(DEFAULT_VISUAL_SETTINGS.temporalGridOpacity);
  const [geographicShapeOpacity, setGeographicShapeOpacity] = useState(DEFAULT_VISUAL_SETTINGS.geographicShapeOpacity);
  const [maxNodeRadius, setMaxNodeRadius] = useState(DEFAULT_VISUAL_SETTINGS.maxNodeRadius);
  const [diffEdgeWidth, setDiffEdgeWidth] = useState(DEFAULT_VISUAL_SETTINGS.diffEdgeWidth);
  const [temporalSpacingMode, setTemporalSpacingMode] = useState<TemporalSpacingMode>(DEFAULT_VISUAL_SETTINGS.temporalSpacingMode);
  const [selectedTreeSequenceToChange, setSelectedTreeSequenceToChange] = useState<'first' | 'second' | null>(null);
  const [viewState, setViewState] = useState({
    target: [0, 0, 0] as [number, number, number],
    zoom: 2.5,
    rotationX: 30,
    rotationOrbit: 0,
    orbitAxis: 'Y' as const
  });

  // Data loading state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [firstData, setFirstData] = useState<GraphData | null>(null);
  const [secondData, setSecondData] = useState<GraphData | null>(null);

  // Geographic state
  const {
    mode: geographicMode,
    setMode: setGeographicMode,
    currentShape,
    isLoading: isLoadingGeographic,
    customShapeFile,
    setCustomShapeFile,
    showCrsWarning,
    dismissCrsWarning,
    updateFromCrsDetection
  } = useGeographicDiffState();

  // Load both tree sequences in parallel
  useEffect(() => {
    const loadData = async () => {
      if (!firstFilename || !secondFilename) {
        setError('Both tree sequences must be provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Load both tree sequences in parallel
        const [firstResponse, secondResponse] = await Promise.all([
          api.getGraphData(firstFilename),
          api.getGraphData(secondFilename)
        ]);

        const firstData = firstResponse.data as GraphData;
        const secondData = secondResponse.data as GraphData;

        // Validate both datasets have spatial data
        if (!validateSpatialData(firstData) || !validateSpatialData(secondData)) {
          setError('Both tree sequences must have spatial data');
          setLoading(false);
          return;
        }

        setFirstData(firstData);
        setSecondData(secondData);

        // Handle CRS detection
        const firstCrsDetection = firstData.metadata?.coordinate_system_detection;
        const secondCrsDetection = secondData.metadata?.coordinate_system_detection;

        // Determine suggested mode based on CRS detections
        let suggestedMode: GeographicMode = 'unit_grid';
        if (firstCrsDetection && secondCrsDetection) {
          if (firstCrsDetection.likely_crs === 'EPSG:4326' && secondCrsDetection.likely_crs === 'EPSG:4326') {
            suggestedMode = 'eastern_hemisphere';
          }
        }

        // Update geographic state based on CRS detection
        updateFromCrsDetection(firstCrsDetection, secondCrsDetection, suggestedMode);

        setLoading(false);
      } catch (err) {
        setError('Failed to load tree sequences');
        setLoading(false);
      }
    };

    loadData();
  }, [firstFilename, secondFilename]);

  const handleTreeSequenceSelect = (treeSequence: any) => {
    if (!selectedTreeSequenceToChange) return;
    if (!treeSequence.has_temporal || !treeSequence.has_all_spatial) {
      // Show error modal
      return;
    }

    if (selectedTreeSequenceToChange === 'first') {
      if (treeSequence.filename === secondFilename) {
        // Show error modal - can't select same tree sequence
        return;
      }
      navigate(`/visualize-spatial-diff/${encodeURIComponent(treeSequence.filename)}?second=${encodeURIComponent(secondFilename)}`);
    } else {
      if (treeSequence.filename === firstFilename) {
        // Show error modal - can't select same tree sequence
        return;
      }
      navigate(`/visualize-spatial-diff/${encodeURIComponent(firstFilename)}?second=${encodeURIComponent(treeSequence.filename)}`);
    }
    setSelectedTreeSequenceToChange(null);
  };

  const handleDownload = async () => {
    if (!firstData || !secondData) return;

    // Create CSV content
    const rows = ['Node ID,First X,First Y,Second X,Second Y,Distance'];
    
    // Create a map of node IDs to their positions in both datasets
    const firstPositions = new Map(firstData.nodes.map(node => [node.id, node.location]));
    const secondPositions = new Map(secondData.nodes.map(node => [node.id, node.location]));

    // For each node in the first dataset, find its corresponding position in the second
    firstData.nodes.forEach(node => {
      const firstPos = firstPositions.get(node.id);
      const secondPos = secondPositions.get(node.id);
      
      if (firstPos && secondPos) {
        const distance = Math.sqrt(
          Math.pow(firstPos.x - secondPos.x, 2) + 
          Math.pow(firstPos.y - secondPos.y, 2)
        );
        
        rows.push([
          node.id,
          firstPos.x.toFixed(6),
          firstPos.y.toFixed(6),
          secondPos.x.toFixed(6),
          secondPos.y.toFixed(6),
          distance.toFixed(6)
        ].join(','));
      }
    });

    // Create and download the file
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spatial_diff_${firstFilename}_${secondFilename}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleViewStateChange = (newViewState: any) => {
    setViewState(prev => ({ ...prev, ...newViewState }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: colors.accentPrimary }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-lg mb-4" style={{ color: `${colors.text}`, opacity: 0.8, textShadow: '0 0 10px rgba(255, 0, 0, 0.5)' }}>{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded"
            style={{ backgroundColor: colors.accentPrimary, color: colors.background }}
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (!firstData || !secondData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-lg mb-4" style={{ color: `${colors.text}`, opacity: 0.8, textShadow: '0 0 10px rgba(255, 0, 0, 0.5)' }}>No data available</p>
          <p className="text-sm" style={{ color: `${colors.text}B3` }}>
            Both tree sequences must contain spatial information for all nodes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <SpatialArgDiffVisualization
        firstData={firstData}
        secondData={secondData}
        temporalSpacing={temporalSpacing}
        temporalSpacingMode={temporalSpacingMode}
        spatialSpacing={spatialSpacing}
        temporalGridOpacity={temporalGridOpacity}
        geographicShapeOpacity={geographicShapeOpacity}
        maxNodeRadius={maxNodeRadius}
        diffEdgeWidth={diffEdgeWidth}
        geographicMode={geographicMode}
        geographicShape={currentShape}
      />
      <SpatialArgDiffControlPanel
        temporalSpacing={temporalSpacing}
        onTemporalSpacingChange={setTemporalSpacing}
        temporalSpacingMode={temporalSpacingMode}
        onTemporalSpacingModeChange={setTemporalSpacingMode}
        spatialSpacing={spatialSpacing}
        onSpatialSpacingChange={setSpatialSpacing}
        temporalGridOpacity={temporalGridOpacity}
        onTemporalGridOpacityChange={setTemporalGridOpacity}
        geographicShapeOpacity={geographicShapeOpacity}
        onGeographicShapeOpacityChange={setGeographicShapeOpacity}
        maxNodeRadius={maxNodeRadius}
        onMaxNodeRadiusChange={setMaxNodeRadius}
        diffEdgeWidth={diffEdgeWidth}
        onDiffEdgeWidthChange={setDiffEdgeWidth}
        geographicMode={geographicMode}
        onGeographicModeChange={setGeographicMode}
        customShapeFile={customShapeFile}
        onCustomShapeFileChange={setCustomShapeFile}
        isLoadingGeographic={isLoadingGeographic}
        currentShape={currentShape}
        showCrsWarning={showCrsWarning}
        onDismissCrsWarning={dismissCrsWarning}
      />
    </div>
  );
};

export default SpatialArgDiffVisualizationContainer;