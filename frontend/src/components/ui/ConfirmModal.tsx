import { useEffect } from 'react';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { useSemanticColors } from '../../hooks/useSemanticColors';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'default' | 'danger';
}

export default function ConfirmModal({ 
  isOpen, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  onConfirm, 
  onCancel,
  type = 'default'
}: ConfirmModalProps) {
  const { colors, modalGlassStyle, modalOverlayStyle } = useThemeStyles();
  const semanticColors = useSemanticColors();
  
  // Handle ESC key
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
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
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const isDanger = type === 'danger';
  const iconBgColor = isDanger ? 'rgba(239, 68, 68, 0.1)' : `${colors.accentPrimary}10`;
  const confirmButtonColor = isDanger ? semanticColors.error : colors.accentPrimary;
  const confirmButtonHoverColor = isDanger ? semanticColors.errorHover : colors.accentSecondary;

  return (
    <div className="fixed inset-0 z-[10002]">
      {/* Backdrop with consistent blur */}
      <div
        className="fixed inset-0"
        style={modalOverlayStyle}
        onClick={onCancel}
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
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: iconBgColor }}>
              {isDanger ? (
                <svg className="w-5 h-5" style={{ color: semanticColors.error }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" style={{ color: colors.accentPrimary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <h3 className="text-lg font-semibold break-words" style={{ color: colors.text }}>{title}</h3>
          </div>
          
          {/* Message */}
          <p className="mb-6 leading-relaxed break-words whitespace-pre-wrap" style={{ color: colors.textSecondary }}>{message}</p>
          
          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 font-medium py-3 px-4 rounded-xl transition-all duration-200 border hover:bg-opacity-80"
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
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 font-medium py-3 px-4 rounded-xl transition-all duration-200 hover:transform hover:-translate-y-0.5"
              style={{
                backgroundColor: confirmButtonColor,
                color: colors.buttonText,
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = confirmButtonHoverColor;
                e.currentTarget.style.boxShadow = isDanger 
                  ? '0 4px 12px rgba(220, 38, 38, 0.2)'
                  : '0 4px 12px rgba(10, 157, 126, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = confirmButtonColor;
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.06)';
              }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
} 