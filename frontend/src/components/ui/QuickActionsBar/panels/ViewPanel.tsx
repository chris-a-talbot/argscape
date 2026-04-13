/**
 * ViewPanel Component
 *
 * View controls panel for the Quick Actions Bar.
 *
 * Essential (always visible):
 * - 2D: Sample order, Spacing mode (Equal/Linear/Log), Layout preset
 * - 3D: Camera presets, Auto-rotation toggle
 *
 * Advanced (in "More options"):
 * - Spacing sliders (vertical/horizontal)
 * - Force tuning parameters
 * - Simulation controls
 * - Animation controls
 */

import React from 'react';
import { useColorTheme } from '@/context/ColorThemeContext';
import type { ViewPanelProps, TemporalSpacingMode, SampleOrderType, ForceTuningSettings } from './ViewPanel.types';
import { CameraPresetPicker } from './CameraPresetPicker';
import { LayoutPresetPicker } from './LayoutPresetPicker';
import { AnimationControls } from './AnimationControls';
import { MoreOptionsExpander } from '../components/MoreOptionsExpander';

// Sample order options
const SAMPLE_ORDER_OPTIONS: { value: SampleOrderType; label: string }[] = [
  { value: 'numeric', label: 'Numeric' },
  { value: 'first_minlex', label: 'First Tree' },
  { value: 'center_minlex', label: 'Center Tree' },
  { value: 'consensus_minlex', label: 'Consensus' },
  { value: 'ancestral_path', label: 'Ancestral' },
  { value: 'coalescence_minlex', label: 'Coalescence' },
  { value: 'dagre', label: 'Dagre' },
];

// Spacing mode options
const SPACING_MODE_OPTIONS: { value: TemporalSpacingMode; label: string; description: string }[] = [
  { value: 'equal', label: 'Equal', description: 'Uniform spacing between layers' },
  { value: 'linear', label: 'Linear', description: 'Proportional to time' },
  { value: 'log', label: 'Log', description: 'Logarithmic for coalescent' },
];

/**
 * Compact slider component
 */
const CompactSlider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  formatValue?: (v: number) => string;
}> = ({ label, value, min, max, step, onChange, formatValue }) => {
  const { colors } = useColorTheme();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
        <span style={{ color: colors.text, opacity: 0.8 }}>{label}</span>
        <span style={{ color: colors.text, fontWeight: 500 }}>
          {formatValue ? formatValue(value) : value.toFixed(step >= 1 ? 0 : 1)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{
          width: '100%',
          height: '4px',
          borderRadius: '2px',
          background: colors.border,
          appearance: 'none',
          cursor: 'pointer',
          accentColor: colors.accentPrimary,
        }}
      />
    </div>
  );
};

/**
 * Button group for selecting options
 */
const ButtonGroup: React.FC<{
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  disabledValues?: Set<string>;
  disabledTitle?: string;
}> = ({ options, value, onChange, disabledValues, disabledTitle }) => {
  const { colors, theme } = useColorTheme();
  const isLiquid = theme === 'liquid';

  return (
    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
      {options.map((opt) => {
        const isSelected = value === opt.value;
        const isDisabled = disabledValues?.has(opt.value) ?? false;
        return (
          <button
            key={opt.value}
            onClick={() => !isDisabled && onChange(opt.value)}
            disabled={isDisabled}
            title={isDisabled ? disabledTitle : undefined}
            style={{
              padding: '0.375rem 0.625rem',
              fontSize: '0.75rem',
              fontWeight: 500,
              border: `1px solid ${isSelected ? colors.accentPrimary : colors.border}`,
              borderRadius: '0.25rem',
              background: isSelected
                ? (isLiquid ? 'rgba(20, 226, 168, 0.15)' : `${colors.accentPrimary}20`)
                : 'transparent',
              color: isSelected ? colors.accentPrimary : colors.text,
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              opacity: isDisabled ? 0.35 : 1,
              transition: 'all 0.15s ease',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

/**
 * Compact checkbox
 */
const CompactCheckbox: React.FC<{
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ label, checked, onChange }) => {
  const { colors } = useColorTheme();

  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: '0.875rem', height: '0.875rem', accentColor: colors.accentPrimary }}
      />
      <span style={{ fontSize: '0.75rem', color: colors.text }}>{label}</span>
    </label>
  );
};

/**
 * Compact action button
 */
const CompactButton: React.FC<{
  label: string;
  onClick: () => void;
  variant?: 'default' | 'primary';
}> = ({ label, onClick, variant = 'default' }) => {
  const { colors } = useColorTheme();

  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.375rem 0.75rem',
        fontSize: '0.75rem',
        fontWeight: 500,
        border: `1px solid ${variant === 'primary' ? colors.accentPrimary : colors.border}`,
        borderRadius: '0.25rem',
        background: variant === 'primary' ? colors.accentPrimary : 'transparent',
        color: variant === 'primary' ? colors.buttonText : colors.text,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
    >
      {label}
    </button>
  );
};

export const ViewPanel: React.FC<ViewPanelProps> = ({
  visualizerType,
  // 3D props
  cameraPreset = 'fit',
  onCameraPresetChange,
  cameraState,
  autoRotationEnabled = false,
  autoRotationRate = 10,
  onAutoRotationToggle,
  onAutoRotationRateChange,
  // 2D props
  layoutPreset = 'numeric',
  onLayoutPresetChange,
  edgeCrossings,
  isCalculatingEdgeCrossings,
  temporalSpacing = 10,
  sampleSpacing = 40,
  temporalSpacingMode = 'equal',
  onTemporalSpacingChange,
  onSampleSpacingChange,
  onTemporalSpacingModeChange,
  simulationPaused = false,
  onSimulationPausedChange,
  onResetSimulation,
  onUnpinAllNodes,
  sampleOrder = 'consensus_minlex',
  onSampleOrderChange,
  forceDagre = false,
  forceTuning,
  onForceTuningChange,
  // Clustering/Performance
  clusteringEnabled = false,
  onClusteringEnabledChange,
  // Visibility toggles (2D)
  nodeIdSettings,
  onNodeIdSettingsChange,
  showEdgeLabels,
  onShowEdgeLabelsChange,
  showMutationMarkers,
  onShowMutationMarkersChange,
  // Common props
  animationState,
  onAnimationPlay,
  onAnimationPause,
  onAnimationReset,
  onAnimationRateChange,
  onAnimationModeChange,
  className = ''
}) => {
  const { colors, theme } = useColorTheme();
  const isLiquid = theme === 'liquid';

  // Styles - compact with clear sections
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    width: '100%',
  };

  const disabledSampleOrders = forceDagre
    ? new Set(SAMPLE_ORDER_OPTIONS.filter(o => o.value !== 'dagre').map(o => o.value))
    : undefined;

  const sectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '0.5rem',
    background: isLiquid ? 'rgba(20, 226, 168, 0.02)' : colors.hoverOverlay,
    borderRadius: '0.375rem',
    border: `1px solid ${colors.border}`,
  };

  const sectionHeaderStyle: React.CSSProperties = {
    fontSize: '0.625rem',
    fontWeight: 600,
    color: colors.accentPrimary,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.125rem',
  };

  const compactBoxStyle: React.CSSProperties = {
    // Not needed - section provides styling
  };

  const infoTextStyle: React.CSSProperties = {
    fontSize: '0.625rem',
    color: colors.textSecondary,
    opacity: 0.8,
  };

  // Check what advanced options are available
  const hasSpacingControls = onTemporalSpacingChange && onSampleSpacingChange;
  const hasSimulationControls = onSimulationPausedChange || onResetSimulation || onUnpinAllNodes;
  const hasForceTuning = forceTuning && onForceTuningChange;
  const has3DRotation = onAutoRotationToggle && autoRotationEnabled && onAutoRotationRateChange;
  const hasClusteringControls = onClusteringEnabledChange !== undefined;

  const hasAdvancedOptions = hasSpacingControls || hasSimulationControls ||
    hasForceTuning || has3DRotation || hasClusteringControls;

  // Two-column grid layout for 2D controls
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.5rem',
  };

  const columnStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
    padding: '0.5rem',
    background: isLiquid ? 'rgba(20, 226, 168, 0.02)' : colors.hoverOverlay,
    borderRadius: '0.375rem',
    border: `1px solid ${colors.border}`,
  };

  return (
    <div style={containerStyle} className={className}>
      {/* 3D: Camera Presets */}
      {visualizerType === '3d' && onCameraPresetChange && (
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>Camera</div>
          <CameraPresetPicker
            currentPreset={cameraPreset}
            onPresetSelect={onCameraPresetChange}
            currentState={cameraState}
          />
          {onAutoRotationToggle && (
            <CompactCheckbox
              label="Auto-rotate"
              checked={autoRotationEnabled}
              onChange={onAutoRotationToggle}
            />
          )}
        </div>
      )}

      {/* 2D: Sample Order + Temporal Spacing in two columns */}
      {visualizerType === '2d' && (onSampleOrderChange || onTemporalSpacingModeChange) && (
        <div style={gridStyle}>
          {/* Sample Order column */}
          {onSampleOrderChange && (
            <div style={columnStyle}>
              <div style={sectionHeaderStyle}>Sample Order</div>
              <ButtonGroup
                options={SAMPLE_ORDER_OPTIONS}
                value={sampleOrder}
                onChange={(v) => onSampleOrderChange(v as SampleOrderType)}
                disabledValues={disabledSampleOrders}
                disabledTitle="Dagre-d3 is required for 500+ samples"
              />
              {edgeCrossings !== null && edgeCrossings !== undefined && (
                <div style={infoTextStyle}>
                  Crossings: {isCalculatingEdgeCrossings ? '...' : edgeCrossings.toLocaleString()}
                </div>
              )}
            </div>
          )}

          {/* Temporal Spacing column */}
          {onTemporalSpacingModeChange && (
            <div style={columnStyle}>
              <div style={sectionHeaderStyle}>Temporal Spacing</div>
              <ButtonGroup
                options={SPACING_MODE_OPTIONS}
                value={temporalSpacingMode}
                onChange={(v) => onTemporalSpacingModeChange(v as TemporalSpacingMode)}
              />
            </div>
          )}
        </div>
      )}

      {/* 2D: Visibility Toggles - Show/hide labels and markers */}
      {visualizerType === '2d' && (onNodeIdSettingsChange || onShowEdgeLabelsChange || onShowMutationMarkersChange) && (
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>Show Labels</div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Node IDs */}
            {nodeIdSettings && onNodeIdSettingsChange && (
              <>
                <CompactCheckbox
                  label="Sample IDs"
                  checked={nodeIdSettings.showSampleIds}
                  onChange={(checked) => onNodeIdSettingsChange({ ...nodeIdSettings, showSampleIds: checked })}
                />
                <CompactCheckbox
                  label="Root IDs"
                  checked={nodeIdSettings.showRootIds}
                  onChange={(checked) => onNodeIdSettingsChange({ ...nodeIdSettings, showRootIds: checked })}
                />
                <CompactCheckbox
                  label="Internal IDs"
                  checked={nodeIdSettings.showInternalIds}
                  onChange={(checked) => onNodeIdSettingsChange({ ...nodeIdSettings, showInternalIds: checked })}
                />
              </>
            )}
            {/* Edge Labels */}
            {onShowEdgeLabelsChange && (
              <CompactCheckbox
                label="Edge Labels"
                checked={showEdgeLabels || false}
                onChange={onShowEdgeLabelsChange}
              />
            )}
            {/* Mutation Markers */}
            {onShowMutationMarkersChange && (
              <CompactCheckbox
                label="Mutations"
                checked={showMutationMarkers || false}
                onChange={onShowMutationMarkersChange}
              />
            )}
          </div>
        </div>
      )}

      {/* Advanced Options */}
      {hasAdvancedOptions && (
        <MoreOptionsExpander label="Advanced" showDivider={true}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* 3D: Rotation speed */}
            {has3DRotation && (
              <div style={sectionStyle}>
                <div style={sectionHeaderStyle}>Rotation Speed</div>
                <CompactSlider
                  label="Speed"
                  value={autoRotationRate}
                  min={1}
                  max={60}
                  step={1}
                  onChange={onAutoRotationRateChange!}
                  formatValue={(v) => `${v}°/s`}
                />
              </div>
            )}

            {/* 2D: Spacing sliders - 2 columns */}
            {hasSpacingControls && (
              <div style={sectionStyle}>
                <div style={sectionHeaderStyle}>Spacing</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <CompactSlider
                    label="Vertical"
                    value={temporalSpacing}
                    min={0.1}
                    max={20}
                    step={0.1}
                    onChange={onTemporalSpacingChange!}
                  />
                  <CompactSlider
                    label="Horizontal"
                    value={sampleSpacing}
                    min={5}
                    max={800}
                    step={5}
                    onChange={onSampleSpacingChange!}
                  />
                </div>
              </div>
            )}

            {/* 2D: Simulation controls - single row */}
            {hasSimulationControls && (
              <div style={sectionStyle}>
                <div style={sectionHeaderStyle}>Simulation</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {onSimulationPausedChange && (
                    <CompactCheckbox
                      label="Pause"
                      checked={simulationPaused}
                      onChange={onSimulationPausedChange}
                    />
                  )}
                  {onUnpinAllNodes && (
                    <CompactButton label="Unpin All" onClick={onUnpinAllNodes} />
                  )}
                  {onResetSimulation && (
                    <CompactButton label="Reset" onClick={onResetSimulation} />
                  )}
                </div>
              </div>
            )}

            {/* 2D: Clustering/Performance */}
            {hasClusteringControls && (
              <div style={sectionStyle}>
                <div style={sectionHeaderStyle}>Performance</div>
                <CompactCheckbox
                  label="Enable node clustering"
                  checked={clusteringEnabled}
                  onChange={onClusteringEnabledChange!}
                />
                <div style={infoTextStyle}>
                  Groups similar nodes to improve performance on large graphs
                </div>
              </div>
            )}

            {/* 2D: Force tuning - 2 column grid */}
            {hasForceTuning && (
              <div style={sectionStyle}>
                <div style={sectionHeaderStyle}>Force Tuning</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <CompactSlider
                    label="Charge"
                    value={forceTuning.chargeScale}
                    min={0}
                    max={10}
                    step={0.1}
                    onChange={(v) => onForceTuningChange({ ...forceTuning, chargeScale: v })}
                  />
                  <CompactSlider
                    label="Link"
                    value={forceTuning.linkStrengthScale}
                    min={0}
                    max={10}
                    step={0.1}
                    onChange={(v) => onForceTuningChange({ ...forceTuning, linkStrengthScale: v })}
                  />
                  <CompactSlider
                    label="X-Pos"
                    value={forceTuning.xStrengthScale}
                    min={0}
                    max={10}
                    step={0.1}
                    onChange={(v) => onForceTuningChange({ ...forceTuning, xStrengthScale: v })}
                  />
                  <CompactSlider
                    label="Collision R"
                    value={forceTuning.collisionRadiusScale}
                    min={0.2}
                    max={6}
                    step={0.1}
                    onChange={(v) => onForceTuningChange({ ...forceTuning, collisionRadiusScale: v })}
                  />
                </div>
                <CompactSlider
                  label="Collision Strength"
                  value={forceTuning.collisionStrength}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(v) => onForceTuningChange({ ...forceTuning, collisionStrength: v })}
                  formatValue={(v) => `${Math.round(v * 100)}%`}
                />
              </div>
            )}

            {/* Animation controls moved to popout in visualization area */}
          </div>
        </MoreOptionsExpander>
      )}
    </div>
  );
};

export default ViewPanel;
