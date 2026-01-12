import { useColorTheme, colorStringToRgbaArray } from '@/context/ColorThemeContext';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import { CSSProperties, ReactNode, useState, useMemo } from 'react';

interface LiquidCardProps {
  children: ReactNode;
  onClick?: () => void;
  interactive?: boolean;
  className?: string;
  padding?: string;
}

/**
 * LiquidCard - Apple-inspired liquid glass card with enhanced CSS effects
 *
 * Features:
 * - Smooth liquid animations when liquid effects enabled
 * - Interactive mode with enhanced hover effects
 * - Automatic glass morphism in liquid theme
 * - Static mode for display-only cards
 *
 * Usage:
 * <LiquidCard interactive onClick={handleClick}>
 *   <h3>Upload a tree sequence</h3>
 *   <p>Upload your own .trees or .tsz file</p>
 * </LiquidCard>
 */
export function LiquidCard({
  children,
  onClick,
  interactive = true,
  className = '',
  padding = '24px'
}: LiquidCardProps) {
  const { theme, colors } = useColorTheme();
  const { liquidEffectsEnabled } = useUIPreferences();
  const [isHovered, setIsHovered] = useState(false);

  const useLiquidEffect = theme === 'liquid' && liquidEffectsEnabled && interactive && onClick;
  const isLiquidTheme = theme === 'liquid';

  // Extract RGB values from theme's glass shadow color
  const shadowRgb = useMemo(() => {
    const rgba = colorStringToRgbaArray(colors.glassShadowPrimary);
    return { r: rgba[0], g: rgba[1], b: rgba[2] };
  }, [colors.glassShadowPrimary]);

  const getBoxShadow = () => {
    if (!isLiquidTheme) return 'none';
    const { r, g, b } = shadowRgb;
    if (!useLiquidEffect) {
      return `0 8px 32px rgba(${r}, ${g}, ${b}, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04)`;
    }
    // Enhanced liquid effect shadows
    if (isHovered) {
      return `0 16px 48px rgba(${r}, ${g}, ${b}, 0.2), 0 8px 16px rgba(0, 0, 0, 0.08)`;
    }
    return `0 8px 32px rgba(${r}, ${g}, ${b}, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04)`;
  };
  
  const getTransform = () => {
    if (!useLiquidEffect || !isHovered) return 'none';
    return 'translateY(-4px) scale(1.01)';
  };
  
  const cardStyle: CSSProperties = {
    backgroundColor: isLiquidTheme ? colors.glassBackground : colors.containerBackground,
    border: `1px solid ${colors.border}`,
    cursor: onClick ? 'pointer' : 'default',
    padding,
    backdropFilter: isLiquidTheme ? 'blur(20px)' : 'none',
    WebkitBackdropFilter: isLiquidTheme ? 'blur(20px)' : 'none',
    boxShadow: getBoxShadow(),
    transition: useLiquidEffect
      ? 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' // Elastic easing for liquid effect
      : 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
    transform: getTransform(),
    position: 'relative',
    overflow: 'hidden',
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => interactive && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`rounded-xl ${className}`}
      style={cardStyle}
    >
      {/* Subtle gradient overlay for depth */}
      {useLiquidEffect && isHovered && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(circle at center, rgba(${shadowRgb.r}, ${shadowRgb.g}, ${shadowRgb.b}, 0.05), transparent)`,
            pointerEvents: 'none',
            transition: 'opacity 0.4s ease',
          }}
        />
      )}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}

