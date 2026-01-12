import React from 'react';
import { useColorTheme } from '../../../context/ColorThemeContext';

interface WizardStepProps {
  title: string;
  description?: string;
  suggestion?: {
    type: 'info' | 'warning' | 'recommendation';
    message: string;
  };
  children: React.ReactNode;
}

export function WizardStep({ title, description, suggestion, children }: WizardStepProps) {
  const { colors } = useColorTheme();

  const getSuggestionStyles = () => {
    switch (suggestion?.type) {
      case 'warning':
        return {
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderColor: 'rgba(239, 68, 68, 0.3)',
          iconColor: '#ef4444',
        };
      case 'recommendation':
        return {
          backgroundColor: `${colors.accentPrimary}15`,
          borderColor: `${colors.accentPrimary}30`,
          iconColor: colors.accentPrimary,
        };
      default: // info
        return {
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderColor: 'rgba(59, 130, 246, 0.3)',
          iconColor: '#3b82f6',
        };
    }
  };

  const suggestionStyles = suggestion ? getSuggestionStyles() : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold mb-1" style={{ color: colors.text }}>
          {title}
        </h3>
        {description && (
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            {description}
          </p>
        )}
      </div>

      {/* Suggestion Banner */}
      {suggestion && suggestionStyles && (
        <div
          className="flex items-start gap-3 p-3 rounded-lg border"
          style={{
            backgroundColor: suggestionStyles.backgroundColor,
            borderColor: suggestionStyles.borderColor,
          }}
        >
          <div className="flex-shrink-0 mt-0.5">
            {suggestion.type === 'warning' ? (
              <svg className="w-5 h-5" style={{ color: suggestionStyles.iconColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : suggestion.type === 'recommendation' ? (
              <svg className="w-5 h-5" style={{ color: suggestionStyles.iconColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" style={{ color: suggestionStyles.iconColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <p className="text-sm" style={{ color: colors.text }}>
            {suggestion.message}
          </p>
        </div>
      )}

      {/* Step Content */}
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}

interface OptionCardProps {
  selected: boolean;
  onClick: () => void;
  title: string;
  description: string;
  recommended?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function OptionCard({
  selected,
  onClick,
  title,
  description,
  recommended,
  icon,
  children,
}: OptionCardProps) {
  const { colors } = useColorTheme();

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
        selected ? 'ring-2 ring-offset-2' : 'hover:border-opacity-60'
      }`}
      style={{
        backgroundColor: selected ? `${colors.accentPrimary}10` : colors.containerBackground,
        borderColor: selected ? colors.accentPrimary : colors.border,
        // Use CSS variable for Tailwind ring color
        '--tw-ring-color': selected ? colors.accentPrimary : undefined,
      } as React.CSSProperties}
    >
      <div className="flex items-start gap-3">
        {/* Radio indicator */}
        <div
          className="flex-shrink-0 w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center"
          style={{
            borderColor: selected ? colors.accentPrimary : colors.border,
            backgroundColor: selected ? colors.accentPrimary : 'transparent',
          }}
        >
          {selected && (
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.buttonText }} />
          )}
        </div>

        {/* Content */}
        <div className="flex-grow">
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-medium" style={{ color: colors.text }}>
              {title}
            </span>
            {recommended && (
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${colors.accentPrimary}20`,
                  color: colors.accentPrimary,
                }}
              >
                Recommended
              </span>
            )}
          </div>
          <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
            {description}
          </p>
          {/* Expanded content when selected */}
          {selected && children && (
            <div className="mt-3 pt-3 border-t" style={{ borderColor: colors.border }}>
              {children}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

interface CheckboxOptionProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description: string;
  recommended?: boolean;
}

export function CheckboxOption({
  checked,
  onChange,
  label,
  description,
  recommended,
}: CheckboxOptionProps) {
  const { colors } = useColorTheme();

  return (
    <label
      className="flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors"
      style={{ backgroundColor: checked ? `${colors.accentPrimary}08` : 'transparent' }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 rounded"
        style={{ accentColor: colors.accentPrimary }}
      />
      <div>
        <div className="flex items-center gap-2">
          <span className="font-medium" style={{ color: colors.text }}>
            {label}
          </span>
          {recommended && (
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: `${colors.accentPrimary}20`,
                color: colors.accentPrimary,
              }}
            >
              Recommended
            </span>
          )}
        </div>
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          {description}
        </p>
      </div>
    </label>
  );
}

interface SliderInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
}

export function SliderInput({
  label,
  value,
  min,
  max,
  onChange,
  formatValue = (v) => v.toLocaleString(),
}: SliderInputProps) {
  const { colors } = useColorTheme();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm" style={{ color: colors.textSecondary }}>
          {label}
        </span>
        <span className="text-sm font-medium" style={{ color: colors.text }}>
          {formatValue(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
        style={{
          backgroundColor: colors.border,
          accentColor: colors.accentPrimary,
        }}
      />
      <div className="flex justify-between text-xs" style={{ color: colors.textSecondary }}>
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  );
}
