import React from 'react';
import { SidebarSlider, SidebarInfoBox, SidebarSubsection } from '../ui/VisualizationSidebar';

// ========== DIFF CONTROLS SECTION ==========
interface DiffControlsSectionProps {
  diffEdgeWidth: number;
  onDiffEdgeWidthChange: (value: number) => void;
}

export const DiffControlsSection: React.FC<DiffControlsSectionProps> = ({
  diffEdgeWidth,
  onDiffEdgeWidthChange,
}) => {
  return (
    <div className="space-y-4">
      <SidebarSubsection title="Error Visualization" tooltip="Control how differences are displayed">
        <SidebarSlider
          label="Error Bar Thickness"
          value={diffEdgeWidth}
          min={1}
          max={10}
          step={0.5}
          onChange={onDiffEdgeWidthChange}
          unit="x"
        />

        <SidebarInfoBox>
          <div>Error bars visualize the spatial movement of nodes between the two tree sequences.</div>
          <div className="mt-1">Longer bars indicate greater positional differences.</div>
        </SidebarInfoBox>
      </SidebarSubsection>
    </div>
  );
};

