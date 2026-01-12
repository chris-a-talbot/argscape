/**
 * QuickActionsBar Storybook Stories
 * 
 * Note: This project doesn't currently have Storybook installed.
 * This file serves as a placeholder and example of component documentation.
 * 
 * To use Storybook, you would need to:
 * 1. Install: npm install --save-dev @storybook/react @storybook/addon-essentials
 * 2. Initialize: npx storybook@latest init
 * 3. Run: npm run storybook
 * 
 * These stories demonstrate:
 * - Default state with all tabs
 * - Active tab with open panel
 * - Disabled tabs
 * - Tabs with badges
 * - Compact mode
 * - Dark theme (tskit)
 * - Light theme (liquid)
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ColorThemeProvider } from '@/context/ColorThemeContext';
import { QuickActionsBar } from './QuickActionsBar';
import type { QuickActionTab, TabConfig, PanelConfig } from './QuickActionsBar.types';

const meta: Meta<typeof QuickActionsBar> = {
  title: 'UI/QuickActionsBar',
  component: QuickActionsBar,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ColorThemeProvider>
        <div style={{ minHeight: '500px' }}>
          <Story />
        </div>
      </ColorThemeProvider>
    ),
  ],
  argTypes: {
    activeTab: {
      control: 'select',
      options: ['filter', 'view', 'style', 'advanced', 'stats', null],
    },
    enableKeyboardShortcuts: {
      control: 'boolean',
    },
    showHelpButton: {
      control: 'boolean',
    },
    compact: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof QuickActionsBar>;

// Sample tabs
const sampleTabs: TabConfig[] = [
  {
    id: 'filter',
    label: 'Filter',
    icon: <span>🔍</span>,
    shortcut: 'f',
    ariaLabel: 'Filter controls',
  },
  {
    id: 'view',
    label: 'View',
    icon: <span>📊</span>,
    shortcut: 'v',
    ariaLabel: 'View controls',
  },
  {
    id: 'style',
    label: 'Style',
    icon: <span>🎨</span>,
    shortcut: 's',
    ariaLabel: 'Style controls',
  },
  {
    id: 'advanced',
    label: 'Advanced',
    icon: <span>⚙️</span>,
    shortcut: 'a',
    ariaLabel: 'Advanced settings',
  },
  {
    id: 'stats',
    label: 'Stats',
    icon: <span>ℹ️</span>,
    shortcut: 'i',
    ariaLabel: 'Statistics',
  },
];

// Sample panels
const samplePanels: PanelConfig[] = [
  {
    tabId: 'filter',
    content: (
      <div>
        <h3>Filter Controls</h3>
        <p>Genomic range, tree range, temporal range, and filter mode.</p>
        <div style={{ marginTop: '1rem' }}>
          <label>
            Genomic Range:
            <input type="range" min="0" max="100" style={{ display: 'block', width: '100%' }} />
          </label>
        </div>
      </div>
    ),
    defaultHeight: 300,
  },
  {
    tabId: 'view',
    content: (
      <div>
        <h3>View Controls</h3>
        <p>Camera presets, layout options, and view modes.</p>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <button>Top</button>
          <button>Side</button>
          <button>Isometric</button>
        </div>
      </div>
    ),
    defaultHeight: 250,
  },
  {
    tabId: 'style',
    content: (
      <div>
        <h3>Style Controls</h3>
        <p>Node size, edge thickness, colors, and theme.</p>
        <div style={{ marginTop: '1rem' }}>
          <label>
            Node Size:
            <input type="range" min="1" max="10" style={{ display: 'block', width: '100%' }} />
          </label>
        </div>
      </div>
    ),
    defaultHeight: 280,
  },
  {
    tabId: 'advanced',
    content: (
      <div>
        <h3>Advanced Settings</h3>
        <p>Force simulation, clustering, projection, and heatmap settings.</p>
        <div style={{ marginTop: '1rem' }}>
          <label>
            <input type="checkbox" /> Enable Clustering
          </label>
        </div>
      </div>
    ),
    defaultHeight: 350,
  },
  {
    tabId: 'stats',
    content: (
      <div>
        <h3>Statistics</h3>
        <p>Node counts, sequence info, and performance metrics.</p>
        <ul style={{ marginTop: '1rem' }}>
          <li>Nodes: 1,234</li>
          <li>Edges: 2,345</li>
          <li>Samples: 100</li>
          <li>Trees: 50</li>
        </ul>
      </div>
    ),
    defaultHeight: 300,
  },
];

// Interactive wrapper for state management
function InteractiveWrapper(args: any) {
  const [activeTab, setActiveTab] = useState<QuickActionTab | null>(args.activeTab);

  return (
    <QuickActionsBar
      {...args}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onHelpClick={() => alert('Help dialog would open here')}
    />
  );
}

// Stories

export const Default: Story = {
  render: (args) => <InteractiveWrapper {...args} />,
  args: {
    tabs: sampleTabs,
    panels: samplePanels,
    activeTab: null,
    enableKeyboardShortcuts: true,
    showHelpButton: true,
    compact: false,
  },
};

export const WithActiveTab: Story = {
  render: (args) => <InteractiveWrapper {...args} />,
  args: {
    ...Default.args,
    activeTab: 'filter',
  },
};

export const WithBadges: Story = {
  render: (args) => <InteractiveWrapper {...args} />,
  args: {
    ...Default.args,
    tabs: sampleTabs.map((tab) => ({
      ...tab,
      badge: tab.id === 'filter' ? '3' : tab.id === 'stats' ? '!' : undefined,
    })),
  },
};

export const WithDisabledTab: Story = {
  render: (args) => <InteractiveWrapper {...args} />,
  args: {
    ...Default.args,
    tabs: sampleTabs.map((tab) => ({
      ...tab,
      disabled: tab.id === 'advanced',
    })),
  },
};

export const CompactMode: Story = {
  render: (args) => <InteractiveWrapper {...args} />,
  args: {
    ...Default.args,
    compact: true,
  },
};

export const NoHelpButton: Story = {
  render: (args) => <InteractiveWrapper {...args} />,
  args: {
    ...Default.args,
    showHelpButton: false,
  },
};

export const WithRightContent: Story = {
  render: (args) => <InteractiveWrapper {...args} />,
  args: {
    ...Default.args,
    rightContent: (
      <button
        style={{
          padding: '0.5rem 1rem',
          borderRadius: '0.5rem',
          border: '1px solid #ccc',
          background: 'white',
          cursor: 'pointer',
        }}
      >
        Settings
      </button>
    ),
  },
};

export const KeyboardShortcutsDisabled: Story = {
  render: (args) => <InteractiveWrapper {...args} />,
  args: {
    ...Default.args,
    enableKeyboardShortcuts: false,
  },
};

