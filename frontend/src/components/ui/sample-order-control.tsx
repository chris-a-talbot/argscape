import React from 'react';
import { useColorTheme } from '../../context/ColorThemeContext';

export type SampleOrderType = 'ancestral_path' | 'center_minlex' | 'first_minlex' | 'consensus_minlex' | 'numeric' | 'dagre' | 'coalescence';

interface SampleOrderControlProps {
  value: SampleOrderType;
  onChange: (value: SampleOrderType) => void;
  className?: string;
  /** When true, locks the control to dagre-d3 only (all other modes disabled). */
  forceDagre?: boolean;
}

const basicOrderOptions: { value: SampleOrderType; label: string; description: string }[] = [
  {
    value: 'numeric',
    label: 'Numeric',
    description: 'Simple numeric order (0, 1, 2, ...)'
  },
  {
    value: 'first_minlex',
    label: 'First Tree',
    description: 'Minlex postorder of first tree'
  },
  {
    value: 'center_minlex',
    label: 'Center Tree',
    description: 'Minlex postorder of tree at center genomic position'
  },
  {
    value: 'consensus_minlex',
    label: 'Consensus',
    description: 'Majority vote across multiple trees'
  }
];

const staticOrderOptions: { value: SampleOrderType; label: string; description: string }[] = [
  {
    value: 'dagre',
    label: 'Dagre-d3',
    description: 'Order nodes in each layer using optimization algorithm'
  }
];

const customOrderOptions: { value: SampleOrderType; label: string; description: string }[] = [
  {
    value: 'ancestral_path',
    label: 'Ancestral Path',
    description: 'Order by ancestral path length with hierarchical MRCA-based grouping'
  },
  {
    value: 'coalescence',
    label: 'Coalescence',
    description: 'Order by coalescence time with hierarchical MRCA-based grouping'
  }
];

export const SampleOrderControl: React.FC<SampleOrderControlProps> = ({
  value,
  onChange,
  className = "",
  forceDagre = false
}) => {
  const { colors } = useColorTheme();

  const renderOptions = (label: string, options: typeof basicOrderOptions) => (
    <div className="flex items-start gap-2">
      <span className="text-sm whitespace-nowrap flex-shrink-0 pt-1" style={{ color: colors.text }}>
        {label}
      </span>
      <div className="flex flex-wrap gap-1 flex-1">
        {options.map((option) => {
          const isDisabled = forceDagre && option.value !== 'dagre';
          return (
            <button
              key={option.value}
              onClick={() => !isDisabled && onChange(option.value)}
              disabled={isDisabled}
              className="px-2 py-1 text-xs font-medium transition-colors whitespace-nowrap rounded"
              style={{
                backgroundColor: value === option.value ? colors.textSecondary : colors.containerBackground,
                color: value === option.value ? colors.background : colors.text,
                opacity: isDisabled ? 0.35 : 1,
                cursor: isDisabled ? 'not-allowed' : 'pointer'
              }}
              title={isDisabled ? 'Dagre-d3 is required for large sample counts' : option.description}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className={`space-y-2 ${className}`}>
      {forceDagre && (
        <div className="text-xs px-2 py-1 rounded" style={{ color: colors.textSecondary, backgroundColor: colors.containerBackground }}>
          Dagre-d3 layout is required for 500+ samples. Switch to a subARG view to unlock other modes.
        </div>
      )}
      {renderOptions('Basic:', basicOrderOptions)}
      {renderOptions('Custom:', customOrderOptions)}
      {renderOptions('Static:', staticOrderOptions)}
    </div>
  );
}; 