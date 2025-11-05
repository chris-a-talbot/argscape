import React from 'react';
import { useColorTheme } from '../../../context/ColorThemeContext';
import {
  SidebarSlider,
  SidebarCheckbox,
  SidebarButtonGroup,
  SidebarInfoBox,
  SidebarSubsection,
} from '../../ui/VisualizationSidebar';
import { GeographicShape, NodeSizeSettings } from '../ForceDirectedGraph/ForceDirectedGraph.types';
import { TemporalSpacingMode, NodeIdSettings, EdgeLabelSettings, EdgeMutationSettings, AncestryHeatmapSettings } from './SpatialArg3DVisualization.types';
import { Tooltip } from '../../ui/tooltip';

type GeographicMode = 'unit_grid' | 'eastern_hemisphere' | 'custom';

// ========== VISUALIZATION SECTION ==========
interface VisualizationSectionProps {
  // Geographic settings
  geographicMode: GeographicMode;
  onGeographicModeChange: (mode: GeographicMode) => void;
  customShapeFile?: File | null;
  onCustomShapeFileChange: (file: File | null) => void;
  geographicShapeOpacity: number;
  onGeographicShapeOpacityChange: (value: number) => void;
  isLoadingGeographic: boolean;
  currentShape?: GeographicShape | null;
  
  // Spacing settings
  temporalSpacing: number;
  onTemporalSpacingChange: (value: number) => void;
  temporalSpacingMode: TemporalSpacingMode;
  onTemporalSpacingModeChange: (mode: TemporalSpacingMode) => void;
  temporalGridOpacity: number;
  onTemporalGridOpacityChange: (value: number) => void;
  spatialSpacing: number;
  onSpatialSpacingChange: (value: number) => void;
  
  // Temporal filter state (for conditional heatmap controls)
  temporalFilterMode: 'hide' | 'planes' | 'hybrid';
  isTemporalFilterActive: boolean; // Whether temporal filtering is actually active
  
  // Heatmap settings
  heatmapSettings: AncestryHeatmapSettings;
  onHeatmapSettingsChange: (settings: AncestryHeatmapSettings) => void;
  
  // CRS warning
  showCrsWarning?: boolean;
  crsDetection?: any;
  onDismissCrsWarning?: () => void;
}

export const VisualizationSection: React.FC<VisualizationSectionProps> = ({
  geographicMode,
  onGeographicModeChange,
  customShapeFile,
  temporalFilterMode,
  isTemporalFilterActive,
  onCustomShapeFileChange,
  geographicShapeOpacity,
  onGeographicShapeOpacityChange,
  heatmapSettings,
  onHeatmapSettingsChange,
  isLoadingGeographic,
  currentShape,
  temporalSpacing,
  onTemporalSpacingChange,
  temporalSpacingMode,
  onTemporalSpacingModeChange,
  temporalGridOpacity,
  onTemporalGridOpacityChange,
  spatialSpacing,
  onSpatialSpacingChange,
  showCrsWarning,
  crsDetection,
  onDismissCrsWarning,
}) => {
  const { colors } = useColorTheme();

  const handleShapefileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onCustomShapeFileChange(file);
    }
  };

  return (
    <div className="space-y-4">
      {/* Geographic Settings */}
      <SidebarSubsection 
        title="Geographic Base" 
        tooltip="Choose the geographic coordinate system for positioning nodes in space"
      >
        <SidebarButtonGroup
          options={[
            { value: 'unit_grid', label: 'Unit Grid', tooltip: 'Simple grid from 0 to 1 in both dimensions' },
            { value: 'eastern_hemisphere', label: 'East Hemisphere', tooltip: 'Real-world map of the Eastern Hemisphere' },
            { value: 'custom', label: 'Custom', tooltip: 'Upload your own shapefile' },
          ]}
          value={geographicMode}
          onChange={(value) => onGeographicModeChange(value as GeographicMode)}
        />

        {geographicMode === 'custom' && (
          <div className="space-y-2 mt-2">
            <label className="text-xs font-semibold" style={{ color: colors.text }}>
              Upload Shapefile (.zip)
            </label>
            <input
              type="file"
              accept=".zip"
              onChange={handleShapefileUpload}
              className="w-full text-xs border rounded px-2 py-1 transition-colors"
              style={{
                color: colors.text,
                backgroundColor: colors.containerBackground,
                borderColor: `${colors.accentPrimary}33`,
              }}
            />
            {customShapeFile && (
              <p className="text-xs" style={{ color: colors.accentPrimary }}>
                Selected: {customShapeFile.name}
              </p>
            )}
          </div>
        )}

        <SidebarSlider
          label="Shape Opacity"
          value={geographicShapeOpacity}
          min={0}
          max={100}
          step={5}
          onChange={onGeographicShapeOpacityChange}
          unit="%"
        />

        {isLoadingGeographic && (
          <div className="flex items-center gap-2">
            <div
              className="animate-spin rounded-full h-3 w-3 border border-t-transparent"
              style={{ borderColor: colors.accentPrimary }}
            ></div>
            <span className="text-xs" style={{ color: `${colors.text}CC` }}>
              Loading geographic data...
            </span>
          </div>
        )}

        {currentShape && (
          <SidebarInfoBox>
            <div>Shape: {currentShape.name}</div>
            {currentShape.bounds && <div>Shape loaded successfully</div>}
          </SidebarInfoBox>
        )}

        {showCrsWarning && crsDetection && (
          <div
            className="border rounded p-2 space-y-2"
            style={{
              backgroundColor: `${colors.background}33`,
              borderColor: `${colors.accentPrimary}4D`,
            }}
          >
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold" style={{ color: colors.accentPrimary }}>
                Coordinate System Detected
              </h5>
              <button
                onClick={onDismissCrsWarning}
                className="text-xs"
                style={{ color: `${colors.accentPrimary}B3` }}
              >
                ✕
              </button>
            </div>
            <div className="text-xs space-y-1" style={{ color: `${colors.accentPrimary}E6` }}>
              <div>CRS: {crsDetection.crs}</div>
              <div>Confidence: {(crsDetection.confidence * 100).toFixed(1)}%</div>
              <div>Land coverage: {(crsDetection.landPercentage * 100).toFixed(1)}%</div>
              <div className="italic">{crsDetection.description}</div>
            </div>
          </div>
        )}
      </SidebarSubsection>

      {/* Spacing Settings */}
      <SidebarSubsection 
        title="Spacing & Layout" 
        tooltip="Control how nodes are spaced in time and space"
      >
        {/* Temporal Spacing */}
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold" style={{ color: colors.text }}>
              Temporal Mode
            </span>
            <Tooltip content="Controls how time layers are positioned. Equal: uniform spacing. Log: compresses recent time. Linear: proportional to actual time values." />
          </div>
          <SidebarButtonGroup
            options={[
              { value: 'equal', label: 'Equal', tooltip: 'All time layers spaced equally' },
              { value: 'log', label: 'Log', tooltip: 'Logarithmic spacing (compresses recent time)' },
              { value: 'linear', label: 'Linear', tooltip: 'Linear spacing (proportional to time)' },
            ]}
            value={temporalSpacingMode}
            onChange={(value) => onTemporalSpacingModeChange(value as TemporalSpacingMode)}
          />
        </div>

        <SidebarSlider
          label="Temporal Multiplier"
          value={temporalSpacing}
          min={5}
          max={50}
          step={1}
          onChange={onTemporalSpacingChange}
          unit="x"
          tooltip="Adjusts the overall spacing between time layers"
        />

        <SidebarSlider
          label="Temporal Grid Opacity"
          value={temporalGridOpacity}
          min={0}
          max={100}
          step={5}
          onChange={onTemporalGridOpacityChange}
          unit="%"
        />

        <SidebarSlider
          label="Geographic Multiplier"
          value={spatialSpacing}
          min={50}
          max={500}
          step={10}
          onChange={onSpatialSpacingChange}
          unit="x"
          tooltip="Adjusts the geographic spacing between nodes"
        />
      </SidebarSubsection>

      {/* Ancestry Heatmap */}
      <SidebarSubsection 
        title="Ancestry Density Heatmap" 
        tooltip="Visualize the spatial distribution of ancestors at the shapefile position"
      >
        <SidebarCheckbox
          label="Enable Heatmap"
          checked={heatmapSettings.enabled}
          onChange={(checked) => onHeatmapSettingsChange({ ...heatmapSettings, enabled: checked })}
          tooltip="Shows spatial density of nodes at/near the shapefile position"
        />

        {heatmapSettings.enabled && (
          <>
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold" style={{ color: colors.text }}>
                  Node Visibility
                </span>
                <Tooltip content="Which nodes to show when heatmap is enabled" />
              </div>
              <SidebarButtonGroup
                options={[
                  { value: 'all', label: 'All', tooltip: 'Show all nodes' },
                  { value: 'samples', label: 'Samples', tooltip: 'Show only sample nodes' },
                  { value: 'none', label: 'None', tooltip: 'Hide all nodes' },
                ]}
                value={heatmapSettings.nodeVisibility}
                onChange={(value) => onHeatmapSettingsChange({ ...heatmapSettings, nodeVisibility: value as 'all' | 'samples' | 'none' })}
              />
            </div>

            {/* Conditional time controls based on temporal filter state */}
            {isTemporalFilterActive && (temporalFilterMode === 'hybrid' || temporalFilterMode === 'planes') ? (
              // Temporal slider mode: Show single % slider for depth from top layer
              <SidebarSlider
                label="Time Depth from Top Layer"
                value={heatmapSettings.timeDepth}
                min={0}
                max={100}
                step={1}
                onChange={(value) => {
                  onHeatmapSettingsChange({ 
                    ...heatmapSettings, 
                    timeDepth: value,
                    // Keep min/max in sync for backward compatibility
                    timeRangeMin: 0,
                    timeRangeMax: value
                  });
                }}
                unit="%"
                tooltip="Percentage of time from the top layer toward present (z=0). 0% = top layer only, 100% = all nodes down to samples"
              />
            ) : (
              // Ground mode: Show min/max time range sliders
              <>
                <SidebarSlider
                  label="Time Range: Min"
                  value={heatmapSettings.timeRangeMin}
                  min={0}
                  max={100}
                  step={1}
                  onChange={(value) => {
                    const newMin = Math.min(value, heatmapSettings.timeRangeMax);
                    onHeatmapSettingsChange({ 
                      ...heatmapSettings, 
                      timeRangeMin: newMin,
                      timeDepth: heatmapSettings.timeRangeMax // Update deprecated field
                    });
                  }}
                  unit="%"
                  tooltip="Start of time range for heatmap: 0% = present (samples), 100% = oldest ancestors"
                />

                <SidebarSlider
                  label="Time Range: Max"
                  value={heatmapSettings.timeRangeMax}
                  min={0}
                  max={100}
                  step={1}
                  onChange={(value) => {
                    const newMax = Math.max(value, heatmapSettings.timeRangeMin);
                    onHeatmapSettingsChange({ 
                      ...heatmapSettings, 
                      timeRangeMax: newMax,
                      timeDepth: newMax // Update deprecated field
                    });
                  }}
                  unit="%"
                  tooltip="End of time range for heatmap: 0% = present (samples), 100% = oldest ancestors"
                />
              </>
            )}

            <SidebarSlider
              label="Grid Resolution"
              value={heatmapSettings.resolution}
              min={10}
              max={50}
              step={5}
              onChange={(value) => onHeatmapSettingsChange({ ...heatmapSettings, resolution: value })}
              unit=" cells"
              tooltip="Density of the heatmap grid (higher = more detailed)"
            />

            <SidebarSlider
              label="Heatmap Opacity"
              value={heatmapSettings.opacity}
              min={10}
              max={100}
              step={5}
              onChange={(value) => onHeatmapSettingsChange({ ...heatmapSettings, opacity: value })}
              unit="%"
              tooltip="Transparency of the heatmap overlay"
            />

            <SidebarCheckbox
              label="Weight by Time"
              checked={heatmapSettings.weightByTime}
              onChange={(checked) => onHeatmapSettingsChange({ ...heatmapSettings, weightByTime: checked })}
              tooltip="Down-weight older nodes (higher z) as less spatially informative. Emphasizes more recent nodes (lower z) with higher certainty."
            />
          </>
        )}
      </SidebarSubsection>
    </div>
  );
};

// ========== VIEW CONTROLS SECTION ==========
interface ViewControlsSectionProps {
  currentViewState: {
    target: [number, number, number];
    zoom: number;
    rotationX: number;
    rotationOrbit: number;
    orbitAxis: 'Y';
  };
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number;
    maxZ: number;
  } | null;
  onViewStateChange: (viewState: any) => void;
  autoRotationEnabled: boolean;
  autoRotationRate: number;
  onAutoRotationEnabledChange: (enabled: boolean) => void;
  onAutoRotationRateChange: (rate: number) => void;
  layerRevealEnabled: boolean;
  layerRevealPlaying: boolean;
  layerRevealRate: number;
  layerRevealMode: 'hide' | 'glide' | 'root-to-samples';
  onLayerRevealModeChange: (mode: 'hide' | 'glide' | 'root-to-samples') => void;
  onLayerRevealStart: () => void;
  onLayerRevealPause: () => void;
  onLayerRevealResume: () => void;
  onLayerRevealCancel: () => void;
  onLayerRevealRateChange: (rate: number) => void;
}

const ZOOM_LEVELS = {
  FIT: 1.8,
  MEDIUM: 1.2,
  FAR: 0.8,
};

export const ViewControlsSection: React.FC<ViewControlsSectionProps> = ({
  currentViewState,
  bounds,
  onViewStateChange,
  autoRotationEnabled,
  autoRotationRate,
  onAutoRotationEnabledChange,
  onAutoRotationRateChange,
  layerRevealEnabled,
  layerRevealPlaying,
  layerRevealRate,
  layerRevealMode,
  onLayerRevealModeChange,
  onLayerRevealStart,
  onLayerRevealPause,
  onLayerRevealResume,
  onLayerRevealCancel,
  onLayerRevealRateChange,
}) => {
  const { colors } = useColorTheme();

  const getCenterTarget = (): [number, number, number] => {
    if (!bounds) return [0, 0, 0];
    return [
      (bounds.minX + bounds.maxX) / 2,
      (bounds.minY + bounds.maxY) / 2,
      (bounds.minZ + bounds.maxZ) / 2,
    ];
  };

  const centerARG = () => {
    onViewStateChange({ target: getCenterTarget() });
  };

  const applyZoom = (zoom: number) => {
    onViewStateChange({
      target: getCenterTarget(),
      zoom,
    });
  };

  return (
    <div className="space-y-4">
      {/* Camera Controls */}
      <SidebarSubsection title="Camera" tooltip="Control the camera position and zoom level">
        <button
          onClick={centerARG}
          className="w-full px-3 py-2 text-xs font-medium rounded transition-colors flex items-center justify-center gap-2"
          style={{
            backgroundColor: colors.accentPrimary,
            color: colors.background,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v18m0 0l-4-4m4 4l4-4" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18m0 0l-4-4m4 4l-4 4" />
          </svg>
          Center View
        </button>

        <div className="space-y-2 mt-2">
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold" style={{ color: colors.text }}>
              Zoom Presets
            </span>
            <Tooltip content="Quick zoom to common viewing distances" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: ZOOM_LEVELS.FIT, label: 'Fit', icon: '🔍' },
              { value: ZOOM_LEVELS.MEDIUM, label: 'Medium', icon: '👁️' },
              { value: ZOOM_LEVELS.FAR, label: 'Far', icon: '🌐' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => applyZoom(option.value)}
                className="px-2 py-1.5 text-xs font-medium rounded transition-colors flex flex-col items-center gap-1"
                style={{
                  backgroundColor:
                    Math.abs(currentViewState.zoom - option.value) < 0.1
                      ? colors.accentPrimary
                      : colors.containerBackground,
                  color:
                    Math.abs(currentViewState.zoom - option.value) < 0.1
                      ? colors.background
                      : colors.text,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <span>{option.icon}</span>
                <span className="text-xs">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        <SidebarSlider
          label="Rotation"
          value={currentViewState.rotationOrbit}
          min={0}
          max={360}
          step={1}
          onChange={(value) => onViewStateChange({ rotationOrbit: value })}
          unit="°"
        />

        <SidebarSlider
          label="View Angle"
          value={currentViewState.rotationX}
          min={0}
          max={90}
          step={1}
          onChange={(value) => onViewStateChange({ rotationX: value })}
          unit="°"
        />
      </SidebarSubsection>

      {/* Animations */}
      <SidebarSubsection title="Animations" tooltip="Automated camera movements and layer reveals">
        <div className="space-y-3">
          {/* Auto-Rotation */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ color: colors.text }}>
                Auto-Rotation
              </span>
              <button
                onClick={() => onAutoRotationEnabledChange(!autoRotationEnabled)}
                className="px-2 py-1 text-xs font-medium rounded transition-colors"
                style={{
                  backgroundColor: autoRotationEnabled ? colors.accentPrimary : colors.containerBackground,
                  color: autoRotationEnabled ? colors.background : colors.text,
                  border: `1px solid ${autoRotationEnabled ? colors.accentPrimary : colors.border}`,
                }}
              >
                {autoRotationEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            {autoRotationEnabled && (
              <SidebarSlider
                label="Rotation Speed"
                value={autoRotationRate}
                min={1}
                max={60}
                step={1}
                onChange={onAutoRotationRateChange}
                unit="°/s"
              />
            )}
          </div>

          {/* Layer Reveal */}
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold" style={{ color: colors.text }}>
                Layer Reveal
              </span>
              <Tooltip content={layerRevealMode === 'root-to-samples' ? "Progressively reveal time layers from root (highest time) down to samples" : "Progressively reveal time layers from oldest to newest"} />
            </div>

            <div className="space-y-1">
              <label className="text-xs" style={{ color: `${colors.text}CC` }}>Animation Mode</label>
              <SidebarButtonGroup
                options={[
                  { value: 'hide', label: 'Add Layers', tooltip: 'Simply add layers one by one' },
                  { value: 'glide', label: 'Glide', tooltip: 'Dim lower layers and glide shapefile to current layer' },
                  { value: 'root-to-samples', label: 'Root to Samples', tooltip: 'Reveal from root down to samples' },
                ]}
                value={layerRevealMode}
                onChange={(value) => onLayerRevealModeChange(value as 'hide' | 'glide' | 'root-to-samples')}
                disabled={layerRevealEnabled}
              />
            </div>

            <SidebarSlider
              label="Reveal Speed"
              value={layerRevealRate}
              min={0.1}
              max={25}
              step={0.1}
              onChange={onLayerRevealRateChange}
              unit=" layers/s"
              formatValue={(v) => v.toFixed(1)}
            />

            <div className="grid grid-cols-3 gap-2">
              {!layerRevealEnabled ? (
                <button
                  onClick={onLayerRevealStart}
                  className="col-span-3 px-2 py-1.5 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1"
                  style={{
                    backgroundColor: colors.accentPrimary,
                    color: colors.background,
                  }}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  </svg>
                  Start Reveal
                </button>
              ) : (
                <>
                  <button
                    onClick={layerRevealPlaying ? onLayerRevealPause : onLayerRevealResume}
                    className="px-2 py-1.5 text-xs font-medium rounded transition-colors flex items-center justify-center"
                    style={{
                      backgroundColor: colors.accentPrimary,
                      color: colors.background,
                    }}
                  >
                    {layerRevealPlaying ? '⏸' : '▶'}
                  </button>
                  <button
                    onClick={onLayerRevealCancel}
                    className="col-span-2 px-2 py-1.5 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1"
                    style={{
                      backgroundColor: colors.containerBackground,
                      color: colors.text,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </SidebarSubsection>
    </div>
  );
};

// ========== ELEMENTS SECTION ==========
interface ElementsSectionProps {
  // Node settings
  nodeSizes: NodeSizeSettings;
  onNodeSizeChange: (sizes: NodeSizeSettings) => void;
  nodeIdSettings: NodeIdSettings;
  onNodeIdSettingsChange: (settings: NodeIdSettings) => void;
  
  // Edge settings
  edgeThickness: number;
  onEdgeThicknessChange: (value: number) => void;
  edgeOpacity: number;
  onEdgeOpacityChange: (value: number) => void;
  edgeLabelSettings: EdgeLabelSettings;
  onEdgeLabelSettingsChange: (settings: EdgeLabelSettings) => void;
  edgeMutationSettings: EdgeMutationSettings;
  onEdgeMutationSettingsChange: (settings: EdgeMutationSettings) => void;
}

export const ElementsSection: React.FC<ElementsSectionProps> = ({
  nodeSizes,
  onNodeSizeChange,
  nodeIdSettings,
  onNodeIdSettingsChange,
  edgeThickness,
  onEdgeThicknessChange,
  edgeOpacity,
  onEdgeOpacityChange,
  edgeLabelSettings,
  onEdgeLabelSettingsChange,
  edgeMutationSettings,
  onEdgeMutationSettingsChange,
}) => {
  const { colors } = useColorTheme();

  return (
    <div className="space-y-4">
      {/* Node Settings */}
      <SidebarSubsection title="Nodes" tooltip="Customize node appearance and labels">
        <SidebarSlider
          label="Sample Node Size"
          value={nodeSizes.sample}
          min={2}
          max={50}
          step={1}
          onChange={(value) => onNodeSizeChange({ ...nodeSizes, sample: value })}
          unit="x"
        />

        <SidebarSlider
          label="Root Node Size"
          value={nodeSizes.root}
          min={2}
          max={40}
          step={1}
          onChange={(value) => onNodeSizeChange({ ...nodeSizes, root: value })}
          unit="x"
        />

        <SidebarSlider
          label="Internal Node Size"
          value={nodeSizes.other}
          min={1}
          max={30}
          step={1}
          onChange={(value) => onNodeSizeChange({ ...nodeSizes, other: value })}
          unit="x"
        />

        <div className="space-y-2 mt-3">
          <div className="text-xs font-semibold" style={{ color: `${colors.accentPrimary}CC` }}>
            Node Labels
          </div>
          <SidebarCheckbox
            label="Sample IDs"
            checked={nodeIdSettings.showSampleIds}
            onChange={(checked) => onNodeIdSettingsChange({ ...nodeIdSettings, showSampleIds: checked })}
          />
          <SidebarCheckbox
            label="Root IDs"
            checked={nodeIdSettings.showRootIds}
            onChange={(checked) => onNodeIdSettingsChange({ ...nodeIdSettings, showRootIds: checked })}
          />
          <SidebarCheckbox
            label="Internal IDs"
            checked={nodeIdSettings.showInternalIds}
            onChange={(checked) => onNodeIdSettingsChange({ ...nodeIdSettings, showInternalIds: checked })}
          />
        </div>
      </SidebarSubsection>

      {/* Edge Settings */}
      <SidebarSubsection title="Edges" tooltip="Customize edge appearance and labels">
        <SidebarSlider
          label="Edge Width"
          value={edgeThickness}
          min={0.5}
          max={8}
          step={0.5}
          onChange={onEdgeThicknessChange}
          unit="x"
        />

        <SidebarSlider
          label="Edge Opacity"
          value={edgeOpacity}
          min={10}
          max={100}
          step={5}
          onChange={onEdgeOpacityChange}
          unit="%"
        />

        <div className="space-y-2 mt-3">
          <SidebarCheckbox
            label="Show Edge Labels"
            checked={edgeLabelSettings.showEdgeLabels}
            onChange={(checked) => onEdgeLabelSettingsChange({ ...edgeLabelSettings, showEdgeLabels: checked })}
          />

          {edgeLabelSettings.showEdgeLabels && (
            <SidebarSlider
              label="Label Font Size"
              value={edgeLabelSettings.labelFontSize}
              min={1}
              max={20}
              step={1}
              onChange={(value) => onEdgeLabelSettingsChange({ ...edgeLabelSettings, labelFontSize: value })}
              unit="px"
            />
          )}
        </div>

        <div className="space-y-2 mt-3">
          <SidebarCheckbox
            label="Show Mutation Markers"
            checked={edgeMutationSettings.showMutationMarkers}
            onChange={(checked) => onEdgeMutationSettingsChange({ ...edgeMutationSettings, showMutationMarkers: checked })}
          />

          {edgeMutationSettings.showMutationMarkers && (
            <SidebarSlider
              label="Marker Size"
              value={edgeMutationSettings.markerSize}
              min={8}
              max={30}
              step={1}
              onChange={(value) => onEdgeMutationSettingsChange({ ...edgeMutationSettings, markerSize: value })}
              unit="px"
            />
          )}
        </div>
      </SidebarSubsection>
    </div>
  );
};

// ========== INFORMATION SECTION ==========
interface InformationSectionProps {
  originalNodeCount?: number;
  originalEdgeCount?: number;
  subargNodeCount?: number;
  subargEdgeCount?: number;
  displayedNodeCount?: number;
  displayedEdgeCount?: number;
  crsDetection?: {
    crs: string;
    confidence: number;
    landPercentage: number;
    description: string;
  };
}

export const InformationSection: React.FC<InformationSectionProps> = ({
  originalNodeCount,
  originalEdgeCount,
  subargNodeCount,
  subargEdgeCount,
  displayedNodeCount,
  displayedEdgeCount,
  crsDetection,
}) => {
  const { colors } = useColorTheme();

  const nodePercentage = originalNodeCount && subargNodeCount 
    ? ((subargNodeCount / originalNodeCount) * 100).toFixed(1)
    : null;

  const edgePercentage = originalEdgeCount && subargEdgeCount 
    ? ((subargEdgeCount / originalEdgeCount) * 100).toFixed(1)
    : null;

  return (
    <div className="space-y-4">
      {/* Graph Statistics */}
      {(originalNodeCount || subargNodeCount || displayedNodeCount) && (
        <SidebarSubsection title="Graph Statistics">
          <div className="space-y-2 text-xs">
            {originalNodeCount && originalEdgeCount && (
              <div className="flex justify-between">
                <span style={{ color: colors.accentPrimary }}>Original ARG:</span>
                <span style={{ color: colors.text }}>
                  {originalNodeCount.toLocaleString()} nodes
                </span>
              </div>
            )}
            
            {subargNodeCount && subargEdgeCount && (
              <div className="flex justify-between">
                <span style={{ color: colors.accentPrimary }}>SubARG:</span>
                <span style={{ color: colors.text }}>
                  {subargNodeCount.toLocaleString()} nodes ({nodePercentage}%)
                </span>
              </div>
            )}
            
            {displayedNodeCount && displayedEdgeCount && (
              <div className="flex justify-between">
                <span style={{ color: colors.accentPrimary }}>Displayed:</span>
                <span style={{ color: colors.text }}>
                  {displayedNodeCount.toLocaleString()} nodes
                </span>
              </div>
            )}

            {displayedNodeCount && originalNodeCount && displayedNodeCount !== originalNodeCount && (
              <div className="flex justify-between">
                <span style={{ color: colors.accentPrimary }}>Reduction:</span>
                <span style={{ color: colors.text }}>
                  {((1 - displayedNodeCount / originalNodeCount) * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </SidebarSubsection>
      )}

      {/* CRS Information */}
      {crsDetection && (
        <SidebarSubsection title="Coordinate System">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span style={{ color: colors.accentPrimary }}>CRS:</span>
              <span style={{ color: colors.text }}>{crsDetection.crs}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: colors.accentPrimary }}>Confidence:</span>
              <span style={{ color: colors.text }}>{(crsDetection.confidence * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: colors.accentPrimary }}>Land Coverage:</span>
              <span style={{ color: colors.text }}>{(crsDetection.landPercentage * 100).toFixed(1)}%</span>
            </div>
            {crsDetection.description && (
              <SidebarInfoBox>
                <div className="italic">{crsDetection.description}</div>
              </SidebarInfoBox>
            )}
          </div>
        </SidebarSubsection>
      )}

      {/* Controls Help */}
      <SidebarSubsection title="Interaction Controls">
        <div className="space-y-1 text-xs" style={{ color: `${colors.text}CC` }}>
          <div>• <strong>Drag:</strong> Rotate view</div>
          <div>• <strong>Shift+drag:</strong> Pan view</div>
          <div>• <strong>Scroll:</strong> Zoom in/out</div>
          <div>• <strong>Left click:</strong> Select node</div>
          <div>• <strong>Right click:</strong> Show ancestors</div>
        </div>
      </SidebarSubsection>

      {/* Node Legend */}
      <SidebarSubsection title="Node Types">
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full border"
              style={{
                backgroundColor: `rgb(${colors.nodeSample[0]}, ${colors.nodeSample[1]}, ${colors.nodeSample[2]})`,
                borderColor: colors.background,
                borderWidth: '0.5px',
              }}
            ></div>
            <span style={{ color: colors.text }}>Sample Nodes</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: `rgb(${colors.nodeDefault[0]}, ${colors.nodeDefault[1]}, ${colors.nodeDefault[2]})`,
              }}
            ></div>
            <span style={{ color: colors.text }}>Internal Nodes</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: `rgb(${colors.nodeCombined[0]}, ${colors.nodeCombined[1]}, ${colors.nodeCombined[2]})`,
              }}
            ></div>
            <span style={{ color: colors.text }}>Combined Nodes</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full border-2"
              style={{
                backgroundColor: `rgb(${colors.nodeRoot[0]}, ${colors.nodeRoot[1]}, ${colors.nodeRoot[2]})`,
                borderColor: `rgb(${colors.nodeSelected[0]}, ${colors.nodeSelected[1]}, ${colors.nodeSelected[2]})`,
              }}
            ></div>
            <span style={{ color: colors.text }}>Root Nodes</span>
          </div>
        </div>
      </SidebarSubsection>
    </div>
  );
};

