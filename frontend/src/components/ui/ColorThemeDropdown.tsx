import React, { useState, useRef, useEffect } from 'react';
import { ColorTheme, useColorTheme } from '../../context/ColorThemeContext';

interface ColorThemeOption {
  value: ColorTheme;
  label: string;
  icon: string;
}

const colorThemeOptions: ColorThemeOption[] = [
  { value: 'default', label: 'Color', icon: '🎨' },
  { value: 'grayscale', label: 'B&W', icon: '🌑' },
];

export const ColorThemeDropdown: React.FC = () => {
  const { theme, setTheme, colors } = useColorTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption = colorThemeOptions.find(option => option.value === theme);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleThemeSelect = (themeValue: ColorTheme) => {
    setTheme(themeValue);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="font-medium px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-1"
        style={{
          backgroundColor: colors.containerBackground,
          color: colors.text,
          border: `1px solid ${colors.border}`
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = colors.border;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = colors.containerBackground;
        }}
        onClick={() => setIsOpen(!isOpen)}
        title="Select color theme"
      >
        {currentOption?.icon} {currentOption?.label}
        <svg 
          className="w-4 h-4 ml-1" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-1 py-1 rounded-md shadow-lg z-10 min-w-[120px]"
          style={{
            backgroundColor: colors.containerBackground,
            border: `1px solid ${colors.border}`
          }}
        >
          {colorThemeOptions.map((option) => (
            <button
              key={option.value}
              className="w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2"
              style={{
                color: theme === option.value ? colors.textSecondary : colors.text,
                backgroundColor: theme === option.value ? colors.border : 'transparent'
              }}
              onMouseEnter={(e) => {
                if (theme !== option.value) {
                  e.currentTarget.style.backgroundColor = colors.border;
                }
              }}
              onMouseLeave={(e) => {
                if (theme !== option.value) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
              onClick={() => handleThemeSelect(option.value)}
            >
              {option.icon} {option.label}
              {theme === option.value && (
                <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}; 