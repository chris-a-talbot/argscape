/**
 * Color utilities for population-based node coloring.
 * Ported from frontend/src/utils/colorUtils.ts for standalone viz module.
 */

/**
 * Convert HSL to RGB
 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = h / 360
  s = s / 100
  l = l / 100

  let r, g, b

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

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
  const colors = new Map<number, [number, number, number]>()

  if (populationIds.length === 0) return colors

  // Use golden ratio for better color distribution
  const goldenRatio = 0.618033988749895

  // Adjust saturation and lightness based on theme
  const baseSaturation = isDarkTheme ? 65 : 70
  const baseLightness = isDarkTheme ? 55 : 50

  // Generate colors using index for hue distribution, but map to actual population IDs
  populationIds.forEach((popId, index) => {
    // Distribute hues evenly using golden ratio for better visual separation
    const hue = (index * goldenRatio * 360) % 360

    // Vary saturation slightly for additional distinction
    const saturation = baseSaturation + ((index % 3) - 1) * 5

    // Convert HSL to RGB
    const rgb = hslToRgb(hue, saturation, baseLightness)
    colors.set(popId, rgb)
  })

  return colors
}

/**
 * Convert RGB to hex color string
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

/**
 * Get unique population IDs from nodes, sorted for consistent coloring
 */
export function getUniquePopulations(nodes: { population: number | null }[]): number[] {
  const populations = new Set<number>()
  for (const node of nodes) {
    if (node.population !== null && node.population !== undefined) {
      populations.add(node.population)
    }
  }
  return Array.from(populations).sort((a, b) => a - b)
}
