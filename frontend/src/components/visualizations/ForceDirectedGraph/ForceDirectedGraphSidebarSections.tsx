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
}

export function LayoutSpacingSection({
  sampleOrder,
  onSampleOrderChange,
  temporalSpacingMode,
  onTemporalSpacingModeChange,
  temporalSpacing,
  onTemporalSpacingChange,
  sampleSpacing,
  onSampleSpacingChange
}: LayoutSpacingSectionProps) {
  const { colors } = useColorTheme();

  return (
    <div className="space-y-4">
      <SidebarSubsection title="Sample Order">
        <SampleOrderControl 
          value={sampleOrder}
          onChange={onSampleOrderChange}
        />
      </SidebarSubsection>

      <SidebarSubsection title="Temporal Spacing">
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
          label="Spacing Multiplier"
          value={temporalSpacing}
          min={0.1}
          max={5}
          step={0.1}
          onChange={onTemporalSpacingChange}
          tooltip="Adjust the vertical spacing between temporal layers"
        />
      </SidebarSubsection>

      <SidebarSubsection title="Sample Spacing">
        <SidebarSlider
          label="Horizontal Spacing"
          value={sampleSpacing}
          min={10}
          max={200}
          step={5}
          onChange={onSampleSpacingChange}
        />
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
          value={edgeOpacity}
          min={0.1}
          max={1}
          step={0.1}
          onChange={onEdgeOpacityChange}
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
      <SidebarInfoBox
        title="View Controls"
        content={
          <div className="space-y-1 text-xs">
            <div>• Drag: Pan view</div>
            <div>• Scroll: Zoom in/out</div>
            <div>• Left click: Select node</div>
            <div>• Right click: Show ancestors</div>
            <div>• Drag nodes to reposition</div>
          </div>
        }
      />

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

