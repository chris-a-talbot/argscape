export const formatCoordinates = (x: number, y: number, isGeographic?: boolean): string => {
  if (isGeographic) {
    return `Lat: ${y.toFixed(3)}°, Lon: ${x.toFixed(3)}°`;
  }
  return `(${x.toFixed(2)}, ${y.toFixed(2)})`;
};

export const formatGenomicPosition = (value: number): string => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toString();
};

/**
 * Generate distinct colors for populations using HSL color space
 * @param populationIds Array of population IDs to generate colors for
 * @param isDarkTheme Whether the current theme is dark
 * @returns Map from population ID to RGB color array
 */
export function generatePopulationColors(
  populationIds: number[],
  isDarkTheme: boolean = false
): Map<number, [number, number, number]> {
  const colors = new Map<number, [number, number, number]>();
  
  if (populationIds.length === 0) return colors;
  
  // Use golden ratio for better color distribution
  const goldenRatio = 0.618033988749895;
  
  // Adjust saturation and lightness based on theme
  const baseSaturation = isDarkTheme ? 65 : 70; // Slightly lower saturation for dark theme
  const baseLightness = isDarkTheme ? 55 : 50; // Lighter for dark theme, darker for light theme
  
  // Generate colors using index for hue distribution, but map to actual population IDs
  populationIds.forEach((popId, index) => {
    // Distribute hues evenly using golden ratio for better visual separation
    const hue = (index * goldenRatio * 360) % 360;
    
    // Vary saturation slightly for additional distinction
    const saturation = baseSaturation + ((index % 3) - 1) * 5;
    
    // Convert HSL to RGB
    const rgb = hslToRgb(hue, saturation, baseLightness);
    colors.set(popId, rgb); // Map the actual population ID to the color
  });
  
  return colors;
}

/**
 * Darken a color by reducing its lightness (for samples and roots)
 * @param rgb RGB color array
 * @param factor Darkening factor (0-1, where 1 is no darkening)
 * @returns Darkened RGB color array
 */
export function darkenColor(
  rgb: [number, number, number],
  factor: number = 0.7
): [number, number, number] {
  // Convert RGB to HSL
  const hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);
  
  // Reduce lightness
  const newLightness = hsl[2] * factor;
  
  // Convert back to RGB
  return hslToRgb(hsl[0], hsl[1], newLightness);
}

/**
 * Convert HSL to RGB
 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = h / 360;
  s = s / 100;
  l = l / 100;
  
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * Convert RGB to HSL
 */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r = r / 255;
  g = g / 255;
  b = b / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  
  return [h * 360, s * 100, l * 100];
}