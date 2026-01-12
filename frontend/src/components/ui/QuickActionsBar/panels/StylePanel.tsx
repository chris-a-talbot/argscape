/**
 * StylePanel Component
 *
 * Compact panel for appearance controls in the Quick Actions Bar.
 * Uses progressive disclosure with essential controls visible by default.
 *
 * Essential (always visible):
 * - Color-by mode (Type/Population) - compact toggle buttons
 *
 * Advanced (in "More options"):
 * - Node sizes, IDs, combining options
 * - Edge thickness/opacity/labels
 * - Mutation markers
 */

import React from 'react';
import { StylePanelProps } from './StylePanel.types';
import { UnifiedSlider, SizePreview } from './UnifiedSlider';
import { ColorBySelector } from './ColorBySelector';
import { ThemeToggle } from './ThemeToggle';
import { MoreOptionsExpander } from '../components/MoreOptionsExpander';
import { useColorTheme } from '../../../../context/ColorThemeContext';

/**
 * Default values for style controls
 */
const DEFAULT_NODE_SIZE_MIN = 2;
const DEFAULT_NODE_SIZE_MAX = 24;
const DEFAULT_EDGE_THICKNESS_MIN = 0.5;
const DEFAULT_EDGE_THICKNESS_MAX = 8;

export const StylePanel: React.FC<StylePanelProps> = ({
  // Basic node size
  nodeSize = 8,
  onNodeSizeChange,
  nodeSizeMin = DEFAULT_NODE_SIZE_MIN,
  nodeSizeMax = DEFAULT_NODE_SIZE_MAX,

  // Advanced node sizes
  nodeSizes,
  onNodeSizesChange,

  // Node IDs
  nodeIdSettings,
  onNodeIdSettingsChange,

  // Node combining
  combineInternalNodes,
  onCombineInternalNodesChange,
  combineSampleNodes,
  onCombineSampleNodesChange,

  // Edge appearance
  edgeThickness = 1.5,
  onEdgeThicknessChange,
  edgeThicknessMin = DEFAULT_EDGE_THICKNESS_MIN,
  edgeThicknessMax = DEFAULT_EDGE_THICKNESS_MAX,

  edgeOpacity = 95,
  onEdgeOpacityChange,

  // Edge labels
  edgeLabelSettings,
  onEdgeLabelSettingsChange,

  // Mutation markers
  edgeMutationSettings,
  onEdgeMutationSettingsChange,

  // Color mode
  colorBy = 'time',
  onColorByChange,
  availableColorModes,

  // Theme
  theme,
  onThemeChange,
  availableThemes,

  className = '',
  children,
}) => {
  // Get theme from context if not provided
  const { theme: contextTheme, setTheme: contextSetTheme, colors } = useColorTheme();
  const currentTheme = theme ?? contextTheme;
  const handleThemeChange = onThemeChange ?? contextSetTheme;
  const isLiquid = currentTheme === 'liquid';

  // Check what advanced options we have
  const hasNodeSizes = nodeSizes && onNodeSizesChange;
  const hasBasicNodeSize = onNodeSizeChange && !hasNodeSizes;
  const hasNodeIds = nodeIdSettings && onNodeIdSettingsChange;
  const hasNodeCombining = onCombineInternalNodesChange || onCombineSampleNodesChange;
  const hasEdgeLabels = edgeLabelSettings && onEdgeLabelSettingsChange;
  const hasMutationMarkers = edgeMutationSettings && onEdgeMutationSettingsChange;
  const hasBasicEdgeControls = onEdgeThicknessChange || onEdgeOpacityChange;

  const hasAdvancedOptions = hasNodeSizes || hasBasicNodeSize || hasNodeIds ||
    hasNodeCombining || hasEdgeLabels || hasMutationMarkers || hasBasicEdgeControls;

  // Styles - compact
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
  };

  const helpTextStyle: React.CSSProperties = {
    fontSize: '0.625rem',
    color: colors.textSecondary,
    lineHeight: 1.3,
    opacity: 0.8,
  };

  const checkboxContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.125rem 0',
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

  const sliderGroupStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  };

  // Compact row style - items grouped together, not spread apart
  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  };

  return (
    <div style={containerStyle} className={className}>
      {/* Essential Controls: Color-By Mode - compact row */}
      {onColorByChange && (
        <div style={sectionStyle}>
          <div style={rowStyle}>
            <span style={sectionHeaderStyle}>Color By</span>
            <ColorBySelector
              value={colorBy}
              onChange={onColorByChange}
              disabledModes={availableColorModes ?
                ['none', 'time', 'population', 'type'].filter(
                  mode => !availableColorModes.includes(mode as any)
                ) as any : undefined
              }
            />
          </div>
        </div>
      )}

      {/* Advanced Options */}
      {hasAdvancedOptions && (
        <MoreOptionsExpander label="Advanced styling" showDivider={true}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Node Combining - side by side checkboxes */}
            {hasNodeCombining && (
              <div style={sectionStyle}>
                <div style={sectionHeaderStyle}>Node Combining</div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {onCombineInternalNodesChange && (
                    <label style={checkboxContainerStyle}>
                      <input
                        type="checkbox"
                        checked={combineInternalNodes || false}
                        onChange={(e) => onCombineInternalNodesChange(e.target.checked)}
                        style={checkboxStyle}
                      />
                      <span style={checkboxLabelStyle}>Internal</span>
                    </label>
                  )}
                  {onCombineSampleNodesChange && (
                    <label style={checkboxContainerStyle}>
                      <input
                        type="checkbox"
                        checked={combineSampleNodes !== undefined ? combineSampleNodes : true}
                        onChange={(e) => onCombineSampleNodesChange(e.target.checked)}
                        style={checkboxStyle}
                      />
                      <span style={checkboxLabelStyle}>Samples</span>
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* Node Sizes - 3 column grid */}
            {hasNodeSizes && (
              <div style={sectionStyle}>
                <div style={sectionHeaderStyle}>Node Sizes</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  <UnifiedSlider
                    label="Sample"
                    value={nodeSizes.sample}
                    min={4}
                    max={30}
                    step={1}
                    unit="px"
                    onChange={(v) => onNodeSizesChange({ ...nodeSizes, sample: v })}
                    showValue={true}
                    compact={true}
                  />
                  <UnifiedSlider
                    label="Root"
                    value={nodeSizes.root}
                    min={4}
                    max={30}
                    step={1}
                    unit="px"
                    onChange={(v) => onNodeSizesChange({ ...nodeSizes, root: v })}
                    showValue={true}
                    compact={true}
                  />
                  <UnifiedSlider
                    label="Internal"
                    value={nodeSizes.other}
                    min={4}
                    max={30}
                    step={1}
                    unit="px"
                    onChange={(v) => onNodeSizesChange({ ...nodeSizes, other: v })}
                    showValue={true}
                    compact={true}
                  />
                </div>
              </div>
            )}

            {/* Node Size - Basic (single slider) */}
            {hasBasicNodeSize && (
              <div style={sectionStyle}>
                <div style={sectionHeaderStyle}>Node Size</div>
                <UnifiedSlider
                  label="All Nodes"
                  value={nodeSize}
                  min={nodeSizeMin}
                  max={nodeSizeMax}
                  step={0.5}
                  unit="px"
                  onChange={onNodeSizeChange}
                  showValue={true}
                  preview={<SizePreview size={nodeSize} type="node" />}
                />
              </div>
            )}

            {/* Edge Appearance - 2 column grid */}
            {hasBasicEdgeControls && (
              <div style={sectionStyle}>
                <div style={sectionHeaderStyle}>Edge Appearance</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                  {onEdgeThicknessChange && (
                    <UnifiedSlider
                      label="Width"
                      value={edgeThickness}
                      min={edgeThicknessMin}
                      max={edgeThicknessMax}
                      step={0.1}
                      unit="px"
                      onChange={onEdgeThicknessChange}
                      showValue={true}
                      compact={true}
                    />
                  )}
                  {onEdgeOpacityChange && (
                    <UnifiedSlider
                      label="Opacity"
                      value={edgeOpacity}
                      min={0}
                      max={100}
                      step={5}
                      unit="%"
                      onChange={onEdgeOpacityChange}
                      showValue={true}
                      compact={true}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Edge Label Size (only shown if labels are enabled via View panel) */}
            {hasEdgeLabels && edgeLabelSettings.showEdgeLabels && (
              <div style={sectionStyle}>
                <div style={sectionHeaderStyle}>Edge Label Size</div>
                <UnifiedSlider
                  label="Font Size"
                  value={edgeLabelSettings.labelFontSize}
                  min={8}
                  max={24}
                  step={1}
                  unit="px"
                  onChange={(v) => onEdgeLabelSettingsChange({ ...edgeLabelSettings, labelFontSize: v })}
                  showValue={true}
                />
              </div>
            )}

            {/* Mutation Marker Size (only shown if markers are enabled via View panel) */}
            {hasMutationMarkers && edgeMutationSettings.showMutationMarkers && (
              <div style={sectionStyle}>
                <div style={sectionHeaderStyle}>Mutation Marker Size</div>
                <UnifiedSlider
                  label="Size"
                  value={edgeMutationSettings.markerSize}
                  min={4}
                  max={50}
                  step={1}
                  unit="px"
                  onChange={(v) => onEdgeMutationSettingsChange({ ...edgeMutationSettings, markerSize: v })}
                  showValue={true}
                />
              </div>
            )}
          </div>
        </MoreOptionsExpander>
      )}

      {/* Custom additional controls */}
      {children && (
        <MoreOptionsExpander label="More options" showDivider={true}>
          {children}
        </MoreOptionsExpander>
      )}
    </div>
  );
};

export default StylePanel;
