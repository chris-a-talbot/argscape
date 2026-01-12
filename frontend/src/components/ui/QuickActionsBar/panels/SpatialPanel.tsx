/**
 * SpatialPanel Component
 *
 * Spatial settings panel for 3D visualizers in the Quick Actions Bar.
 * Provides geographic base, spacing controls, heatmap settings, and graph simplification.
 *
 * Sections:
 * - Geographic Base: Mode selection (Unit Grid, Eastern Hemisphere, Custom Shapefile)
 * - Spacing: Temporal mode, temporal/spatial spacing, grid opacity
 * - Ancestry Heatmap: Enable, time controls, opacity, resolution, node visibility
 * - Graph Simplification: Unary node retention (conditional)
 */

import React, { useRef } from 'react';
import { Globe, Layers, Grid3X3, Upload, Loader2, Minimize2 } from 'lucide-react';
import { useColorTheme } from '@/context/ColorThemeContext';
import { UnifiedSlider } from './UnifiedSlider';
import { FilterGroup } from './FilterGroup';
import type {
  SpatialPanelProps,
  GeographicMode,
  TemporalSpacingMode,
  HeatmapNodeVisibility,
} from './SpatialPanel.types';

export const SpatialPanel: React.FC<SpatialPanelProps> = ({
  // Geographic settings
  geographicMode = 'unit_grid',
  onGeographicModeChange,
  customShapeFile,
  onCustomShapeFileChange,
  geographicShapeOpacity = 80,
  onGeographicShapeOpacityChange,
  isLoadingGeographic = false,

  // Spacing settings
  temporalSpacing = 10,
  onTemporalSpacingChange,
  temporalSpacingMode = 'equal',
  onTemporalSpacingModeChange,
  spatialSpacing = 100,
  onSpatialSpacingChange,
  temporalGridOpacity = 50,
  onTemporalGridOpacityChange,

  // Heatmap settings
  heatmapSettings,
  onHeatmapSettingsChange,
  isTemporalFilterActive = false,

  // Unary retention
  unaryRetentionPercent,
  onUnaryRetentionPercentChange,

  className = '',
}) => {
  const { colors, theme } = useColorTheme();
  const isLiquid = theme === 'liquid';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track hovered buttons for styling
  const [hoveredGeoMode, setHoveredGeoMode] = React.useState<GeographicMode | null>(null);
  const [hoveredSpacingMode, setHoveredSpacingMode] = React.useState<TemporalSpacingMode | null>(null);
  const [hoveredNodeVisibility, setHoveredNodeVisibility] = React.useState<HeatmapNodeVisibility | null>(null);

  // Check what controls are available
  const hasGeographicControls = onGeographicModeChange !== undefined;
  const hasSpacingControls =
    onTemporalSpacingChange !== undefined ||
    onTemporalSpacingModeChange !== undefined ||
    onSpatialSpacingChange !== undefined ||
    onTemporalGridOpacityChange !== undefined;
  const hasHeatmapControls = heatmapSettings !== undefined && onHeatmapSettingsChange !== undefined;
  const hasUnaryRetention = onUnaryRetentionPercentChange !== undefined;

  // Styles
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    width: '100%',
  };

  const sectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '0.5rem',
    background: isLiquid ? 'rgba(20, 226, 168, 0.02)' : colors.hoverOverlay,
    borderRadius: '0.375rem',
    border: `1px solid ${colors.border}`,
  };

  const buttonGroupStyle: React.CSSProperties = {
    display: 'flex',
    gap: '0.25rem',
    flexWrap: 'wrap',
  };

  const getButtonStyle = (isActive: boolean, isHovered: boolean): React.CSSProperties => ({
    padding: '0.375rem 0.625rem',
    border: `1px solid ${isActive ? colors.accentPrimary : colors.border}`,
    borderRadius: '0.375rem',
    background: isActive
      ? isLiquid
        ? 'rgba(20, 226, 168, 0.15)'
        : `${colors.accentPrimary}20`
      : isHovered
        ? colors.hoverOverlay
        : colors.containerBackground,
    color: isActive ? colors.accentPrimary : colors.text,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontSize: '0.75rem',
    fontWeight: isActive ? 600 : 400,
  });

  const uploadButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.375rem',
    padding: '0.5rem 0.75rem',
    border: `1px dashed ${colors.border}`,
    borderRadius: '0.375rem',
    background: colors.containerBackground,
    color: colors.textSecondary,
    cursor: isLoadingGeographic ? 'wait' : 'pointer',
    transition: 'all 0.15s ease',
    fontSize: '0.75rem',
    width: '100%',
    marginTop: '0.25rem',
  };

  const checkboxContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
  };

  const checkboxStyle: React.CSSProperties = {
    width: '0.875rem',
    height: '0.875rem',
    accentColor: colors.accentPrimary,
    cursor: 'pointer',
  };

  const checkboxLabelStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: colors.text,
    cursor: 'pointer',
  };

  const fileNameStyle: React.CSSProperties = {
    fontSize: '0.6875rem',
    color: colors.textSecondary,
    marginTop: '0.25rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  // Geographic mode options
  const geographicModes: { id: GeographicMode; label: string }[] = [
    { id: 'unit_grid', label: 'Unit Grid' },
    { id: 'eastern_hemisphere', label: 'Eastern Hem.' },
    { id: 'custom', label: 'Custom' },
  ];

  // Temporal spacing mode options
  const spacingModes: { id: TemporalSpacingMode; label: string }[] = [
    { id: 'equal', label: 'Equal' },
    { id: 'log', label: 'Log' },
    { id: 'linear', label: 'Linear' },
  ];

  // Node visibility options
  const nodeVisibilityOptions: { id: HeatmapNodeVisibility; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'samples', label: 'Samples' },
    { id: 'none', label: 'None' },
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onCustomShapeFileChange) {
      onCustomShapeFileChange(file);
    }
    // Reset input to allow re-uploading the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    if (!isLoadingGeographic && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const updateHeatmapSettings = (updates: Partial<typeof heatmapSettings>) => {
    if (heatmapSettings && onHeatmapSettingsChange) {
      onHeatmapSettingsChange({ ...heatmapSettings, ...updates });
    }
  };

  return (
    <div style={containerStyle} className={className}>
      {/* Geographic Base Section */}
      {hasGeographicControls && (
        <FilterGroup label="Geographic Base" icon={<Globe size={16} />}>
          <div style={sectionStyle}>
            {/* Mode selection buttons */}
            <div style={buttonGroupStyle}>
              {geographicModes.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  style={getButtonStyle(geographicMode === mode.id, hoveredGeoMode === mode.id)}
                  onClick={() => onGeographicModeChange?.(mode.id)}
                  onMouseEnter={() => setHoveredGeoMode(mode.id)}
                  onMouseLeave={() => setHoveredGeoMode(null)}
                  aria-pressed={geographicMode === mode.id}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {/* Custom shapefile upload (when mode is 'custom') */}
            {geographicMode === 'custom' && onCustomShapeFileChange && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  aria-label="Upload shapefile"
                />
                <button
                  type="button"
                  style={uploadButtonStyle}
                  onClick={handleUploadClick}
                  disabled={isLoadingGeographic}
                >
                  {isLoadingGeographic ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      <span>Upload Shapefile (.zip)</span>
                    </>
                  )}
                </button>
                {customShapeFile && (
                  <div style={fileNameStyle} title={customShapeFile.name}>
                    {customShapeFile.name}
                  </div>
                )}
              </>
            )}

            {/* Shape Opacity slider */}
            {onGeographicShapeOpacityChange && (
              <UnifiedSlider
                label="Shape Opacity"
                value={geographicShapeOpacity}
                min={0}
                max={100}
                step={1}
                unit="%"
                onChange={onGeographicShapeOpacityChange}
                showValue={true}
                compact={true}
              />
            )}
          </div>
        </FilterGroup>
      )}

      {/* Spacing Section */}
      {hasSpacingControls && (
        <FilterGroup label="Spacing" icon={<Layers size={16} />}>
          <div style={sectionStyle}>
            {/* Temporal Mode buttons */}
            {onTemporalSpacingModeChange && (
              <div style={{ marginBottom: '0.5rem' }}>
                <div style={{ fontSize: '0.6875rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>
                  Temporal Mode
                </div>
                <div style={buttonGroupStyle}>
                  {spacingModes.map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      style={getButtonStyle(temporalSpacingMode === mode.id, hoveredSpacingMode === mode.id)}
                      onClick={() => onTemporalSpacingModeChange?.(mode.id)}
                      onMouseEnter={() => setHoveredSpacingMode(mode.id)}
                      onMouseLeave={() => setHoveredSpacingMode(null)}
                      aria-pressed={temporalSpacingMode === mode.id}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Temporal Spacing slider */}
            {onTemporalSpacingChange && (
              <UnifiedSlider
                label="Temporal Spacing"
                value={temporalSpacing}
                min={1}
                max={50}
                step={1}
                onChange={onTemporalSpacingChange}
                showValue={true}
                compact={true}
              />
            )}

            {/* Spatial Spacing slider */}
            {onSpatialSpacingChange && (
              <UnifiedSlider
                label="Spatial Spacing"
                value={spatialSpacing}
                min={50}
                max={500}
                step={10}
                onChange={onSpatialSpacingChange}
                showValue={true}
                compact={true}
              />
            )}

            {/* Grid Opacity slider */}
            {onTemporalGridOpacityChange && (
              <UnifiedSlider
                label="Grid Opacity"
                value={temporalGridOpacity}
                min={0}
                max={100}
                step={1}
                unit="%"
                onChange={onTemporalGridOpacityChange}
                showValue={true}
                compact={true}
              />
            )}
          </div>
        </FilterGroup>
      )}

      {/* Ancestry Heatmap Section */}
      {hasHeatmapControls && (
        <FilterGroup label="Ancestry Heatmap" icon={<Grid3X3 size={16} />}>
          <div style={sectionStyle}>
            {/* Enable checkbox */}
            <label style={checkboxContainerStyle}>
              <input
                type="checkbox"
                checked={heatmapSettings.enabled}
                onChange={(e) => updateHeatmapSettings({ enabled: e.target.checked })}
                style={checkboxStyle}
              />
              <span style={checkboxLabelStyle}>Enable Heatmap</span>
            </label>

            {/* Heatmap controls (when enabled) */}
            {heatmapSettings.enabled && (
              <>
                {/* Time controls - different based on temporal filter state */}
                {isTemporalFilterActive ? (
                  <UnifiedSlider
                    label="Time Depth"
                    value={heatmapSettings.timeDepth}
                    min={0}
                    max={100}
                    step={1}
                    unit="%"
                    onChange={(v) => updateHeatmapSettings({ timeDepth: v })}
                    showValue={true}
                    compact={true}
                  />
                ) : (
                  <>
                    <UnifiedSlider
                      label="Time Range Min"
                      value={heatmapSettings.timeRangeMin}
                      min={0}
                      max={100}
                      step={1}
                      unit="%"
                      onChange={(v) => updateHeatmapSettings({ timeRangeMin: v })}
                      showValue={true}
                      compact={true}
                    />
                    <UnifiedSlider
                      label="Time Range Max"
                      value={heatmapSettings.timeRangeMax}
                      min={0}
                      max={100}
                      step={1}
                      unit="%"
                      onChange={(v) => updateHeatmapSettings({ timeRangeMax: v })}
                      showValue={true}
                      compact={true}
                    />
                  </>
                )}

                {/* Opacity slider */}
                <UnifiedSlider
                  label="Opacity"
                  value={heatmapSettings.opacity}
                  min={10}
                  max={100}
                  step={1}
                  unit="%"
                  onChange={(v) => updateHeatmapSettings({ opacity: v })}
                  showValue={true}
                  compact={true}
                />

                {/* Resolution slider */}
                <UnifiedSlider
                  label="Resolution"
                  value={heatmapSettings.resolution}
                  min={10}
                  max={50}
                  step={1}
                  onChange={(v) => updateHeatmapSettings({ resolution: v })}
                  showValue={true}
                  compact={true}
                />

                {/* Node Visibility buttons */}
                <div style={{ marginTop: '0.25rem' }}>
                  <div style={{ fontSize: '0.6875rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>
                    Node Visibility
                  </div>
                  <div style={buttonGroupStyle}>
                    {nodeVisibilityOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        style={getButtonStyle(
                          heatmapSettings.nodeVisibility === option.id,
                          hoveredNodeVisibility === option.id
                        )}
                        onClick={() => updateHeatmapSettings({ nodeVisibility: option.id })}
                        onMouseEnter={() => setHoveredNodeVisibility(option.id)}
                        onMouseLeave={() => setHoveredNodeVisibility(null)}
                        aria-pressed={heatmapSettings.nodeVisibility === option.id}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Weight by time checkbox */}
                <label style={{ ...checkboxContainerStyle, marginTop: '0.25rem' }}>
                  <input
                    type="checkbox"
                    checked={heatmapSettings.weightByTime}
                    onChange={(e) => updateHeatmapSettings({ weightByTime: e.target.checked })}
                    style={checkboxStyle}
                  />
                  <span style={checkboxLabelStyle}>Weight by time</span>
                </label>
              </>
            )}
          </div>
        </FilterGroup>
      )}

      {/* Graph Simplification Section (conditional) */}
      {hasUnaryRetention && (
        <FilterGroup label="Graph Simplification" icon={<Minimize2 size={16} />}>
          <div style={sectionStyle}>
            <UnifiedSlider
              label="Unary Node Retention"
              value={unaryRetentionPercent ?? 100}
              min={0}
              max={100}
              step={1}
              unit="%"
              onChange={onUnaryRetentionPercentChange}
              showValue={true}
              compact={true}
              description="Percentage of unary nodes to keep in the graph"
            />
          </div>
        </FilterGroup>
      )}
    </div>
  );
};

export default SpatialPanel;
