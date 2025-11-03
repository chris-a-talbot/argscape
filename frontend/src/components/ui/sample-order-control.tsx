import React from 'react';
import { useColorTheme } from '../../context/ColorThemeContext';

export type SampleOrderType = 'ancestral' | 'center_minlex' | 'first_minlex' | 'consensus_minlex' | 'numeric' | 'dagre' | 'coalescence';

interface SampleOrderControlProps {
  value: SampleOrderType;
  onChange: (value: SampleOrderType) => void;
  className?: string;
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
    value: 'ancestral',
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
  className = ""
}) => {
  const { colors } = useColorTheme();

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-start gap-2">
        <span className="text-sm whitespace-nowrap flex-shrink-0 pt-1" style={{ color: colors.text }}>
          Basic:
        </span>
        <div className="flex flex-wrap gap-1 flex-1">
          {basicOrderOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className="px-2 py-1 text-xs font-medium transition-colors whitespace-nowrap rounded"
              style={{
                backgroundColor: value === option.value ? colors.textSecondary : colors.containerBackground,
                color: value === option.value ? colors.background : colors.text
              }}
              title={option.description}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex items-start gap-2">
        <span className="text-sm whitespace-nowrap flex-shrink-0 pt-1" style={{ color: colors.text }}>
          Custom:
        </span>
        <div className="flex flex-wrap gap-1 flex-1">
          {customOrderOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className="px-2 py-1 text-xs font-medium transition-colors whitespace-nowrap rounded"
              style={{
                backgroundColor: value === option.value ? colors.textSecondary : colors.containerBackground,
                color: value === option.value ? colors.background : colors.text
              }}
              title={option.description}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex items-start gap-2">
        <span className="text-sm whitespace-nowrap flex-shrink-0 pt-1" style={{ color: colors.text }}>
          Static:
        </span>
        <div className="flex flex-wrap gap-1 flex-1">
          {staticOrderOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className="px-2 py-1 text-xs font-medium transition-colors whitespace-nowrap rounded"
              style={{
                backgroundColor: value === option.value ? colors.textSecondary : colors.containerBackground,
                color: value === option.value ? colors.background : colors.text
              }}
              title={option.description}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}; 