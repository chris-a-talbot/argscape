/**
 * StylePanel Storybook Stories
 * 
 * Demonstrates the Style Panel component with different configurations.
 * 
 * Note: This project doesn't currently have Storybook installed.
 * This file serves as documentation and example usage.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ColorThemeProvider } from '@/context/ColorThemeContext';
import { StylePanel } from './StylePanel';
import { ColorByMode } from './StylePanel.types';
import { ColorTheme } from '@/context/ColorThemeContext';

const meta: Meta<typeof StylePanel> = {
  title: 'UI/QuickActionsBar/Panels/StylePanel',
  component: StylePanel,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ColorThemeProvider>
        <div style={{ maxWidth: '400px', padding: '20px', backgroundColor: '#f5f5f7' }}>
          <div style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '16px',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            boxShadow: '0 8px 32px rgba(20, 226, 168, 0.12)',
          }}>
            <Story />
          </div>
        </div>
      </ColorThemeProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof StylePanel>;

/**
 * Default StylePanel with all controls
 */
export const Default: Story = {
  render: () => {
    const [nodeSize, setNodeSize] = useState(8);
    const [edgeThickness, setEdgeThickness] = useState(1.5);
    const [edgeOpacity, setEdgeOpacity] = useState(95);
    const [colorBy, setColorBy] = useState<ColorByMode>('time');
    const [theme, setTheme] = useState<ColorTheme>('liquid');

    return (
      <StylePanel
        nodeSize={nodeSize}
        onNodeSizeChange={setNodeSize}
        edgeThickness={edgeThickness}
        onEdgeThicknessChange={setEdgeThickness}
        edgeOpacity={edgeOpacity}
        onEdgeOpacityChange={setEdgeOpacity}
        colorBy={colorBy}
        onColorByChange={setColorBy}
        theme={theme}
        onThemeChange={setTheme}
      />
    );
  },
};

/**
 * StylePanel with limited color modes (e.g., no population data)
 */
export const LimitedColorModes: Story = {
  render: () => {
    const [nodeSize, setNodeSize] = useState(8);
    const [edgeThickness, setEdgeThickness] = useState(1.5);
    const [colorBy, setColorBy] = useState<ColorByMode>('time');

    return (
      <StylePanel
        nodeSize={nodeSize}
        onNodeSizeChange={setNodeSize}
        edgeThickness={edgeThickness}
        onEdgeThicknessChange={setEdgeThickness}
        colorBy={colorBy}
        onColorByChange={setColorBy}
        availableColorModes={['none', 'time', 'type']}
      />
    );
  },
};

/**
 * StylePanel with only node controls
 */
export const NodeControlsOnly: Story = {
  render: () => {
    const [nodeSize, setNodeSize] = useState(10);
    const [colorBy, setColorBy] = useState<ColorByMode>('population');

    return (
      <StylePanel
        nodeSize={nodeSize}
        onNodeSizeChange={setNodeSize}
        colorBy={colorBy}
        onColorByChange={setColorBy}
      />
    );
  },
};

/**
 * StylePanel with only edge controls
 */
export const EdgeControlsOnly: Story = {
  render: () => {
    const [edgeThickness, setEdgeThickness] = useState(2.5);
    const [edgeOpacity, setEdgeOpacity] = useState(75);

    return (
      <StylePanel
        edgeThickness={edgeThickness}
        onEdgeThicknessChange={setEdgeThickness}
        edgeOpacity={edgeOpacity}
        onEdgeOpacityChange={setEdgeOpacity}
      />
    );
  },
};

/**
 * StylePanel with only theme controls
 */
export const ThemeControlsOnly: Story = {
  render: () => {
    const [theme, setTheme] = useState<ColorTheme>('tskit');

    return (
      <StylePanel
        theme={theme}
        onThemeChange={setTheme}
        availableThemes={['liquid', 'tskit', 'grayscale']}
      />
    );
  },
};

/**
 * StylePanel with large node sizes
 */
export const LargeNodes: Story = {
  render: () => {
    const [nodeSize, setNodeSize] = useState(18);

    return (
      <StylePanel
        nodeSize={nodeSize}
        onNodeSizeChange={setNodeSize}
        nodeSizeMin={10}
        nodeSizeMax={30}
      />
    );
  },
};

/**
 * StylePanel with custom additional controls
 */
export const WithCustomControls: Story = {
  render: () => {
    const [nodeSize, setNodeSize] = useState(8);
    const [customValue, setCustomValue] = useState(50);

    return (
      <StylePanel
        nodeSize={nodeSize}
        onNodeSizeChange={setNodeSize}
      >
        {/* Custom additional controls */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700">Custom Settings</h4>
          <div>
            <label className="text-xs text-gray-600">Custom Parameter</label>
            <input
              type="range"
              min="0"
              max="100"
              value={customValue}
              onChange={(e) => setCustomValue(Number(e.target.value))}
              className="w-full"
            />
            <span className="text-xs text-gray-500">{customValue}</span>
          </div>
        </div>
      </StylePanel>
    );
  },
};

/**
 * All controls at extreme values
 */
export const ExtremeValues: Story = {
  render: () => {
    const [nodeSize, setNodeSize] = useState(24);
    const [edgeThickness, setEdgeThickness] = useState(8);
    const [edgeOpacity, setEdgeOpacity] = useState(100);

    return (
      <StylePanel
        nodeSize={nodeSize}
        onNodeSizeChange={setNodeSize}
        edgeThickness={edgeThickness}
        onEdgeThicknessChange={setEdgeThickness}
        edgeOpacity={edgeOpacity}
        onEdgeOpacityChange={setEdgeOpacity}
      />
    );
  },
};





