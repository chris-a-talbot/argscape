/**
 * UnifiedSlider Component
 * 
 * A simplified slider with visual feedback for the Style panel.
 * Provides immediate visual feedback and follows Liquid Glass design system.
 */

import React from 'react';
import { UnifiedSliderProps } from './StylePanel.types';
import { useThemeStyles } from '../../../../hooks/useThemeStyles';

export const UnifiedSlider: React.FC<UnifiedSliderProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  disabled = false,
  description,
  showValue = true,
  preview,
  className = '',
  compact = false,
}) => {
  const { inputStyle } = useThemeStyles();

  const percentage = ((value - min) / (max - min)) * 100;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  return (
    <div className={`unified-slider ${className}`}>
      {/* Header row: label + value */}
      <div className={`flex justify-between items-center ${compact ? 'mb-1' : 'mb-2'}`}>
        <label className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-gray-700 dark:text-gray-300`}>
          {label}
        </label>
        {showValue && (
          <span className={`${compact ? 'text-xs' : 'text-sm'} font-mono text-gray-600 dark:text-gray-400`}>
            {value}{unit}
          </span>
        )}
      </div>

      {/* Slider with custom styling */}
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className="w-full h-2 rounded-full appearance-none cursor-pointer
                     bg-gray-200 dark:bg-gray-700
                     disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            ...inputStyle,
            background: disabled
              ? undefined
              : `linear-gradient(to right, 
                   #0a9d7e 0%, 
                   #0a9d7e ${percentage}%, 
                   rgba(229, 231, 235, 1) ${percentage}%, 
                   rgba(229, 231, 235, 1) 100%)`,
          }}
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={`${value}${unit}`}
        />
        {/* Custom thumb styling via CSS */}
        <style>{`
          .unified-slider input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #0a9d7e;
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
          .unified-slider input[type="range"]::-webkit-slider-thumb:hover {
            transform: scale(1.2);
          }
          .unified-slider input[type="range"]::-webkit-slider-thumb:active {
            transform: scale(1.1);
          }
          .unified-slider input[type="range"]::-moz-range-thumb {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #0a9d7e;
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
          .unified-slider input[type="range"]::-moz-range-thumb:hover {
            transform: scale(1.2);
          }
          .unified-slider input[type="range"]::-moz-range-thumb:active {
            transform: scale(1.1);
          }
          .unified-slider input[type="range"]:disabled::-webkit-slider-thumb,
          .unified-slider input[type="range"]:disabled::-moz-range-thumb {
            cursor: not-allowed;
            opacity: 0.5;
          }
        `}</style>
      </div>

      {/* Optional description */}
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          {description}
        </p>
      )}

      {/* Optional preview */}
      {preview && (
        <div className="mt-2 flex justify-center">
          {preview}
        </div>
      )}
    </div>
  );
};

/**
 * SizePreview Component
 * Visual indicator of node/edge size for slider feedback
 */
export const SizePreview: React.FC<{ size: number; type: 'node' | 'edge' }> = ({
  size,
  type,
}) => {
  if (type === 'node') {
    return (
      <div className="flex items-center justify-center gap-2">
        <span className="text-xs text-gray-500">Preview:</span>
        <div
          className="rounded-full bg-gradient-to-br from-[#0a9d7e] to-[#14E2A8] 
                     shadow-sm transition-all duration-200"
          style={{
            width: `${size}px`,
            height: `${size}px`,
          }}
          aria-hidden="true"
        />
      </div>
    );
  }

  // Edge preview
  return (
    <div className="flex items-center justify-center gap-2">
      <span className="text-xs text-gray-500">Preview:</span>
      <div className="w-12 h-8 flex items-center justify-center">
        <div
          className="w-full bg-gradient-to-r from-[#0a9d7e] to-[#14E2A8] 
                     rounded-full transition-all duration-200"
          style={{
            height: `${size}px`,
          }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
};





