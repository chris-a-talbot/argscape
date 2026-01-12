/**
 * ThemeToggle Component
 * 
 * Provides theme selection between Liquid, tskit, Grayscale, and Custom themes.
 * Integrates with ColorThemeContext for app-wide theme changes.
 */

import React from 'react';
import { ThemeToggleProps } from './StylePanel.types';
import { ColorTheme } from '../../../../context/ColorThemeContext';
import { useThemeStyles } from '../../../../hooks/useThemeStyles';

interface ThemeOption {
  value: ColorTheme;
  label: string;
  icon: string;
  description: string;
  preview: string; // Color preview
}

const themeOptions: ThemeOption[] = [
  {
    value: 'liquid',
    label: 'Light',
    icon: '☀️',
    description: 'Modern glass design',
    preview: 'linear-gradient(135deg, #f5f5f7 0%, rgba(10, 157, 126, 0.1) 100%)',
  },
  {
    value: 'tskit',
    label: 'Dark',
    icon: '🌙',
    description: 'Classic dark theme',
    preview: 'linear-gradient(135deg, #1a1a1a 0%, #14E2A8 100%)',
  },
  {
    value: 'grayscale',
    label: 'Paper',
    icon: '📄',
    description: 'Print-friendly grayscale',
    preview: 'linear-gradient(135deg, #ffffff 0%, #000000 100%)',
  },
  {
    value: 'grayscaleInverted',
    label: 'Contrast',
    icon: '◐',
    description: 'High contrast dark',
    preview: 'linear-gradient(135deg, #000000 0%, #ffffff 100%)',
  },
  {
    value: 'custom',
    label: 'Custom',
    icon: '🎨',
    description: 'User-defined colors',
    preview: 'conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
  },
];

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  value,
  onChange,
  availableThemes = ['liquid', 'tskit', 'grayscale', 'grayscaleInverted', 'custom'],
  compact = false,
  className = '',
}) => {
  const { secondaryButtonStyle } = useThemeStyles();

  const filteredOptions = themeOptions.filter(opt =>
    availableThemes.includes(opt.value)
  );

  const handleSelect = (theme: ColorTheme) => {
    onChange(theme);
  };

  if (compact) {
    // Compact mode: horizontal buttons with icons only
    return (
      <div className={`theme-toggle-compact flex gap-1 ${className}`}>
        {filteredOptions.map((option) => {
          const isSelected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`
                p-2 rounded-lg border transition-all duration-200
                ${isSelected
                  ? 'border-[#0a9d7e] bg-[#0a9d7e]/10 scale-110'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
                hover:shadow-sm
              `}
              style={isSelected ? undefined : secondaryButtonStyle}
              aria-pressed={isSelected}
              aria-label={`${option.label} theme: ${option.description}`}
              title={option.description}
            >
              <span className="text-lg" aria-hidden="true">
                {option.icon}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  // Full mode: grid with previews
  return (
    <div className={`theme-toggle ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Theme
      </label>

      <div className="grid grid-cols-2 gap-3">
        {filteredOptions.map((option) => {
          const isSelected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`
                relative flex flex-col items-start
                p-3 rounded-lg
                border-2 transition-all duration-200
                ${isSelected
                  ? 'border-[#0a9d7e] bg-[#0a9d7e]/5 shadow-md'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
                cursor-pointer hover:shadow-sm
              `}
              style={isSelected ? undefined : secondaryButtonStyle}
              aria-pressed={isSelected}
              aria-label={`${option.label} theme: ${option.description}`}
            >
              {/* Color preview */}
              <div
                className="w-full h-12 rounded-md mb-2 border border-gray-200 dark:border-gray-700"
                style={{ background: option.preview }}
                aria-hidden="true"
              />

              {/* Label row */}
              <div className="flex items-center gap-2 w-full">
                <span className="text-lg" aria-hidden="true">
                  {option.icon}
                </span>
                <div className="flex-1 text-left">
                  <div className={`text-sm font-medium ${isSelected ? 'text-[#0a9d7e]' : 'text-gray-700 dark:text-gray-300'}`}>
                    {option.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    {option.description}
                  </div>
                </div>
              </div>

              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="w-6 h-6 bg-[#0a9d7e] rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Description */}
      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
        {themeOptions.find(opt => opt.value === value)?.description}
      </p>
    </div>
  );
};





