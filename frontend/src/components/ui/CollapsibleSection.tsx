import React, { useState } from 'react';
import { useColorTheme } from '../../context/ColorThemeContext';

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  subtitle,
  defaultOpen = true,
  children,
  className = '',
  headerClassName = '',
  contentClassName = ''
}) => {
  const { colors } = useColorTheme();
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div 
      className={`rounded-xl border transition-all ${className}`}
      style={{ 
        backgroundColor: colors.background,
        borderColor: colors.border
      }}
    >
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-4 transition-colors hover:bg-opacity-80 ${headerClassName}`}
        style={{ 
          backgroundColor: isOpen ? colors.containerBackground : 'transparent'
        }}
      >
        <div className="flex items-center gap-3 flex-1">
          {icon && (
            <div 
              className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
              style={{ 
                backgroundColor: colors.accentPrimary + '20',
                color: colors.accentPrimary
              }}
            >
              {icon}
            </div>
          )}
          <div className="flex flex-col items-start gap-1">
            <h3 className="text-base font-semibold" style={{ color: colors.text }}>
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs" style={{ color: colors.textSecondary }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        
        {/* Chevron */}
        <svg 
          className={`w-5 h-5 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: colors.textSecondary }}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Content */}
      {isOpen && (
        <div 
          className={`p-4 border-t ${contentClassName}`}
          style={{ borderColor: colors.border }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

