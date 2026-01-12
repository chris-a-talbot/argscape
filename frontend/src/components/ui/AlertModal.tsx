import { useEffect } from 'react';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { useSemanticColors } from '../../hooks/useSemanticColors';

interface AlertModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  buttonText?: string;
  secondaryButtonText?: string;
  onClose: () => void;
  onSecondaryAction?: () => void;
  type?: 'success' | 'error' | 'info';
}

export default function AlertModal({ 
  isOpen, 
  title, 
  message, 
  buttonText = 'OK',
  secondaryButtonText,
  onClose,
  onSecondaryAction,
  type = 'info'
}: AlertModalProps) {
  const { colors, modalGlassStyle, modalOverlayStyle } = useThemeStyles();
  const semanticColors = useSemanticColors();
  
  // Handle ESC key
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Helper to create transparent background from a color
  const getTransparentBg = (color: string, opacity: number = 0.1) => {
    // Handle hex colors
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return color;
  };

  const getIconAndColors = () => {
    switch (type) {
      case 'success':
        return {
          icon: (
            <svg className="w-5 h-5" style={{ color: semanticColors.success }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          bgColor: getTransparentBg(semanticColors.success, 0.1),
          buttonColor: semanticColors.success,
          buttonHoverColor: semanticColors.successHover,
          shadowColor: getTransparentBg(semanticColors.success, 0.2)
        };
      case 'error':
        return {
          icon: (
            <svg className="w-5 h-5" style={{ color: semanticColors.error }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          bgColor: getTransparentBg(semanticColors.error, 0.1),
          buttonColor: semanticColors.error,
          buttonHoverColor: semanticColors.errorHover,
          shadowColor: getTransparentBg(semanticColors.error, 0.2)
        };
      default: // info
        return {
          icon: (
            <svg className="w-5 h-5" style={{ color: colors.accentPrimary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          bgColor: getTransparentBg(colors.accentPrimary, 0.1),
          buttonColor: colors.accentPrimary,
          buttonHoverColor: colors.accentSecondary,
          shadowColor: getTransparentBg(colors.accentPrimary, 0.2)
        };
    }
  };

  const { icon, bgColor, buttonColor, buttonHoverColor, shadowColor } = getIconAndColors();

  return (
    <div className="fixed inset-0 z-[10002]">
      {/* Backdrop with consistent blur */}
      <div
        className="fixed inset-0"
        style={modalOverlayStyle}
        onClick={onClose}
      />

      {/* Modal content container */}
      <div className="flex items-center justify-center min-h-screen p-4">
        {/* Modal with proper glass treatment */}
        <div
          className="relative max-w-md w-full mx-4 transform transition-all"
          style={modalGlassStyle}
        >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: bgColor }}>
              {icon}
            </div>
            <h3 className="text-lg font-semibold break-words" style={{ color: colors.text }}>{title}</h3>
          </div>
          
          {/* Message */}
          <div className="mb-6 leading-relaxed break-words whitespace-pre-wrap" style={{ color: colors.textSecondary }}>
            {message}
          </div>
          
          {/* Actions */}
          <div className={`flex ${secondaryButtonText ? 'justify-between' : 'justify-end'} gap-3`}>
            {secondaryButtonText && onSecondaryAction && (
              <button
                onClick={onSecondaryAction}
                className="font-medium py-3 px-6 rounded-xl transition-all duration-200 border"
                style={{
                  backgroundColor: 'transparent',
                  color: colors.text,
                  borderColor: colors.border
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = semanticColors.hoverOverlay;
                  e.currentTarget.style.borderColor = colors.accentPrimary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = colors.border;
                }}
              >
                {secondaryButtonText}
              </button>
            )}
            <button
              onClick={onClose}
              className="font-medium py-3 px-6 rounded-xl transition-all duration-200 hover:transform hover:-translate-y-0.5"
              style={{
                backgroundColor: buttonColor,
                color: colors.buttonText,
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = buttonHoverColor;
                e.currentTarget.style.boxShadow = `0 4px 12px ${shadowColor}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = buttonColor;
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.06)';
              }}
            >
              {buttonText}
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
} 