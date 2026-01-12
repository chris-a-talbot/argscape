import { useColorTheme } from '../context/ColorThemeContext';

/**
 * Hook providing semantic color values from the current theme.
 * Use for interactive UI states (success, error, warning, info, active, hover, focus).
 * 
 * @returns Object containing all semantic color properties
 * 
 * @example
 * ```tsx
 * const semanticColors = useSemanticColors();
 * 
 * <button style={{ 
 *   backgroundColor: semanticColors.success,
 *   ':hover': { backgroundColor: semanticColors.successHover }
 * }}>
 *   Save
 * </button>
 * ```
 */
export function useSemanticColors() {
  const { colors } = useColorTheme();
  
  return {
    // Success colors - for confirmations, success states, checkmarks
    success: colors.success,
    successHover: colors.successHover,
    
    // Warning colors - for caution states, warnings, alerts
    warning: colors.warning,
    warningHover: colors.warningHover,
    
    // Error colors - for errors, destructive actions, delete buttons
    error: colors.error,
    errorHover: colors.errorHover,
    
    // Info colors - for information states, help indicators
    info: colors.info,
    infoHover: colors.infoHover,
    
    // Interactive states - for navigation, selections, focus
    activeHighlight: colors.activeHighlight,
    hoverOverlay: colors.hoverOverlay,
    focusRing: colors.focusRing,
  };
}

