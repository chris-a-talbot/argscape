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
  /** Callback when section is opened (useful for tracking user interaction) */
  onOpen?: () => void;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  subtitle,
  defaultOpen = true,
  children,
  className = '',
  headerClassName = '',
  contentClassName = '',
  onOpen
}) => {
  const { colors } = useColorTheme();
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleToggle = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    if (newIsOpen && onOpen) {
      onOpen();
    }
  };

  return (
    <div
      className={`rounded-xl border transition-all overflow-visible ${className}`}
      style={{
        backgroundColor: colors.background,
        borderColor: colors.border
      }}
    >
      {/* Header */}
      <button
        onClick={handleToggle}
        className={`w-full flex items-center justify-between py-2.5 px-4 transition-all hover:bg-opacity-80 rounded-t-xl ${headerClassName} ${!isOpen ? 'rounded-b-xl' : ''}`}
        style={{
          backgroundColor: isOpen ? colors.containerBackground : 'transparent'
        }}
      >
        <div className="flex items-center gap-2.5 flex-1">
          {icon && (
            <div
              className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: colors.accentPrimary + '20',
                color: colors.accentPrimary
              }}
            >
              {icon}
            </div>
          )}
          <div className="flex flex-col items-start gap-0.5">
            <h3 className="text-sm font-semibold" style={{ color: colors.text }}>
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
          className={`p-3 border-t rounded-b-xl ${contentClassName}`}
          style={{ borderColor: colors.border }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

