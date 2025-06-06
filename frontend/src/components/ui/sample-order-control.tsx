import React from 'react';
import { useColorTheme } from '../../context/ColorThemeContext';

export type SampleOrderType = 'degree' | 'center_minlex' | 'first_tree' | 'custom' | 'numeric';

interface SampleOrderControlProps {
  value: SampleOrderType;
  onChange: (value: SampleOrderType) => void;
  className?: string;
}

const orderOptions: { value: SampleOrderType; label: string; description: string }[] = [
  {
    value: 'degree',
    label: 'Degree',
    description: 'Order by node connectivity (current default)'
  },
  {
    value: 'center_minlex',
    label: 'Center Tree',
    description: 'Minlex postorder of tree at center genomic position'
  },
  {
    value: 'first_tree',
    label: 'First Tree',
    description: 'Minlex postorder of first tree'
  },
  {
    value: 'custom',
    label: 'Consensus',
    description: 'Majority vote across multiple trees'
  },
  {
    value: 'numeric',
    label: 'Numeric',
    description: 'Simple numeric order (0, 1, 2, ...)'
  }
];

export const SampleOrderControl: React.FC<SampleOrderControlProps> = ({
  value,
  onChange,
  className = ""
}) => {
  const { colors } = useColorTheme();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm whitespace-nowrap" style={{ color: colors.text }}>
        Sample Order:
      </span>
      <div className="flex rounded overflow-hidden" style={{ backgroundColor: colors.containerBackground }}>
        {orderOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className="px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap"
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
  );
}; 