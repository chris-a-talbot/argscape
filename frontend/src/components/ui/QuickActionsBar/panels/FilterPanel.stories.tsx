/**
 * FilterPanel Storybook Stories
 * 
 * Visual documentation and testing for FilterPanel component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { FilterPanel } from './FilterPanel';
import type { FilterPanelProps, FilterMode } from './FilterPanel.types';

const meta: Meta<typeof FilterPanel> = {
  title: 'QuickActionsBar/Panels/FilterPanel',
  component: FilterPanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Unified filter panel for genomic, tree, and temporal filtering with Subset/Highlight mode toggle.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FilterPanel>;

// Sample tree intervals for stories
const sampleTreeIntervals = Array.from({ length: 100 }, (_, i) => ({
  index: i,
  left: i * 1000,
  right: (i + 1) * 1000,
}));

// Wrapper component to handle state
const FilterPanelWrapper = (props: Partial<FilterPanelProps>) => {
  const [filterMode, setFilterMode] = useState<FilterMode>('subset');
  const [dimOpacity, setDimOpacity] = useState(0.3);
  const [genomicRange, setGenomicRange] = useState<[number, number]>([0, 100000]);
  const [treeRange, setTreeRange] = useState<[number, number]>([0, 99]);
  const [temporalRange, setTemporalRange] = useState<[number, number]>([0, 1000]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <FilterPanel
        filterMode={filterMode}
        onFilterModeChange={setFilterMode}
        dimOpacity={dimOpacity}
        onDimOpacityChange={setDimOpacity}
        genomicFilter={
          props.genomicFilter || {
            enabled: true,
            sequenceLength: 100000,
            value: genomicRange,
            onChange: setGenomicRange,
            formatValue: (v) => v.toLocaleString(),
          }
        }
        treeFilter={
          props.treeFilter || {
            enabled: true,
            treeIntervals: sampleTreeIntervals,
            value: treeRange,
            onChange: setTreeRange,
          }
        }
        temporalFilter={
          props.temporalFilter || {
            enabled: true,
            min: 0,
            max: 1000,
            value: temporalRange,
            onChange: setTemporalRange,
            formatValue: (v) => v.toFixed(1),
          }
        }
        {...props}
      />
    </div>
  );
};

/**
 * Default state with all filters enabled
 */
export const Default: Story = {
  render: () => <FilterPanelWrapper />,
};

/**
 * Only genomic filtering available
 */
export const GenomicOnly: Story = {
  render: () => (
    <FilterPanelWrapper
      treeFilter={{ enabled: false, treeIntervals: [], value: [0, 0], onChange: () => {} }}
      temporalFilter={{ enabled: false, min: 0, max: 0, value: [0, 0], onChange: () => {} }}
    />
  ),
};

/**
 * Only tree filtering available
 */
export const TreeOnly: Story = {
  render: () => (
    <FilterPanelWrapper
      genomicFilter={{ enabled: false, sequenceLength: 0, value: [0, 0], onChange: () => {} }}
      temporalFilter={{ enabled: false, min: 0, max: 0, value: [0, 0], onChange: () => {} }}
    />
  ),
};

/**
 * Only temporal filtering available
 */
export const TemporalOnly: Story = {
  render: () => (
    <FilterPanelWrapper
      genomicFilter={{ enabled: false, sequenceLength: 0, value: [0, 0], onChange: () => {} }}
      treeFilter={{ enabled: false, treeIntervals: [], value: [0, 0], onChange: () => {} }}
    />
  ),
};

/**
 * Genomic and tree filtering (no temporal)
 */
export const GenomicAndTree: Story = {
  render: () => (
    <FilterPanelWrapper
      temporalFilter={{ enabled: false, min: 0, max: 0, value: [0, 0], onChange: () => {} }}
    />
  ),
};

/**
 * No filters available
 */
export const NoFilters: Story = {
  render: () => (
    <FilterPanelWrapper
      genomicFilter={{ enabled: false, sequenceLength: 0, value: [0, 0], onChange: () => {} }}
      treeFilter={{ enabled: false, treeIntervals: [], value: [0, 0], onChange: () => {} }}
      temporalFilter={{ enabled: false, min: 0, max: 0, value: [0, 0], onChange: () => {} }}
    />
  ),
};

/**
 * Without mode toggle (for contexts where mode is controlled elsewhere)
 */
export const WithoutModeToggle: Story = {
  render: () => <FilterPanelWrapper showModeToggle={false} />,
};

/**
 * Highlight mode with opacity control visible
 */
export const HighlightMode: Story = {
  render: () => {
    const [filterMode, setFilterMode] = useState<FilterMode>('highlight');
    const [dimOpacity, setDimOpacity] = useState(0.5);
    const [genomicRange, setGenomicRange] = useState<[number, number]>([0, 100000]);

    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <FilterPanel
          filterMode={filterMode}
          onFilterModeChange={setFilterMode}
          dimOpacity={dimOpacity}
          onDimOpacityChange={setDimOpacity}
          genomicFilter={{
            enabled: true,
            sequenceLength: 100000,
            value: genomicRange,
            onChange: setGenomicRange,
            formatValue: (v) => v.toLocaleString(),
          }}
          treeFilter={{ enabled: false, treeIntervals: [], value: [0, 0], onChange: () => {} }}
          temporalFilter={{ enabled: false, min: 0, max: 0, value: [0, 0], onChange: () => {} }}
        />
      </div>
    );
  },
};





