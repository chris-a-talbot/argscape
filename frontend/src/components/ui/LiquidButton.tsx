import { useColorTheme, colorStringToRgbaArray } from '@/context/ColorThemeContext';
import { useSemanticColors } from '@/hooks/useSemanticColors';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import { CSSProperties, ReactNode, useState, useMemo } from 'react';

interface LiquidButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

/**
 * LiquidButton - Apple-inspired liquid glass button with enhanced CSS effects
 * 
 * Features:
 * - Smooth liquid animations when liquid effects enabled
 * - Three variants: primary (success), secondary (ghost), danger (error)
 * - Enhanced hover effects with scale and shadow
 * - Disabled state support
 * 
 * Usage:
 * <LiquidButton variant="primary" onClick={handleClick}>
 *   Save Changes
 * </LiquidButton>
 */
export function LiquidButton({ 
  variant = 'primary', 
  children, 
  onClick, 
  disabled = false,
  className = '',
  type = 'button'
}: LiquidButtonProps) {
  const { theme, colors } = useColorTheme();
  const semanticColors = useSemanticColors();
  const { liquidEffectsEnabled } = useUIPreferences();
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  
  const useLiquidEffect = theme === 'liquid' && liquidEffectsEnabled && !disabled;

  // Extract RGB values from semantic colors for shadows
  const successRgb = useMemo(() => {
    const rgba = colorStringToRgbaArray(semanticColors.success);
    return { r: rgba[0], g: rgba[1], b: rgba[2] };
  }, [semanticColors.success]);

  const errorRgb = useMemo(() => {
    const rgba = colorStringToRgbaArray(semanticColors.error);
    return { r: rgba[0], g: rgba[1], b: rgba[2] };
  }, [semanticColors.error]);

  const variantStyles: Record<string, CSSProperties> = {
    primary: {
      backgroundColor: semanticColors.success,
      color: colors.buttonText,
      border: 'none',
    },
    secondary: {
      backgroundColor: 'transparent',
      color: colors.text,
      border: `1px solid ${colors.border}`,
    },
    danger: {
      backgroundColor: semanticColors.error,
      color: colors.buttonText,
      border: 'none',
    }
  };
  
  const getBoxShadow = () => {
    if (variant === 'secondary') return 'none';
    if (!useLiquidEffect) {
      return '0 1px 3px rgba(0, 0, 0, 0.06)';
    }
    // Use success colors for primary, error colors for danger
    const rgb = variant === 'primary' ? successRgb : errorRgb;
    // Enhanced liquid effect shadows
    if (isPressed) {
      return `0 2px 8px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3), 0 1px 3px rgba(0, 0, 0, 0.06)`;
    }
    if (isHovered) {
      return `0 8px 24px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25), 0 4px 12px rgba(0, 0, 0, 0.08)`;
    }
    return `0 4px 12px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15), 0 2px 6px rgba(0, 0, 0, 0.06)`;
  };
  
  const getTransform = () => {
    if (disabled) return 'none';
    if (isPressed) return 'translateY(1px) scale(0.98)';
    if (useLiquidEffect && isHovered) return 'translateY(-2px) scale(1.02)';
    if (isHovered) return 'translateY(-1px)';
    return 'none';
  };
  
  const baseStyle: CSSProperties = {
    ...variantStyles[variant],
    fontWeight: 500,
    fontSize: '1rem',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: useLiquidEffect 
      ? 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' // Elastic easing for liquid effect
      : 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
    transform: getTransform(),
    boxShadow: getBoxShadow(),
    position: 'relative',
    overflow: 'hidden',
  };
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      className={`px-6 py-3 rounded-lg ${className}`}
      style={baseStyle}
    >
      {/* Liquid shimmer effect overlay */}
      {useLiquidEffect && isHovered && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
            animation: 'shimmer 1.5s infinite',
            pointerEvents: 'none',
          }}
        />
      )}
      {children}
      <style>{`
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 200%; }
        }
      `}</style>
    </button>
  );
}

