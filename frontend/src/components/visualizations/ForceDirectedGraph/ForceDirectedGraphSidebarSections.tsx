import { useColorTheme } from '../../../context/ColorThemeContext';
import { 
  SidebarSlider, 
  SidebarCheckbox, 
  SidebarButtonGroup, 
  SidebarInfoBox,
  SidebarSubsection 
} from '../../ui/VisualizationSidebar';
import { SampleOrderControl, SampleOrderType } from '../../ui/sample-order-control';
import { NodeSizeSettings, TemporalSpacingMode, NodeIdSettings, EdgeLabelSettings, EdgeMutationSettings } from './ForceDirectedGraph.types';
import { formatGenomicPosition } from '../../../utils/colorUtils';
import { Tooltip } from '../../ui/tooltip';

// Clustering Section
interface ClusteringSectionProps {
  clusteringEnabled: boolean;
  onClusteringEnabledChange: (enabled: boolean) => void;
  clusteringMinTreeSize: number;
  onClusteringMinTreeSizeChange: (size: number) => void;
  clusteringRequireDensity: boolean;
  onClusteringRequireDensityChange: (enabled: boolean) => void;
  clusteringDensityIntensity: number;
  onClusteringDensityIntensityChange: (intensity: number) => void;
  clusteringRequireTemporalCompactness: boolean;
  onClusteringRequireTemporalCompactnessChange: (enabled: boolean) => void;
  clusteringTemporalIntensity: number;
  onClusteringTemporalIntensityChange: (intensity: number) => void;
  clusteringMaxSampleClusterSize: number;
  onClusteringMaxSampleClusterSizeChange: (size: number) => void;
  nodeCount?: number;
  clusteredNodeCount?: number;
}

export function ClusteringSection({
  clusteringEnabled,
  onClusteringEnabledChange,
  clusteringMinTreeSize,
  onClusteringMinTreeSizeChange,
  clusteringRequireDensity,
  onClusteringRequireDensityChange,
  clusteringDensityIntensity,
  onClusteringDensityIntensityChange,
  clusteringRequireTemporalCompactness,
  onClusteringRequireTemporalCompactnessChange,
  clusteringTemporalIntensity,
  onClusteringTemporalIntensityChange,
  clusteringMaxSampleClusterSize,
  onClusteringMaxSampleClusterSizeChange,
  nodeCount,
  clusteredNodeCount
}: ClusteringSectionProps) {
  const { colors } = useColorTheme();

  const reductionPercentage = nodeCount && clusteredNodeCount 
    ? Math.round(((nodeCount - clusteredNodeCount) / nodeCount) * 100)
    : 0;

  return (
    <div className="space-y-4">
      <SidebarSubsection title="Performance Clustering">
        <SidebarCheckbox
          label="Enable Clustering"
          checked={clusteringEnabled}
          onChange={onClusteringEnabledChange}
          tooltip="⚠️ Beta Feature: Condense dense subtrees into cluster nodes for better performance with large graphs. This is a testing feature and may cause unexpected results."
        />

        {clusteringEnabled && (
          <>
            <SidebarSlider
              label="Min Tree Size"
              value={clusteringMinTreeSize}
              min={2}
              max={50}
              step={1}
              onChange={onClusteringMinTreeSizeChange}
              tooltip="Minimum number of nodes in a subtree to cluster it. Lower values = more clustering (more nodes clustered)."
              formatValue={(v) => `${Math.round(v)} nodes`}
            />

            <SidebarCheckbox
              label="Require Density"
              checked={clusteringRequireDensity}
              onChange={onClusteringRequireDensityChange}
              tooltip="Only cluster subtrees with high density (many nodes per depth level). When off, density is not considered."
            />

            {clusteringRequireDensity && (
              <SidebarSlider
                label="Density Intensity"
                value={clusteringDensityIntensity}
                min={0}
                max={1}
                step={0.05}
                onChange={onClusteringDensityIntensityChange}
                tooltip="Intensity of density filtering. 0 = no effect (all subtrees pass), 1 = maximum effect (only very dense subtrees pass)."
                formatValue={(v) => {
                  if (v === 0) return '0% (no effect)';
                  if (v === 1) return '100% (max effect)';
                  return `${Math.round(v * 100)}%`;
                }}
              />
            )}

            <SidebarCheckbox
              label="Require Temporal Compactness"
              checked={clusteringRequireTemporalCompactness}
              onChange={onClusteringRequireTemporalCompactnessChange}
              tooltip="Only cluster subtrees that are temporally compact (nodes close together in time). When off, temporal spacing is not considered."
            />

            {clusteringRequireTemporalCompactness && (
              <div className="space-y-2">
                <SidebarSlider
                  label="Temporal Intensity"
                  value={clusteringTemporalIntensity}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={onClusteringTemporalIntensityChange}
                  tooltip="Intensity of temporal compactness filtering. 0 = no effect (all subtrees pass), 1 = maximum effect (only very compact subtrees pass). Uses logarithmic scale for smoother transitions."
                  formatValue={(v) => {
                    if (v === 0) return '0% (no effect)';
                    if (v === 1) return '100% (max effect)';
                    return `${Math.round(v * 100)}%`;
                  }}
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const newValue = Math.max(0, Math.round((clusteringTemporalIntensity - 0.01) * 100) / 100);
                      onClusteringTemporalIntensityChange(newValue);
                    }}
                    className="px-2 py-1 text-xs font-medium rounded border transition-colors"
                    style={{
                      backgroundColor: colors.containerBackground,
                      borderColor: colors.border + '40',
                      color: colors.text,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.border + '20';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = colors.containerBackground;
                    }}
                    disabled={clusteringTemporalIntensity <= 0}
                  >
                    −1%
                  </button>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={Math.round(clusteringTemporalIntensity * 100)}
                    onChange={(e) => {
                      const numValue = parseInt(e.target.value, 10);
                      if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                        onClusteringTemporalIntensityChange(numValue / 100);
                      }
                    }}
                    onBlur={(e) => {
                      // Reset to current value if invalid
                      const numValue = parseInt(e.target.value, 10);
                      if (isNaN(numValue) || numValue < 0 || numValue > 100) {
                        e.target.value = Math.round(clusteringTemporalIntensity * 100).toString();
                      }
                    }}
                    className="flex-1 px-2 py-1 text-xs text-center rounded border"
                    style={{
                      backgroundColor: colors.containerBackground,
                      borderColor: colors.border + '40',
                      color: colors.text,
                    }}
                  />
                  <span className="text-xs" style={{ color: colors.text, opacity: 0.7 }}>%</span>
                  <button
                    onClick={() => {
                      const newValue = Math.min(1, Math.round((clusteringTemporalIntensity + 0.01) * 100) / 100);
                      onClusteringTemporalIntensityChange(newValue);
                    }}
                    className="px-2 py-1 text-xs font-medium rounded border transition-colors"
                    style={{
                      backgroundColor: colors.containerBackground,
                      borderColor: colors.border + '40',
                      color: colors.text,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.border + '20';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = colors.containerBackground;
                    }}
                    disabled={clusteringTemporalIntensity >= 1}
                  >
                    +1%
                  </button>
                </div>
              </div>
            )}

            <SidebarSlider
              label="Max Sample Cluster Size"
              value={clusteringMaxSampleClusterSize}
              min={5}
              max={100}
              step={1}
              onChange={onClusteringMaxSampleClusterSizeChange}
              tooltip="Maximum number of samples per sample cluster. Larger values allow bigger clusters (reduces clutter but may hide details)."
              formatValue={(v) => `${Math.round(v)} samples`}
            />

            {nodeCount && clusteredNodeCount && nodeCount !== clusteredNodeCount && (
              <SidebarInfoBox>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span style={{ color: colors.text, opacity: 0.8 }}>Original nodes:</span>
                    <span style={{ color: colors.text, fontWeight: 500 }}>{nodeCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: colors.text, opacity: 0.8 }}>Displayed nodes:</span>
                    <span style={{ color: colors.accentPrimary, fontWeight: 600 }}>{clusteredNodeCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: colors.text, opacity: 0.8 }}>Reduction:</span>
                    <span style={{ color: colors.accentSecondary, fontWeight: 600 }}>{reductionPercentage}%</span>
                  </div>
                </div>
              </SidebarInfoBox>
            )}
          </>
        )}
      </SidebarSubsection>
    </div>
  );
}

// View Controls Section
interface ViewControlsSectionProps {
  temporalFilterEnabled: boolean;
  onTemporalFilterChange: (enabled: boolean) => void;
  temporalDimOpacity: number;
  onTemporalDimOpacityChange: (opacity: number) => void;
  layerRevealEnabled: boolean;
  layerRevealRate: number;
  onLayerRevealRateChange: (rate: number) => void;
  onLayerRevealPlay: () => void;
  onLayerRevealPause: () => void;
  onLayerRevealReset: () => void;
}

export function ViewControlsSection({
  temporalFilterEnabled,
  onTemporalFilterChange,
  temporalDimOpacity,
  onTemporalDimOpacityChange,
  layerRevealEnabled,
  layerRevealRate,
  onLayerRevealRateChange,
  onLayerRevealPlay,
  onLayerRevealPause,
  onLayerRevealReset
}: ViewControlsSectionProps) {
  const { colors } = useColorTheme();

  return (
    <div className="space-y-4">
      <SidebarSubsection title="Temporal Filter">
        <SidebarCheckbox
          label="Enable Temporal Filter"
          checked={temporalFilterEnabled}
          onChange={onTemporalFilterChange}
          tooltip="Filter nodes and edges by time using the vertical slider"
        />

        {temporalFilterEnabled && (
          <SidebarSlider
            label="Dimmed Opacity"
            value={temporalDimOpacity}
            min={0}
            max={0.99}
            step={0.01}
            onChange={onTemporalDimOpacityChange}
            tooltip="Opacity for out-of-range elements (0 hides, 0.99 nearly visible)"
            formatValue={(v) => `${Math.round(v * 100)}%`}
          />
        )}
      </SidebarSubsection>

      {temporalFilterEnabled && (
        <SidebarSubsection title="Layer Reveal">
          <div className="space-y-2">
            <div className="flex items-center gap-1 mb-2">
              <span className="text-xs font-semibold" style={{ color: colors.text }}>
                Animation
              </span>
              <Tooltip content="Progressively reveal time layers from oldest to newest" />
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
              <button
                onClick={onLayerRevealPlay}
                disabled={layerRevealEnabled}
                className="px-3 py-2 rounded text-xs font-medium transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: layerRevealEnabled ? colors.containerBackground : colors.accentPrimary,
                  color: layerRevealEnabled ? colors.text : colors.background,
                  cursor: layerRevealEnabled ? 'not-allowed' : 'pointer'
                }}
              >
                Play
              </button>
              <button
                onClick={onLayerRevealPause}
                disabled={!layerRevealEnabled}
                className="px-3 py-2 rounded text-xs font-medium transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: !layerRevealEnabled ? colors.containerBackground : colors.accentPrimary,
                  color: !layerRevealEnabled ? colors.text : colors.background,
                  cursor: !layerRevealEnabled ? 'not-allowed' : 'pointer'
                }}
              >
                Pause
              </button>
              <button
                onClick={onLayerRevealReset}
                className="px-3 py-2 rounded text-xs font-medium transition-colors"
                style={{
                  backgroundColor: colors.containerBackground,
                  color: colors.text
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </SidebarSubsection>
      )}
    </div>
  );
}

// Layout & Spacing Section
interface LayoutSpacingSectionProps {
  sampleOrder: SampleOrderType;
  onSampleOrderChange: (order: SampleOrderType) => void;
  temporalSpacingMode: TemporalSpacingMode;
  onTemporalSpacingModeChange: (mode: TemporalSpacingMode) => void;
  temporalSpacing: number;
  onTemporalSpacingChange: (spacing: number) => void;
  sampleSpacing: number;
  onSampleSpacingChange: (spacing: number) => void;
  simulationPaused: boolean;
  onSimulationPausedChange: (paused: boolean) => void;
  temporalFilterEnabled?: boolean;
  onUnpinAllNodes: () => void;
  onResetSimulation: () => void;
  edgeCrossings?: number | null;
  isCalculatingEdgeCrossings?: boolean;
  // Force tuning controls
  forceTuning: {
    chargeScale: number;
    linkStrengthScale: number;
    xStrengthScale: number;
    yStrengthScale: number;
    collisionRadiusScale: number;
    collisionStrength: number;
    edgeCrossingScale: number;
    edgeBundlingScale: number;
    descendantRangeScale: number;
  };
  onForceTuningChange: (next: LayoutSpacingSectionProps['forceTuning']) => void;
}

export function LayoutSpacingSection({
  sampleOrder,
  onSampleOrderChange,
  temporalSpacingMode,
  onTemporalSpacingModeChange,
  temporalSpacing,
  onTemporalSpacingChange,
  sampleSpacing,
  onSampleSpacingChange,
  simulationPaused,
  onSimulationPausedChange,
  temporalFilterEnabled = false,
  onUnpinAllNodes,
  onResetSimulation,
  edgeCrossings,
  isCalculatingEdgeCrossings = false,
  forceTuning,
  onForceTuningChange
}: LayoutSpacingSectionProps) {
  const { colors } = useColorTheme();

  return (
    <div className="space-y-4">
      <SidebarSubsection 
        title="Sample Order"
        tooltip={
          <div className="space-y-2">
            <div>
              <strong>What it does:</strong> Changes the horizontal order of sample nodes at the bottom of the graph. Different orders can help untangle edges and reduce visual crossings.
            </div>
            <div>
              <strong>Algorithms:</strong>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                <li><strong>Numeric:</strong> Simple numeric order (0, 1, 2...)</li>
                <li><strong>First Tree:</strong> Minlex postorder from the first genomic tree</li>
                <li><strong>Center Tree:</strong> Minlex postorder from the tree at the center genomic position</li>
                <li><strong>Consensus:</strong> Majority vote across multiple trees (often best for reducing crossings)</li>
                <li><strong>Ancestral Path:</strong> Order by ancestral path length with MRCA-based grouping</li>
                <li><strong>Coalescence:</strong> Order by coalescence time with MRCA-based grouping</li>
                <li><strong>Dagre-d3:</strong> Layer-by-layer optimization algorithm</li>
              </ul>
            </div>
          </div>
        }
      >
        <SampleOrderControl 
          value={sampleOrder}
          onChange={onSampleOrderChange}
        />
        {(edgeCrossings !== null && edgeCrossings !== undefined) || isCalculatingEdgeCrossings ? (
          <div 
            className="mt-2 px-2 py-1.5 rounded text-xs flex items-center justify-between"
            style={{ 
              backgroundColor: colors.containerBackground,
              border: `1px solid ${colors.border}`
            }}
          >
            <span style={{ color: colors.text, opacity: 0.8 }}>Edge Crossings:</span>
            <span 
              className="font-semibold"
              style={{ color: colors.accentPrimary }}
            >
              {isCalculatingEdgeCrossings ? '...' : edgeCrossings?.toLocaleString()}
            </span>
          </div>
        ) : null}
      </SidebarSubsection>

      <SidebarSubsection 
        title="Spacing"
        tooltip={
          <div className="space-y-2">
            <div>
              <strong>Equal:</strong> Uniform spacing between all time layers. Best for consistent visual spacing regardless of actual time differences.
            </div>
            <div>
              <strong>Linear:</strong> Spacing proportional to actual time differences. Best for representing real-time relationships accurately.
            </div>
            <div>
              <strong>Log:</strong> Logarithmic spacing that accounts for changes in coalescent frequency going back in time. Best for visualizing genealogies where most coalescence happens recently.
            </div>
          </div>
        }
      >
        <SidebarButtonGroup
          value={temporalSpacingMode}
          options={[
            { value: 'equal', label: 'Equal', tooltip: 'Equal spacing between layers' },
            { value: 'linear', label: 'Linear', tooltip: 'Linear time-based spacing' },
            { value: 'log', label: 'Log', tooltip: 'Logarithmic time-based spacing' }
          ]}
          onChange={(value) => onTemporalSpacingModeChange(value as TemporalSpacingMode)}
        />
        
        <SidebarSlider
          label="Vertical Spacing"
          value={temporalSpacing}
          min={0.1}
          max={20}
          step={0.1}
          onChange={onTemporalSpacingChange}
          tooltip="Adjust the vertical spacing between temporal layers"
        />
        
        <SidebarSlider
          label="Horizontal Spacing"
          value={sampleSpacing}
          min={5}
          max={800}
          step={5}
          onChange={onSampleSpacingChange}
          tooltip="Adjust horizontal spacing between sample nodes"
        />
      </SidebarSubsection>

      <SidebarSubsection title="Force Simulation">
        <SidebarCheckbox
          label="Pause Simulation"
          checked={simulationPaused}
          onChange={onSimulationPausedChange}
          tooltip="Pause the force-directed simulation to freeze node positions"
        />
        {temporalFilterEnabled && (
          <div className="mt-2 text-xs" style={{ color: colors.text, opacity: 0.7 }}>
            Note: Simulation is auto-paused when temporal filter is active
          </div>
        )}
        
        <button
          onClick={onUnpinAllNodes}
          className="w-full mt-2 px-3 py-2 rounded text-xs font-medium transition-colors"
          style={{
            backgroundColor: colors.containerBackground,
            color: colors.text,
            border: `1px solid ${colors.border}`
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.accentPrimary;
            e.currentTarget.style.color = colors.background;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.containerBackground;
            e.currentTarget.style.color = colors.text;
          }}
        >
          Unpin All Nodes
        </button>

        <button
          onClick={onResetSimulation}
          className="w-full mt-2 px-3 py-2 rounded text-xs font-medium transition-colors"
          style={{
            backgroundColor: colors.containerBackground,
            color: colors.text,
            border: `1px solid ${colors.border}`
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.accentPrimary;
            e.currentTarget.style.color = colors.background;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.containerBackground;
            e.currentTarget.style.color = colors.text;
          }}
        >
          Reset Simulation
        </button>

        {/* Force tuning sliders */}
        <div className="mt-3 space-y-2">
          <SidebarSlider
            label="Charge Scale"
            value={forceTuning.chargeScale}
            min={0}
            max={10}
            step={0.1}
            onChange={(v) => onForceTuningChange({ ...forceTuning, chargeScale: v })}
            tooltip="Controls repulsion between nodes. Higher values push nodes apart more, reducing overlap. Lower values allow nodes to cluster closer together."
          />
          <SidebarSlider
            label="Link Strength"
            value={forceTuning.linkStrengthScale}
            min={0}
            max={10}
            step={0.1}
            onChange={(v) => onForceTuningChange({ ...forceTuning, linkStrengthScale: v })}
            tooltip="Controls how strongly connected nodes are pulled together. Higher values keep edges shorter and tighter, lower values allow more flexibility in edge lengths."
          />
          <SidebarSlider
            label="X-Position Strength"
            value={forceTuning.xStrengthScale}
            min={0}
            max={10}
            step={0.1}
            onChange={(v) => onForceTuningChange({ ...forceTuning, xStrengthScale: v })}
            tooltip="Controls how strongly nodes are anchored to their horizontal (x) positions. Higher values keep sample nodes in their assigned order, lower values allow more horizontal drift."
          />
          <SidebarSlider
            label="Collision Radius"
            value={forceTuning.collisionRadiusScale}
            min={0.2}
            max={6}
            step={0.1}
            onChange={(v) => onForceTuningChange({ ...forceTuning, collisionRadiusScale: v })}
            tooltip="Sets the minimum distance between node centers. Higher values create more space around each node, preventing overlap. Lower values allow nodes to sit closer together."
          />
          <SidebarSlider
            label="Collision Strength"
            value={forceTuning.collisionStrength}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => onForceTuningChange({ ...forceTuning, collisionStrength: v })}
            tooltip="Controls how strongly the collision force is applied. At 1.0, collisions are fully enforced. At 0, collision detection is disabled, allowing nodes to overlap."
          />
          {/* Removed per request: Y strength, Crossing Repulsion, Edge Bundling, Descendant Range */}
        </div>
      </SidebarSubsection>
    </div>
  );
}

// Nodes Section
interface NodesSectionProps {
  nodeSizes: NodeSizeSettings;
  onNodeSizeChange: (sizes: NodeSizeSettings) => void;
  nodeIdSettings: NodeIdSettings;
  onNodeIdSettingsChange: (settings: NodeIdSettings) => void;
}

export function NodesSection({
  nodeSizes,
  onNodeSizeChange,
  nodeIdSettings,
  onNodeIdSettingsChange
}: NodesSectionProps) {
  return (
    <div className="space-y-4">
      <SidebarSubsection title="Node Sizes">
        <SidebarSlider
          label="Sample Nodes"
          value={nodeSizes.sample}
          min={4}
          max={30}
          step={1}
          onChange={(value) => onNodeSizeChange({ ...nodeSizes, sample: value })}
        />
        
        <SidebarSlider
          label="Root Nodes"
          value={nodeSizes.root}
          min={4}
          max={30}
          step={1}
          onChange={(value) => onNodeSizeChange({ ...nodeSizes, root: value })}
        />
        
        <SidebarSlider
          label="Internal Nodes"
          value={nodeSizes.other}
          min={4}
          max={30}
          step={1}
          onChange={(value) => onNodeSizeChange({ ...nodeSizes, other: value })}
        />
      </SidebarSubsection>

      <SidebarSubsection title="Node IDs">
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
      </SidebarSubsection>
    </div>
  );
}

// Edges Section
interface EdgesSectionProps {
  edgeThickness: number;
  onEdgeThicknessChange: (thickness: number) => void;
  edgeOpacity: number;
  onEdgeOpacityChange: (opacity: number) => void;
  edgeLabelSettings: EdgeLabelSettings;
  onEdgeLabelSettingsChange: (settings: EdgeLabelSettings) => void;
  edgeMutationSettings: EdgeMutationSettings;
  onEdgeMutationSettingsChange: (settings: EdgeMutationSettings) => void;
}

export function EdgesSection({
  edgeThickness,
  onEdgeThicknessChange,
  edgeOpacity,
  onEdgeOpacityChange,
  edgeLabelSettings,
  onEdgeLabelSettingsChange,
  edgeMutationSettings,
  onEdgeMutationSettingsChange
}: EdgesSectionProps) {
  // Convert edgeOpacity from 0-100 scale (state) to 0-1 scale (slider display)
  const edgeOpacitySliderValue = Math.max(0, Math.min(1, edgeOpacity / 100));
  
  // Handle opacity change: convert from 0-1 scale (slider) to 0-100 scale (state)
  const handleEdgeOpacityChange = (sliderValue: number) => {
    const clampedValue = Math.max(0, Math.min(100, sliderValue * 100));
    onEdgeOpacityChange(clampedValue);
  };

  return (
    <div className="space-y-4">
      <SidebarSubsection title="Edge Appearance">
        <SidebarSlider
          label="Edge Width"
          value={edgeThickness}
          min={0.5}
          max={10}
          step={0.5}
          onChange={onEdgeThicknessChange}
        />
        
        <SidebarSlider
          label="Edge Opacity"
          value={edgeOpacitySliderValue}
          min={0}
          max={1}
          step={0.01}
          onChange={handleEdgeOpacityChange}
          formatValue={(v) => `${Math.round(v * 100)}%`}
        />
      </SidebarSubsection>

      <SidebarSubsection title="Edge Labels">
        <SidebarCheckbox
          label="Show Edge Labels"
          checked={edgeLabelSettings.showEdgeLabels}
          onChange={(checked) => onEdgeLabelSettingsChange({ ...edgeLabelSettings, showEdgeLabels: checked })}
        />
        
        {edgeLabelSettings.showEdgeLabels && (
          <SidebarSlider
            label="Label Font Size"
            value={edgeLabelSettings.labelFontSize}
            min={8}
            max={24}
            step={1}
            onChange={(size) => onEdgeLabelSettingsChange({ ...edgeLabelSettings, labelFontSize: size })}
          />
        )}
      </SidebarSubsection>

      <SidebarSubsection title="Mutations">
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
            max={24}
            step={1}
            onChange={(size) => onEdgeMutationSettingsChange({ ...edgeMutationSettings, markerSize: size })}
          />
        )}
      </SidebarSubsection>
    </div>
  );
}

// Information Section
interface InformationSectionProps {
  originalNodeCount?: number;
  originalEdgeCount?: number;
  subargNodeCount?: number;
  subargEdgeCount?: number;
  displayedNodeCount?: number;
  displayedEdgeCount?: number;
  genomicRange?: [number, number];
  sequenceLength?: number;
  isFiltered?: boolean;
}

export function InformationSection({
  originalNodeCount,
  originalEdgeCount,
  subargNodeCount,
  subargEdgeCount,
  displayedNodeCount,
  displayedEdgeCount,
  genomicRange,
  sequenceLength,
  isFiltered = false
}: InformationSectionProps) {
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
                  {originalNodeCount.toLocaleString()} nodes, {originalEdgeCount.toLocaleString()} edges
                </span>
              </div>
            )}
            
            {subargNodeCount && subargEdgeCount && (
              <div className="flex justify-between">
                <span style={{ color: colors.accentPrimary }}>SubARG:</span>
                <span style={{ color: colors.text }}>
                  {subargNodeCount.toLocaleString()} nodes ({nodePercentage}%), {subargEdgeCount.toLocaleString()} edges ({edgePercentage}%)
                </span>
              </div>
            )}
            
            {displayedNodeCount && displayedEdgeCount && (displayedNodeCount !== subargNodeCount || displayedEdgeCount !== subargEdgeCount) && (
              <div className="flex justify-between">
                <span style={{ color: colors.accentPrimary }}>Displayed:</span>
                <span style={{ color: colors.text }}>
                  {displayedNodeCount.toLocaleString()} nodes, {displayedEdgeCount.toLocaleString()} edges
                </span>
              </div>
            )}

            {displayedNodeCount && originalNodeCount && displayedNodeCount !== originalNodeCount && (
              <div className="flex justify-between">
                <span style={{ color: colors.accentPrimary }}>Reduction:</span>
                <span style={{ color: colors.text }}>
                  {((1 - displayedNodeCount / originalNodeCount) * 100).toFixed(1)}% fewer nodes
                </span>
              </div>
            )}
          </div>
        </SidebarSubsection>
      )}

      {/* Filter Information */}
      {isFiltered && genomicRange && sequenceLength && (
        <SidebarSubsection title="Filter Information">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span style={{ color: colors.accentPrimary }}>Range:</span>
              <span style={{ color: colors.text }}>
                {formatGenomicPosition(genomicRange[0])} - {formatGenomicPosition(genomicRange[1])}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span style={{ color: colors.accentPrimary }}>Length:</span>
              <span style={{ color: colors.text }}>
                {formatGenomicPosition(genomicRange[1] - genomicRange[0])} bp
              </span>
            </div>
            
            <div className="flex justify-between">
              <span style={{ color: colors.accentPrimary }}>Coverage:</span>
              <span style={{ color: colors.text }}>
                {((genomicRange[1] - genomicRange[0]) / sequenceLength * 100).toFixed(1)}% of sequence
              </span>
            </div>
          </div>
        </SidebarSubsection>
      )}

      {/* View Instructions */}
      <SidebarSubsection title="View Controls">
        <SidebarInfoBox>
          <div className="space-y-1">
            <div>• Drag: Pan view</div>
            <div>• Scroll: Zoom in/out</div>
            <div>• Left click: Select node</div>
            <div>• Right click: Show ancestors</div>
            <div>• Drag nodes to reposition</div>
          </div>
        </SidebarInfoBox>
      </SidebarSubsection>

      {/* Node Types Legend */}
      <SidebarSubsection title="Node Types">
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full border"
              style={{
                backgroundColor: `rgb(${colors.nodeSample[0]}, ${colors.nodeSample[1]}, ${colors.nodeSample[2]})`,
                borderColor: colors.background,
                borderWidth: '0.5px'
              }}
            ></div>
            <span style={{ color: colors.text }}>Sample Nodes</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{backgroundColor: `rgb(${colors.nodeDefault[0]}, ${colors.nodeDefault[1]}, ${colors.nodeDefault[2]})`}}
            ></div>
            <span style={{ color: colors.text }}>Internal Nodes</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{backgroundColor: `rgb(${colors.nodeCombined[0]}, ${colors.nodeCombined[1]}, ${colors.nodeCombined[2]})`}}
            ></div>
            <span style={{ color: colors.text }}>Combined Nodes</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full border-2" 
              style={{
                backgroundColor: `rgb(${colors.nodeRoot[0]}, ${colors.nodeRoot[1]}, ${colors.nodeRoot[2]})`,
                borderColor: `rgb(${colors.nodeSelected[0]}, ${colors.nodeSelected[1]}, ${colors.nodeSelected[2]})`
              }}
            ></div>
            <span style={{ color: colors.text }}>Root Nodes</span>
          </div>
        </div>
      </SidebarSubsection>
    </div>
  );
}



