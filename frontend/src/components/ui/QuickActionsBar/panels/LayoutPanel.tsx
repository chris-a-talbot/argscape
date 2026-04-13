/**
 * LayoutPanel Component
 *
 * Consolidated panel for all layout-related settings in the Quick Actions Bar.
 *
 * Sections:
 * - Arrangement: Sample order, Temporal spacing mode
 * - Spacing: Vertical (temporal), Horizontal (sample)
 * - Simulation: Force tuning, Pause, Unpin, Reset
 */

import React from 'react';
import { LayoutPanelProps, SampleOrderType, TemporalSpacingMode } from './LayoutPanel.types';
import { useColorTheme } from '../../../../context/ColorThemeContext';
import { Tooltip } from '../../tooltip';

// Sample order options
const SAMPLE_ORDER_OPTIONS: { value: SampleOrderType; label: string }[] = [
  { value: 'numeric', label: 'Numeric' },
  { value: 'first_minlex', label: 'First Tree' },
  { value: 'center_minlex', label: 'Center Tree' },
  { value: 'consensus_minlex', label: 'Consensus' },
  { value: 'ancestral_path', label: 'Ancestral Path' },
  { value: 'coalescence', label: 'Coalescence' },
  { value: 'dagre', label: 'Dagre' },
];

// Spacing mode options
const SPACING_MODE_OPTIONS: { value: TemporalSpacingMode; label: string }[] = [
  { value: 'equal', label: 'Equal' },
  { value: 'linear', label: 'Linear' },
  { value: 'log', label: 'Log' },
];

// Tooltip content
const SAMPLE_ORDER_TOOLTIP = (
  <div>
    <p style={{ marginBottom: '0.5rem' }}>
      <strong>Numeric:</strong> Orders by sample ID. Simple and predictable.
    </p>
    <p style={{ marginBottom: '0.5rem' }}>
      <strong>First Tree:</strong> Optimizes for the first tree to minimize crossings.
    </p>
    <p style={{ marginBottom: '0.5rem' }}>
      <strong>Center Tree:</strong> Uses the center tree for ordering. Good for balanced views.
    </p>
    <p style={{ marginBottom: '0.5rem' }}>
      <strong>Consensus:</strong> Works well across all trees. Best general-purpose choice.
    </p>
    <p>
      <strong>Dagre:</strong> Hierarchical layout algorithm. Best for complex topologies.
    </p>
  </div>
);

const TEMPORAL_SPACING_TOOLTIP = (
  <div>
    <p style={{ marginBottom: '0.5rem' }}>
      <strong>Equal:</strong> Spaces generations evenly. Best for understanding structure.
    </p>
    <p style={{ marginBottom: '0.5rem' }}>
      <strong>Linear:</strong> Proportional to actual time. Shows true temporal relationships.
    </p>
    <p>
      <strong>Log:</strong> Logarithmic scaling. Best for large time spans with recent clustering.
    </p>
  </div>
);

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
                ? isLiquid
                  ? 'rgba(20, 226, 168, 0.15)'
                  : `${colors.accentPrimary}20`
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

export const LayoutPanel: React.FC<LayoutPanelProps> = ({
  // Sample order
  sampleOrder = 'consensus_minlex',
  onSampleOrderChange,
  forceDagre = false,
  edgeCrossings,
  isCalculatingEdgeCrossings,

  // Temporal spacing mode
  temporalSpacingMode = 'equal',
  onTemporalSpacingModeChange,

  // Spacing controls
  temporalSpacing = 10,
  sampleSpacing = 40,
  onTemporalSpacingChange,
  onSampleSpacingChange,

  // Force tuning
  forceTuning,
  onForceTuningChange,

  // Simulation controls
  simulationPaused = false,
  onSimulationPausedChange,
  onResetSimulation,
  onUnpinAllNodes,

  className = '',
}) => {
  const { colors, theme } = useColorTheme();
  const isLiquid = theme === 'liquid';

  // When forceDagre is true, disable all non-dagre sample order options
  const disabledSampleOrders = forceDagre
    ? new Set(SAMPLE_ORDER_OPTIONS.filter(o => o.value !== 'dagre').map(o => o.value))
    : undefined;

  // Check what options are available
  const hasSampleOrder = onSampleOrderChange !== undefined;
  const hasSpacingMode = onTemporalSpacingModeChange !== undefined;
  const hasSpacingControls = onTemporalSpacingChange && onSampleSpacingChange;
  const hasSimulationControls = onSimulationPausedChange || onResetSimulation || onUnpinAllNodes;
  const hasForceTuning = forceTuning && onForceTuningChange;

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

  const sectionHeaderStyle: React.CSSProperties = {
    fontSize: '0.625rem',
    fontWeight: 600,
    color: colors.accentPrimary,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.125rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
  };

  const infoTextStyle: React.CSSProperties = {
    fontSize: '0.625rem',
    color: colors.textSecondary,
    opacity: 0.8,
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.5rem',
  };

  return (
    <div style={containerStyle} className={className}>
      {/* Arrangement: Sample Order */}
      {hasSampleOrder && (
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <span>Sample Order</span>
            <Tooltip content={SAMPLE_ORDER_TOOLTIP} />
          </div>
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

      {/* Arrangement: Temporal Spacing Mode */}
      {hasSpacingMode && (
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <span>Temporal Spacing</span>
            <Tooltip content={TEMPORAL_SPACING_TOOLTIP} />
          </div>
          <ButtonGroup
            options={SPACING_MODE_OPTIONS}
            value={temporalSpacingMode}
            onChange={(v) => onTemporalSpacingModeChange(v as TemporalSpacingMode)}
          />
        </div>
      )}

      {/* Spacing: Vertical and Horizontal */}
      {hasSpacingControls && (
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>Spacing</div>
          <div style={gridStyle}>
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

      {/* Simulation: Controls */}
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
            {onUnpinAllNodes && <CompactButton label="Unpin All" onClick={onUnpinAllNodes} />}
            {onResetSimulation && <CompactButton label="Reset" onClick={onResetSimulation} />}
          </div>
        </div>
      )}

      {/* Simulation: Force Tuning */}
      {hasForceTuning && (
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>Force Tuning</div>
          <div style={gridStyle}>
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
    </div>
  );
};

export default LayoutPanel;
