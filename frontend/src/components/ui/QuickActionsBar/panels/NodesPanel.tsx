/**
 * NodesPanel Component
 *
 * Consolidated panel for all node-related settings in the Quick Actions Bar.
 *
 * Sections:
 * - Appearance: Color By mode
 * - Sizes: Sample, Root, Internal node sizes
 * - Labels: Show Sample/Root/Internal IDs
 * - Behavior: Node combining, Clustering
 */

import React from 'react';
import { NodesPanelProps } from './NodesPanel.types';
import { UnifiedSlider } from './UnifiedSlider';
import { ColorBySelector } from './ColorBySelector';
import { useColorTheme } from '../../../../context/ColorThemeContext';

export const NodesPanel: React.FC<NodesPanelProps> = ({
  // Color mode
  colorBy = 'type',
  onColorByChange,
  availableColorModes,

  // Node sizes (per type)
  nodeSizes,
  onNodeSizesChange,

  // Basic node size
  nodeSize = 8,
  onNodeSizeChange,
  nodeSizeMin = 2,
  nodeSizeMax = 24,

  // Node IDs
  nodeIdSettings,
  onNodeIdSettingsChange,

  // Node combining
  combineInternalNodes,
  onCombineInternalNodesChange,
  combineSampleNodes,
  onCombineSampleNodesChange,

  // Clustering
  clusteringEnabled = false,
  onClusteringEnabledChange,

  className = '',
}) => {
  const { colors, theme } = useColorTheme();
  const isLiquid = theme === 'liquid';

  // Check what options are available
  const hasColorBy = onColorByChange !== undefined;
  const hasNodeSizes = nodeSizes && onNodeSizesChange;
  const hasBasicNodeSize = onNodeSizeChange && !hasNodeSizes;
  const hasNodeIds = nodeIdSettings && onNodeIdSettingsChange;
  const hasNodeCombining = onCombineInternalNodesChange || onCombineSampleNodesChange;
  const hasClusteringControls = onClusteringEnabledChange !== undefined;

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
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
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

  const infoTextStyle: React.CSSProperties = {
    fontSize: '0.625rem',
    color: colors.textSecondary,
    opacity: 0.8,
  };

  return (
    <div style={containerStyle} className={className}>
      {/* Appearance: Color By */}
      {hasColorBy && (
        <div style={sectionStyle}>
          <div style={rowStyle}>
            <span style={sectionHeaderStyle}>Color By</span>
            <ColorBySelector
              value={colorBy}
              onChange={onColorByChange}
              disabledModes={
                availableColorModes
                  ? (['none', 'time', 'population', 'type'].filter(
                      (mode) => !availableColorModes.includes(mode as any)
                    ) as any)
                  : undefined
              }
            />
          </div>
        </div>
      )}

      {/* Sizes: Per-type node sizes */}
      {hasNodeSizes && (
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>Sizes</div>
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

      {/* Sizes: Basic (single slider, fallback) */}
      {hasBasicNodeSize && (
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>Size</div>
          <UnifiedSlider
            label="All Nodes"
            value={nodeSize}
            min={nodeSizeMin}
            max={nodeSizeMax}
            step={0.5}
            unit="px"
            onChange={onNodeSizeChange}
            showValue={true}
          />
        </div>
      )}

      {/* Labels: Show Node IDs */}
      {hasNodeIds && (
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>Labels</div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <label style={checkboxContainerStyle}>
              <input
                type="checkbox"
                checked={nodeIdSettings.showSampleIds}
                onChange={(e) =>
                  onNodeIdSettingsChange({ ...nodeIdSettings, showSampleIds: e.target.checked })
                }
                style={checkboxStyle}
              />
              <span style={checkboxLabelStyle}>Sample IDs</span>
            </label>
            <label style={checkboxContainerStyle}>
              <input
                type="checkbox"
                checked={nodeIdSettings.showRootIds}
                onChange={(e) =>
                  onNodeIdSettingsChange({ ...nodeIdSettings, showRootIds: e.target.checked })
                }
                style={checkboxStyle}
              />
              <span style={checkboxLabelStyle}>Root IDs</span>
            </label>
            <label style={checkboxContainerStyle}>
              <input
                type="checkbox"
                checked={nodeIdSettings.showInternalIds}
                onChange={(e) =>
                  onNodeIdSettingsChange({ ...nodeIdSettings, showInternalIds: e.target.checked })
                }
                style={checkboxStyle}
              />
              <span style={checkboxLabelStyle}>Internal IDs</span>
            </label>
          </div>
        </div>
      )}

      {/* Behavior: Node Combining */}
      {hasNodeCombining && (
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>Behavior</div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {onCombineInternalNodesChange && (
              <label style={checkboxContainerStyle}>
                <input
                  type="checkbox"
                  checked={combineInternalNodes || false}
                  onChange={(e) => onCombineInternalNodesChange(e.target.checked)}
                  style={checkboxStyle}
                />
                <span style={checkboxLabelStyle}>Combine Internal</span>
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
                <span style={checkboxLabelStyle}>Combine Samples</span>
              </label>
            )}
          </div>
        </div>
      )}

      {/* Behavior: Clustering */}
      {hasClusteringControls && (
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>Optimization</div>
          <label style={checkboxContainerStyle}>
            <input
              type="checkbox"
              checked={clusteringEnabled}
              onChange={(e) => onClusteringEnabledChange!(e.target.checked)}
              style={checkboxStyle}
            />
            <span style={checkboxLabelStyle}>Enable Node Clustering</span>
          </label>
          <div style={infoTextStyle}>
            Groups similar nodes to improve performance on large graphs
          </div>
        </div>
      )}
    </div>
  );
};

export default NodesPanel;
