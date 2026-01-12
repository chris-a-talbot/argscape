import { CSSProperties } from 'react';
import { useColorTheme, ColorScheme } from '../context/ColorThemeContext';
import { useUIPreferences } from '../context/UIPreferencesContext';

/**
 * Extract RGB values from an rgba string for shadow manipulation
 * @param rgba - rgba string like "rgba(20, 226, 168, 0.12)"
 * @returns RGB object or null if parsing fails
 */
function extractRgbFromRgba(rgba: string): { r: number; g: number; b: number } | null {
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
  }
  return null;
}

/**
 * Build a box-shadow string using theme colors
 */
function buildGlassShadow(
  colors: ColorScheme,
  variant: 'primary' | 'subtle' | 'elevated' | 'dropdown' | 'tooltip',
  enhanced: boolean = false
): string {
  const rgb = extractRgbFromRgba(colors.glassShadowPrimary);
  const rgb2 = extractRgbFromRgba(colors.glassShadowSecondary);

  // Fallback if parsing fails
  const r = rgb?.r ?? 20;
  const g = rgb?.g ?? 226;
  const b = rgb?.b ?? 168;
  const r2 = rgb2?.r ?? r;
  const g2 = rgb2?.g ?? g;
  const b2 = rgb2?.b ?? b;

  switch (variant) {
    case 'primary':
      return enhanced
        ? `0 12px 40px rgba(${r}, ${g}, ${b}, 0.16), 0 4px 12px rgba(0, 0, 0, 0.06)`
        : `0 8px 32px rgba(${r}, ${g}, ${b}, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04)`;
    case 'subtle':
      return enhanced
        ? `0 6px 24px rgba(${r}, ${g}, ${b}, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04)`
        : `0 4px 16px rgba(${r}, ${g}, ${b}, 0.08), 0 1px 4px rgba(0, 0, 0, 0.03)`;
    case 'elevated':
      return `0 16px 64px rgba(${r}, ${g}, ${b}, 0.16), 0 4px 16px rgba(0, 0, 0, 0.06)`;
    case 'dropdown':
      return enhanced
        ? `0 12px 40px rgba(${r}, ${g}, ${b}, 0.18), 0 4px 12px rgba(0, 0, 0, 0.06)`
        : `0 8px 32px rgba(${r}, ${g}, ${b}, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04)`;
    case 'tooltip':
      return enhanced
        ? `0 6px 18px rgba(${r2}, ${g2}, ${b2}, 0.2), 0 3px 8px rgba(0, 0, 0, 0.08)`
        : `0 4px 12px rgba(${r2}, ${g2}, ${b2}, 0.15), 0 2px 4px rgba(0, 0, 0, 0.05)`;
    default:
      return 'none';
  }
}

/**
 * Comprehensive theme styles hook following Liquid Glass Style Guide
 * Implements proper glass hierarchy, shadows, and elevation system
 */
export function useThemeStyles() {
  const { theme, colors } = useColorTheme();
  const { liquidEffectsEnabled } = useUIPreferences();
  const isLiquid = theme === 'liquid';
  const useLiquidEffects = isLiquid && liquidEffectsEnabled;

  // Page background
  const pageStyle: CSSProperties = {
    backgroundColor: colors.background,
    color: colors.text,
    minHeight: '100vh',
  };

  // Standard container (no special glass treatment)
  const containerStyle: CSSProperties = {
    backgroundColor: colors.containerBackground,
    borderColor: colors.border,
    color: colors.text,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: '1rem',
  };
  
  /**
   * Primary Glass Panel (80% opacity, 20px blur, strong shadow)
   * Use for: Main content areas, top-level cards, primary containers
   */
  const glassPanelStyle: CSSProperties = {
    backgroundColor: isLiquid ? colors.glassBackground : colors.containerBackground,
    borderColor: colors.border,
    color: colors.text,
    backdropFilter: isLiquid ? 'blur(20px)' : 'none',
    WebkitBackdropFilter: isLiquid ? 'blur(20px)' : 'none',
    boxShadow: isLiquid
      ? buildGlassShadow(colors, 'primary', useLiquidEffects)
      : 'none',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: '1rem',
    transition: useLiquidEffects ? 'box-shadow 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
  };

  /**
   * Subtle Glass Panel (60% opacity, 16px blur, medium shadow)
   * Use for: Nested cards, secondary information displays, sidebar sections
   */
  const subtleGlassPanelStyle: CSSProperties = {
    // Use glassShimmer for a subtler glass effect (60% vs 80%)
    backgroundColor: isLiquid ? colors.glassShimmer : colors.containerBackground,
    borderColor: colors.border,
    color: colors.text,
    backdropFilter: isLiquid ? 'blur(16px)' : 'none',
    WebkitBackdropFilter: isLiquid ? 'blur(16px)' : 'none',
    boxShadow: isLiquid
      ? buildGlassShadow(colors, 'subtle', useLiquidEffects)
      : 'none',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: '0.75rem', // Slightly smaller radius for nested elements
    transition: useLiquidEffects ? 'box-shadow 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
  };

  /**
   * Modal Glass Style (95% opacity, 24px blur, elevated shadow)
   * Use for: Modals, tooltips, popovers requiring high readability
   */
  const modalGlassStyle: CSSProperties = {
    // Modal uses near-opaque background - derive from glassBackground with higher opacity
    backgroundColor: isLiquid ? 'rgba(255, 255, 255, 0.95)' : colors.containerBackground,
    borderColor: isLiquid ? colors.glassBorder : colors.border,
    color: colors.text,
    backdropFilter: isLiquid ? 'blur(24px)' : 'none',
    WebkitBackdropFilter: isLiquid ? 'blur(24px)' : 'none',
    boxShadow: isLiquid
      ? buildGlassShadow(colors, 'elevated', useLiquidEffects)
      : 'none',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: '1rem',
  };

  /**
   * Modal Overlay/Backdrop Style
   * Consistent blurred backdrop for all modals
   */
  const modalOverlayStyle: CSSProperties = {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: isLiquid ? 'blur(4px)' : 'none',
    WebkitBackdropFilter: isLiquid ? 'blur(4px)' : 'none',
  };

  /**
   * Navbar with appropriate transparency
   */
  const navStyle: CSSProperties = {
    // Nav uses theme's glass background, or semi-transparent version of background for non-liquid
    backgroundColor: isLiquid
      ? colors.glassBackground
      : (theme === 'tskit' ? colors.glassBackground : colors.background),
    borderBottomColor: colors.border,
    backdropFilter: isLiquid ? 'blur(20px)' : 'blur(12px)',
    WebkitBackdropFilter: isLiquid ? 'blur(20px)' : 'blur(12px)',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    color: colors.headerText,
    transition: 'background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease',
  };

  /**
   * Primary Button Style
   * Use for: Main actions (Save, Submit, Visualize, Run Simulation)
   */
  const primaryButtonStyle: CSSProperties = {
    backgroundColor: colors.accentPrimary,
    color: colors.buttonText,
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    fontWeight: 500,
    fontSize: '1rem',
    border: 'none',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
    transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
    cursor: 'pointer',
  };

  /**
   * Secondary Button Style  
   * Use for: Secondary actions (Cancel, Back, View Details)
   */
  const secondaryButtonStyle: CSSProperties = {
    backgroundColor: 'transparent',
    color: colors.text,
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    fontWeight: 500,
    fontSize: '1rem',
    border: `1px solid ${colors.border}`,
    transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
    cursor: 'pointer',
  };

  /**
   * Icon Button Style
   * Use for: Settings, help icons, close buttons
   */
  const iconButtonStyle: CSSProperties = {
    backgroundColor: 'transparent',
    color: colors.textSecondary,
    padding: '0.5rem',
    borderRadius: '0.5rem',
    border: 'none',
    transition: 'all 0.15s cubic-bezier(0.4, 0.0, 0.2, 1)',
    cursor: 'pointer',
  };

  /**
   * Dropdown/Menu Style (90% opacity, 20px blur, medium shadow)
   * Use for: Dropdowns, context menus, popovers that overlay content
   * Critical: Must have blur to be readable over background text
   */
  const dropdownMenuStyle: CSSProperties = {
    // Dropdowns use slightly more opaque glass for readability
    backgroundColor: isLiquid ? 'rgba(255, 255, 255, 0.9)' : colors.containerBackground,
    borderColor: colors.border,
    color: colors.text,
    backdropFilter: isLiquid ? 'blur(20px)' : 'none',
    WebkitBackdropFilter: isLiquid ? 'blur(20px)' : 'none',
    boxShadow: isLiquid
      ? buildGlassShadow(colors, 'dropdown', useLiquidEffects)
      : '0 4px 12px rgba(0, 0, 0, 0.1)',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: '0.75rem', // 12px
    transition: useLiquidEffects ? 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'all 0.2s ease',
  };

  /**
   * Tooltip Style (95% opacity, 12px blur, light shadow)
   * Use for: Tooltips, small informational overlays
   */
  const tooltipStyle: CSSProperties = {
    backgroundColor: isLiquid ? 'rgba(255, 255, 255, 0.95)' : colors.tooltipBackground,
    borderColor: isLiquid ? colors.glassBorder : colors.border,
    color: isLiquid ? colors.text : colors.tooltipText,
    backdropFilter: isLiquid ? 'blur(12px)' : 'none',
    WebkitBackdropFilter: isLiquid ? 'blur(12px)' : 'none',
    boxShadow: isLiquid
      ? buildGlassShadow(colors, 'tooltip', useLiquidEffects)
      : '0 2px 8px rgba(0, 0, 0, 0.15)',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: '0.5rem', // 8px
    transition: useLiquidEffects ? 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
  };

  // Text color helpers
  const textSecondaryStyle: CSSProperties = {
    color: colors.textSecondary,
  };

  const accentTextStyle: CSSProperties = {
    color: colors.accentPrimary,
  };

  // Utility to build glass shadows with theme colors (for custom components)
  const getGlassShadow = (variant: 'primary' | 'subtle' | 'elevated' | 'dropdown' | 'tooltip') =>
    buildGlassShadow(colors, variant, useLiquidEffects);

  return {
    theme,
    isLiquid,
    useLiquidEffects,
    pageStyle,
    containerStyle,
    glassPanelStyle,
    subtleGlassPanelStyle,
    modalGlassStyle,
    modalOverlayStyle,
    navStyle,
    primaryButtonStyle,
    secondaryButtonStyle,
    iconButtonStyle,
    dropdownMenuStyle,
    tooltipStyle,
    textSecondaryStyle,
    accentTextStyle,
    colors,
    getGlassShadow,
  };
}

// Export utility for extracting RGB from rgba strings
export { extractRgbFromRgba };
