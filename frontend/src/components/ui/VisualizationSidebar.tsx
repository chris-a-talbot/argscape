import React, { useState, useRef, useEffect } from 'react';
import { useColorTheme } from '../../context/ColorThemeContext';
import { Tooltip } from './tooltip';

interface SidebarSection {
  id: string;
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  content: React.ReactNode;
}

interface VisualizationSidebarProps {
  sections: SidebarSection[];
  position?: 'left' | 'right';
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  defaultCollapsed?: boolean;
}

export const VisualizationSidebar: React.FC<VisualizationSidebarProps> = ({
  sections,
  position = 'right',
  defaultWidth = 320,
  minWidth = 240,
  maxWidth = 600,
  defaultCollapsed = false,
}) => {
  const { colors } = useColorTheme();
  const storageKey = 'vizSidebar';
  const sectionsKey = sections.map(s => s.id).join('|');

  // Initialize from localStorage when available, fall back to defaults
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(`${storageKey}:collapsed`);
      return raw !== null ? JSON.parse(raw) : defaultCollapsed;
    } catch {
      return defaultCollapsed;
    }
  });

  const [width, setWidth] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(`${storageKey}:width`);
      return raw !== null ? JSON.parse(raw) : defaultWidth;
    } catch {
      return defaultWidth;
    }
  });

  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(`${storageKey}:expanded:${sectionsKey}`);
      if (raw) {
        const ids: string[] = JSON.parse(raw);
        return new Set(ids);
      }
    } catch {}
    return new Set(sections.filter(s => s.defaultOpen !== false).map(s => s.id));
  });
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(0);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = width;
  };

  useEffect(() => {
    if (!isResizing) return;

    // Prevent text selection during resize
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';

    const handleResizeMove = (e: MouseEvent) => {
      e.preventDefault();
      
      const delta = position === 'left' 
        ? e.clientX - resizeStartX.current
        : resizeStartX.current - e.clientX;
      
      const newWidth = Math.max(
        minWidth,
        Math.min(maxWidth, resizeStartWidth.current + delta)
      );
      
      setWidth(newWidth);
    };

    const handleResizeEnd = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);

    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, minWidth, maxWidth, position]);

  // Persist UI state
  useEffect(() => {
    try { localStorage.setItem(`${storageKey}:collapsed`, JSON.stringify(isCollapsed)); } catch {}
  }, [isCollapsed]);

  useEffect(() => {
    try { localStorage.setItem(`${storageKey}:width`, JSON.stringify(width)); } catch {}
  }, [width]);

  useEffect(() => {
    try {
      localStorage.setItem(`${storageKey}:expanded:${sectionsKey}`, JSON.stringify(Array.from(expandedSections)));
    } catch {}
  }, [expandedSections, sectionsKey]);

  const collapseExpandButton = (
    <button
      onClick={() => setIsCollapsed(!isCollapsed)}
      className="p-2 rounded-lg transition-all flex items-center justify-center"
      style={{
        backgroundColor: colors.containerBackground,
        color: colors.accentPrimary,
        border: `1px solid ${colors.border}`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = colors.accentPrimary;
        e.currentTarget.style.color = colors.background;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = colors.containerBackground;
        e.currentTarget.style.color = colors.accentPrimary;
      }}
      title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      {isCollapsed ? (
        position === 'left' ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        )
      ) : (
        position === 'left' ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )
      )}
    </button>
  );

  return (
    <div
      ref={sidebarRef}
      className="flex h-full flex-row min-h-0 min-w-0"
      style={{
        width: isCollapsed ? '48px' : `${width}px`,
        transition: isCollapsed ? 'width 0.3s ease-in-out' : 'none',
        cursor: isResizing ? 'ew-resize' : 'auto',
      }}
    >
      {/* Resize Handle - Always on LEFT for right sidebar */}
      {!isCollapsed && position === 'right' && (
        <div
          className="relative flex-shrink-0 group"
          style={{
            width: '4px',
            backgroundColor: isResizing ? colors.accentPrimary : 'transparent',
            cursor: 'ew-resize',
            userSelect: 'none',
            zIndex: 9999,
          }}
          onMouseDown={handleResizeStart}
        >
          {/* Subtle border line */}
          <div
            className="absolute inset-y-0 left-0"
            style={{
              width: '1px',
              backgroundColor: colors.border,
              opacity: isResizing ? 0 : 0.3,
            }}
          />
          
          {/* Visual indicator - always visible */}
          <div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-1 py-2 rounded transition-all pointer-events-none"
            style={{
              backgroundColor: colors.accentPrimary,
              opacity: isResizing ? 1 : 0.4,
            }}
          >
            <div className="flex flex-col gap-1">
              <div style={{ width: '2px', height: '4px', backgroundColor: colors.background, borderRadius: '1px' }} />
              <div style={{ width: '2px', height: '4px', backgroundColor: colors.background, borderRadius: '1px' }} />
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Content */}
      <div
        className="flex-1 h-full flex flex-col shadow-lg min-h-0 min-w-0"
        style={{
          backgroundColor: colors.background,
          borderLeft: position === 'right' ? `1px solid ${colors.border}` : 'none',
          borderRight: position === 'left' ? `1px solid ${colors.border}` : 'none',
        }}
      >
        {isCollapsed ? (
          /* Collapsed State - Only show toggle button */
          <div className="p-2 h-full flex flex-col items-center">
            {collapseExpandButton}
          </div>
        ) : (
          /* Expanded State - Show full content */
          <>
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{
                borderBottomColor: colors.border,
                backgroundColor: `${colors.containerBackground}40`,
              }}
            >
              <h2 className="text-base font-bold" style={{ color: colors.accentPrimary }}>
                Controls
              </h2>
              {collapseExpandButton}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              <div className="p-3 space-y-3">
                {sections.map((section, index) => {
                  const isExpanded = expandedSections.has(section.id);
                  
                  return (
                    <div key={section.id}>
                      <div
                        className="rounded-md border"
                        style={{
                          backgroundColor: colors.containerBackground,
                          borderColor: isExpanded ? colors.accentPrimary + '40' : colors.border + '40',
                          transition: 'border-color 0.2s',
                        }}
                      >
                        {/* Section Header */}
                        <button
                          onClick={() => toggleSection(section.id)}
                          className="w-full flex items-center justify-between px-3 py-2.5 transition-all rounded-t-md"
                          style={{
                            color: colors.text,
                            backgroundColor: isExpanded ? `${colors.accentPrimary}10` : 'transparent',
                          }}
                          onMouseEnter={(e) => {
                            if (!isExpanded) {
                              e.currentTarget.style.backgroundColor = `${colors.border}15`;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isExpanded) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          <div className="flex items-center gap-2.5">
                            <div style={{ color: colors.accentPrimary, opacity: 0.9 }}>
                              {section.icon}
                            </div>
                            <h3 className="text-sm font-semibold" style={{ color: colors.text }}>
                              {section.title}
                            </h3>
                          </div>
                          <svg
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                            style={{ color: colors.accentPrimary, opacity: 0.7 }}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={2.5}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {/* Section Content */}
                        {isExpanded && (
                          <div className="px-3 pb-3 pt-1">
                            {section.content}
                          </div>
                        )}
                      </div>
                      
                      {/* Subtle divider between sections */}
                      {index < sections.length - 1 && (
                        <div 
                          className="my-2 h-px" 
                          style={{ backgroundColor: colors.border + '20' }} 
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Resize Handle for LEFT sidebar - Always on RIGHT */}
      {!isCollapsed && position === 'left' && (
        <div
          className="relative flex-shrink-0 group"
          style={{
            width: '4px',
            backgroundColor: isResizing ? colors.accentPrimary : 'transparent',
            cursor: 'ew-resize',
            userSelect: 'none',
            zIndex: 9999,
          }}
          onMouseDown={handleResizeStart}
        >
          {/* Subtle border line */}
          <div
            className="absolute inset-y-0 left-0"
            style={{
              width: '1px',
              backgroundColor: colors.border,
              opacity: isResizing ? 0 : 0.3,
            }}
          />
          
          {/* Visual indicator - always visible */}
          <div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-1 py-2 rounded transition-all pointer-events-none"
            style={{
              backgroundColor: colors.accentPrimary,
              opacity: isResizing ? 1 : 0.4,
            }}
          >
            <div className="flex flex-col gap-1">
              <div style={{ width: '2px', height: '4px', backgroundColor: colors.background, borderRadius: '1px' }} />
              <div style={{ width: '2px', height: '4px', backgroundColor: colors.background, borderRadius: '1px' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component for labeled sliders
interface SidebarSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  unit?: string;
  tooltip?: string;
  formatValue?: (value: number) => string;
}

export const SidebarSlider: React.FC<SidebarSliderProps> = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit = '',
  tooltip,
  formatValue,
}) => {
  const { colors } = useColorTheme();
  const displayValue = formatValue ? formatValue(value) : value;
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-medium" style={{ color: colors.text, opacity: 0.9 }}>
            {label}
          </label>
          {tooltip && <Tooltip content={tooltip} />}
        </div>
        <span
          className="text-xs font-mono px-1.5 py-0.5 rounded"
          style={{
            color: colors.accentPrimary,
            backgroundColor: `${colors.accentPrimary}15`,
            fontWeight: 600,
          }}
        >
          {displayValue}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-lg cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${colors.accentPrimary} 0%, ${colors.accentPrimary} ${percentage}%, ${colors.border}40 ${percentage}%, ${colors.border}40 100%)`,
          accentColor: colors.accentPrimary,
        }}
      />
    </div>
  );
};

// Helper component for checkboxes
interface SidebarCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  tooltip?: string;
}

export const SidebarCheckbox: React.FC<SidebarCheckboxProps> = ({
  label,
  checked,
  onChange,
  tooltip,
}) => {
  const { colors } = useColorTheme();

  return (
    <label className="flex items-center justify-between cursor-pointer group py-1">
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium" style={{ color: colors.text, opacity: 0.9 }}>
          {label}
        </span>
        {tooltip && <Tooltip content={tooltip} />}
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded focus:ring-2"
        style={{
          accentColor: colors.accentPrimary,
        }}
      />
    </label>
  );
};

// Helper component for button groups
interface ButtonOption {
  value: string;
  label: string;
  tooltip?: string;
}

interface SidebarButtonGroupProps {
  label?: string;
  options: ButtonOption[];
  value: string;
  onChange: (value: string) => void;
  tooltip?: string;
  disabled?: boolean;
}

export const SidebarButtonGroup: React.FC<SidebarButtonGroupProps> = ({
  label,
  options,
  value,
  onChange,
  tooltip,
  disabled = false,
}) => {
  const { colors } = useColorTheme();

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-medium" style={{ color: colors.text, opacity: disabled ? 0.5 : 0.9 }}>
            {label}
          </label>
          {tooltip && <Tooltip content={tooltip} />}
        </div>
      )}
      <div className="flex rounded-md overflow-hidden border" style={{ borderColor: colors.border + '40', opacity: disabled ? 0.5 : 1 }}>
        {options.map((option, index) => (
          <button
            key={option.value}
            onClick={() => !disabled && onChange(option.value)}
            disabled={disabled}
            className="flex-1 px-2.5 py-1.5 text-xs font-medium transition-all"
            style={{
              backgroundColor: value === option.value ? colors.accentPrimary : 'transparent',
              color: value === option.value ? colors.background : colors.text,
              borderLeft: index > 0 ? `1px solid ${colors.border}30` : 'none',
              opacity: value === option.value ? 1 : 0.85,
            }}
            title={option.tooltip}
            onMouseEnter={(e) => {
              if (value !== option.value) {
                e.currentTarget.style.backgroundColor = `${colors.border}15`;
              }
            }}
            onMouseLeave={(e) => {
              if (value !== option.value) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// Helper component for info/help text
interface SidebarInfoBoxProps {
  children: React.ReactNode;
}

export const SidebarInfoBox: React.FC<SidebarInfoBoxProps> = ({ children }) => {
  const { colors } = useColorTheme();

  return (
    <div
      className="text-xs leading-relaxed p-2.5 rounded-md border"
      style={{
        color: `${colors.text}CC`,
        backgroundColor: `${colors.containerBackground}30`,
        borderColor: `${colors.border}30`,
      }}
    >
      {children}
    </div>
  );
};

// Helper component for subsections
interface SidebarSubsectionProps {
  title: string;
  children: React.ReactNode;
  tooltip?: string;
}

export const SidebarSubsection: React.FC<SidebarSubsectionProps> = ({ title, children, tooltip }) => {
  const { colors } = useColorTheme();

  return (
    <div className="space-y-2.5 mt-2 first:mt-0">
      <div className="flex items-center gap-1.5 pb-1" style={{ borderBottom: `1px solid ${colors.border}20` }}>
        <h4 className="text-xs font-semibold tracking-wide" style={{ color: colors.accentPrimary, opacity: 0.95 }}>
          {title}
        </h4>
        {tooltip && <Tooltip content={tooltip} />}
      </div>
      <div className="space-y-2.5">
        {children}
      </div>
    </div>
  );
};

