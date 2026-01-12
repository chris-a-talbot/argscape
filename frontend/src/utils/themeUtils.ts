/**
 * Theme utility functions for color manipulation and detection.
 * These utilities help with theme-aware color operations and accessibility checks.
 */

/**
 * Determine if a color is light or dark based on luminance.
 * Uses the relative luminance formula from WCAG guidelines.
 * 
 * @param color - Hex color string (e.g., "#ffffff" or "#fff")
 * @returns true if light (luminance > 0.5), false if dark
 * 
 * @example
 * isLightColor('#ffffff') // true
 * isLightColor('#000000') // false
 * isLightColor('#14E2A8') // true
 */
export function isLightColor(color: string): boolean {
  const hex = color.replace('#', '');
  
  // Handle 3-digit hex codes
  const fullHex = hex.length === 3
    ? hex.split('').map(char => char + char).join('')
    : hex;
  
  const r = parseInt(fullHex.substr(0, 2), 16);
  const g = parseInt(fullHex.substr(2, 2), 16);
  const b = parseInt(fullHex.substr(4, 2), 16);
  
  // Calculate relative luminance (0-1 scale)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5;
}

/**
 * Convert hex color to rgba string with specified alpha.
 * 
 * @param hex - Hex color string (e.g., "#ffffff" or "#fff")
 * @param alpha - Alpha value between 0 and 1 (default: 1)
 * @returns rgba string (e.g., "rgba(255, 255, 255, 1)")
 * 
 * @example
 * hexToRgba('#14E2A8', 0.5) // "rgba(20, 226, 168, 0.5)"
 * hexToRgba('#fff') // "rgba(255, 255, 255, 1)"
 */
export function hexToRgba(hex: string, alpha: number = 1): string {
  const cleanHex = hex.replace('#', '');
  
  // Handle 3-digit hex codes
  const fullHex = cleanHex.length === 3
    ? cleanHex.split('').map(char => char + char).join('')
    : cleanHex;
  
  const r = parseInt(fullHex.substr(0, 2), 16);
  const g = parseInt(fullHex.substr(2, 2), 16);
  const b = parseInt(fullHex.substr(4, 2), 16);
  
  // Clamp alpha between 0 and 1
  const clampedAlpha = Math.max(0, Math.min(1, alpha));
  
  return `rgba(${r}, ${g}, ${b}, ${clampedAlpha})`;
}

/**
 * Lighten or darken a color by a percentage.
 * Positive percentages lighten, negative percentages darken.
 * 
 * @param color - Hex color string (e.g., "#ffffff")
 * @param percent - Percentage to adjust (-100 to 100)
 *                  Positive = lighter, Negative = darker
 * @returns Modified hex color
 * 
 * @example
 * adjustColor('#14E2A8', 20)  // Lighter green
 * adjustColor('#14E2A8', -20) // Darker green
 */
export function adjustColor(color: string, percent: number): string {
  const hex = color.replace('#', '');
  
  // Handle 3-digit hex codes
  const fullHex = hex.length === 3
    ? hex.split('').map(char => char + char).join('')
    : hex;
  
  const r = parseInt(fullHex.substr(0, 2), 16);
  const g = parseInt(fullHex.substr(2, 2), 16);
  const b = parseInt(fullHex.substr(4, 2), 16);
  
  // Adjust function: lighten by moving toward 255, darken by moving toward 0
  const adjust = (value: number, pct: number): number => {
    if (pct >= 0) {
      // Lighten: move toward 255
      const adjusted = Math.round(value + (255 - value) * (pct / 100));
      return Math.max(0, Math.min(255, adjusted));
    } else {
      // Darken: move toward 0
      const adjusted = Math.round(value * (1 + pct / 100));
      return Math.max(0, Math.min(255, adjusted));
    }
  };
  
  const newR = adjust(r, percent).toString(16).padStart(2, '0');
  const newG = adjust(g, percent).toString(16).padStart(2, '0');
  const newB = adjust(b, percent).toString(16).padStart(2, '0');
  
  return `#${newR}${newG}${newB}`;
}

/**
 * Calculate luminance value for a color (0-1 scale).
 * Used internally and exposed for advanced use cases.
 * 
 * @param color - Hex color string
 * @returns Luminance value between 0 (darkest) and 1 (lightest)
 * 
 * @example
 * getLuminance('#ffffff') // 1
 * getLuminance('#000000') // 0
 * getLuminance('#14E2A8') // ~0.73
 */
export function getLuminance(color: string): number {
  const hex = color.replace('#', '');
  
  // Handle 3-digit hex codes
  const fullHex = hex.length === 3
    ? hex.split('').map(char => char + char).join('')
    : hex;
  
  const r = parseInt(fullHex.substr(0, 2), 16);
  const g = parseInt(fullHex.substr(2, 2), 16);
  const b = parseInt(fullHex.substr(4, 2), 16);
  
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/**
 * Check if a color string is valid hex format.
 * 
 * @param color - String to validate
 * @returns true if valid hex color
 * 
 * @example
 * isValidHex('#ffffff') // true
 * isValidHex('#fff')    // true
 * isValidHex('ffffff')  // true
 * isValidHex('#gggggg') // false
 */
export function isValidHex(color: string): boolean {
  const hex = color.replace('#', '');
  return /^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(hex);
}

