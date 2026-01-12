/**
 * FilterPanel Test Suite
 * 
 * Comprehensive tests for FilterPanel component and subcomponents
 * 
 * Note: Requires vitest and @testing-library/react to be installed
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterPanel } from './FilterPanel';
import { FilterGroup } from './FilterGroup';
import { FilterModeToggle } from './FilterModeToggle';
import { OpacitySlider } from './OpacitySlider';
import type { FilterPanelProps, FilterMode } from './FilterPanel.types';

// Mock color theme context
vi.mock('@/context/ColorThemeContext', () => ({
  useColorTheme: () => ({
    colors: {
      text: '#000000',
      textSecondary: '#666666',
      background: '#ffffff',
      containerBackground: '#f5f5f5',
      border: '#e0e0e0',
      accentPrimary: '#14e2a8',
      buttonText: '#ffffff',
      hoverOverlay: 'rgba(0, 0, 0, 0.05)',
    },
    theme: 'liquid',
  }),
}));

// Sample data for tests
const sampleTreeIntervals = Array.from({ length: 10 }, (_, i) => ({
  index: i,
  left: i * 1000,
  right: (i + 1) * 1000,
}));

const defaultProps: FilterPanelProps = {
  filterMode: 'subset',
  onFilterModeChange: vi.fn(),
  dimOpacity: 0.3,
  onDimOpacityChange: vi.fn(),
  genomicFilter: {
    enabled: true,
    sequenceLength: 100000,
    value: [0, 100000],
    onChange: vi.fn(),
  },
  treeFilter: {
    enabled: true,
    treeIntervals: sampleTreeIntervals,
    value: [0, 9],
    onChange: vi.fn(),
  },
  temporalFilter: {
    enabled: true,
    min: 0,
    max: 1000,
    value: [0, 1000],
    onChange: vi.fn(),
  },
};

describe('FilterPanel', () => {
  it('renders all filter groups when all filters are enabled', () => {
    render(<FilterPanel {...defaultProps} />);
    
    expect(screen.getByText('Genomic Position')).toBeInTheDocument();
    expect(screen.getByText('Tree Selection')).toBeInTheDocument();
    expect(screen.getByText('Time Range')).toBeInTheDocument();
  });

  it('renders mode toggle by default', () => {
    render(<FilterPanel {...defaultProps} />);
    
    expect(screen.getByText('Subset')).toBeInTheDocument();
    expect(screen.getByText('Highlight')).toBeInTheDocument();
  });

  it('hides mode toggle when showModeToggle is false', () => {
    render(<FilterPanel {...defaultProps} showModeToggle={false} />);
    
    expect(screen.queryByText('Subset')).not.toBeInTheDocument();
    expect(screen.queryByText('Highlight')).not.toBeInTheDocument();
  });

  it('shows opacity slider only in highlight mode', () => {
    const { rerender } = render(<FilterPanel {...defaultProps} filterMode="subset" />);
    
    expect(screen.queryByText('Dimmed Opacity')).not.toBeInTheDocument();
    
    rerender(<FilterPanel {...defaultProps} filterMode="highlight" />);
    
    expect(screen.getByText('Dimmed Opacity')).toBeInTheDocument();
  });

  it('renders only enabled filters', () => {
    const props: FilterPanelProps = {
      ...defaultProps,
      treeFilter: { enabled: false, treeIntervals: [], value: [0, 0], onChange: vi.fn() },
      temporalFilter: { enabled: false, min: 0, max: 0, value: [0, 0], onChange: vi.fn() },
    };
    
    render(<FilterPanel {...props} />);
    
    expect(screen.getByText('Genomic Position')).toBeInTheDocument();
    expect(screen.queryByText('Tree Selection')).not.toBeInTheDocument();
    expect(screen.queryByText('Time Range')).not.toBeInTheDocument();
  });

  it('shows "no filters" message when no filters are available', () => {
    const props: FilterPanelProps = {
      ...defaultProps,
      genomicFilter: { enabled: false, sequenceLength: 0, value: [0, 0], onChange: vi.fn() },
      treeFilter: { enabled: false, treeIntervals: [], value: [0, 0], onChange: vi.fn() },
      temporalFilter: { enabled: false, min: 0, max: 0, value: [0, 0], onChange: vi.fn() },
    };
    
    render(<FilterPanel {...props} />);
    
    expect(screen.getByText(/No filtering options available/i)).toBeInTheDocument();
  });

  it('calls onFilterModeChange when mode is toggled', async () => {
    const onFilterModeChange = vi.fn();
    render(<FilterPanel {...defaultProps} onFilterModeChange={onFilterModeChange} />);
    
    const highlightButton = screen.getByText('Highlight');
    await userEvent.click(highlightButton);
    
    expect(onFilterModeChange).toHaveBeenCalledWith('highlight');
  });

  it('displays mode descriptions', () => {
    const { rerender } = render(<FilterPanel {...defaultProps} filterMode="subset" />);
    
    expect(screen.getByText(/Subset mode:/i)).toBeInTheDocument();
    
    rerender(<FilterPanel {...defaultProps} filterMode="highlight" />);
    
    expect(screen.getByText(/Highlight mode:/i)).toBeInTheDocument();
  });
});

describe('FilterGroup', () => {
  it('renders label and children', () => {
    render(
      <FilterGroup label="Test Group">
        <div>Test Content</div>
      </FilterGroup>
    );
    
    expect(screen.getByText('Test Group')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    const TestIcon = <svg data-testid="test-icon" />;
    render(
      <FilterGroup label="Test Group" icon={TestIcon}>
        <div>Content</div>
      </FilterGroup>
    );
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('is expanded by default', () => {
    render(
      <FilterGroup label="Test Group" collapsible>
        <div>Content</div>
      </FilterGroup>
    );
    
    expect(screen.getByText('Content')).toBeVisible();
  });

  it('can be collapsed when collapsible', async () => {
    render(
      <FilterGroup label="Test Group" collapsible defaultExpanded={true}>
        <div>Content</div>
      </FilterGroup>
    );
    
    const header = screen.getByText('Test Group');
    await userEvent.click(header);
    
    // Content should have max-height: 0 and opacity: 0
    const content = screen.getByText('Content').parentElement;
    expect(content).toHaveStyle({ maxHeight: '0', opacity: 0 });
  });

  it('toggles expansion on Enter key', async () => {
    render(
      <FilterGroup label="Test Group" collapsible defaultExpanded={true}>
        <div>Content</div>
      </FilterGroup>
    );
    
    const header = screen.getByText('Test Group');
    header.focus();
    await userEvent.keyboard('{Enter}');
    
    const content = screen.getByText('Content').parentElement;
    expect(content).toHaveStyle({ maxHeight: '0', opacity: 0 });
  });
});

describe('FilterModeToggle', () => {
  it('renders both mode options', () => {
    render(<FilterModeToggle value="subset" onChange={vi.fn()} />);
    
    expect(screen.getByText('Subset')).toBeInTheDocument();
    expect(screen.getByText('Highlight')).toBeInTheDocument();
  });

  it('highlights active mode', () => {
    render(<FilterModeToggle value="subset" onChange={vi.fn()} />);
    
    const subsetButton = screen.getByText('Subset');
    expect(subsetButton).toHaveAttribute('aria-pressed', 'true');
    
    const highlightButton = screen.getByText('Highlight');
    expect(highlightButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onChange when mode is clicked', async () => {
    const onChange = vi.fn();
    render(<FilterModeToggle value="subset" onChange={onChange} />);
    
    const highlightButton = screen.getByText('Highlight');
    await userEvent.click(highlightButton);
    
    expect(onChange).toHaveBeenCalledWith('highlight');
  });

  it('does not call onChange when disabled', async () => {
    const onChange = vi.fn();
    render(<FilterModeToggle value="subset" onChange={onChange} disabled />);
    
    const highlightButton = screen.getByText('Highlight');
    await userEvent.click(highlightButton);
    
    expect(onChange).not.toHaveBeenCalled();
  });

  it('has proper ARIA labels', () => {
    render(<FilterModeToggle value="subset" onChange={vi.fn()} />);
    
    const subsetButton = screen.getByLabelText(/Subset mode/i);
    const highlightButton = screen.getByLabelText(/Highlight mode/i);
    
    expect(subsetButton).toBeInTheDocument();
    expect(highlightButton).toBeInTheDocument();
  });
});

describe('OpacitySlider', () => {
  it('renders with label and value', () => {
    render(<OpacitySlider value={0.5} onChange={vi.fn()} />);
    
    expect(screen.getByText('Dimmed Opacity')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('renders custom label', () => {
    render(<OpacitySlider value={0.5} onChange={vi.fn()} label="Custom Label" />);
    
    expect(screen.getByText('Custom Label')).toBeInTheDocument();
  });

  it('displays preview box', () => {
    render(<OpacitySlider value={0.5} onChange={vi.fn()} />);
    
    expect(screen.getByText(/Preview of dimmed elements/i)).toBeInTheDocument();
  });

  it('calls onChange when slider is dragged', async () => {
    const onChange = vi.fn();
    render(<OpacitySlider value={0.5} onChange={onChange} />);
    
    const slider = screen.getByRole('slider');
    fireEvent.mouseDown(slider, { clientX: 100 });
    
    // onChange should be called (exact value depends on element dimensions)
    expect(onChange).toHaveBeenCalled();
  });

  it('does not call onChange when disabled', async () => {
    const onChange = vi.fn();
    render(<OpacitySlider value={0.5} onChange={onChange} disabled />);
    
    const slider = screen.getByRole('slider');
    fireEvent.mouseDown(slider, { clientX: 100 });
    
    expect(onChange).not.toHaveBeenCalled();
  });

  it('has proper ARIA attributes', () => {
    render(<OpacitySlider value={0.3} onChange={vi.fn()} />);
    
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuemin', '0');
    expect(slider).toHaveAttribute('aria-valuemax', '100');
    expect(slider).toHaveAttribute('aria-valuenow', '30');
  });
});

describe('FilterPanel Integration', () => {
  it('updates opacity when slider is changed in highlight mode', async () => {
    const onDimOpacityChange = vi.fn();
    render(
      <FilterPanel
        {...defaultProps}
        filterMode="highlight"
        onDimOpacityChange={onDimOpacityChange}
      />
    );
    
    const slider = screen.getByRole('slider');
    fireEvent.mouseDown(slider, { clientX: 100 });
    
    expect(onDimOpacityChange).toHaveBeenCalled();
  });

  it('switches from subset to highlight mode and shows opacity slider', async () => {
    const onFilterModeChange = vi.fn();
    const { rerender } = render(
      <FilterPanel {...defaultProps} filterMode="subset" onFilterModeChange={onFilterModeChange} />
    );
    
    const highlightButton = screen.getByText('Highlight');
    await userEvent.click(highlightButton);
    
    expect(onFilterModeChange).toHaveBeenCalledWith('highlight');
    
    // Simulate mode change
    rerender(<FilterPanel {...defaultProps} filterMode="highlight" />);
    
    expect(screen.getByText('Dimmed Opacity')).toBeInTheDocument();
  });

  it('handles responsive layout with multiple filters', () => {
    const { container } = render(<FilterPanel {...defaultProps} />);
    
    // Check that grid layout is applied
    const filtersLayout = container.querySelector('[style*="grid"]');
    expect(filtersLayout).toBeInTheDocument();
  });
});





