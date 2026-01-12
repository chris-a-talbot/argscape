/**
 * EdgesPanel Type Definitions
 *
 * Defines TypeScript interfaces for the Edges tab panel,
 * which consolidates all edge-related settings:
 * - Appearance (width, opacity)
 * - Labels (show edge labels, font size)
 */

/**
 * Edge label settings
 */
export interface EdgeLabelSettings {
  showEdgeLabels: boolean;
  labelFontSize: number;
}

/**
 * Props for EdgesPanel component
 */
export interface EdgesPanelProps {
  // Edge appearance
  edgeThickness?: number;
  onEdgeThicknessChange?: (thickness: number) => void;
  edgeThicknessMin?: number;
  edgeThicknessMax?: number;

  edgeOpacity?: number;
  onEdgeOpacityChange?: (opacity: number) => void;

  // Edge labels
  showEdgeLabels?: boolean;
  onShowEdgeLabelsChange?: (show: boolean) => void;
  edgeLabelFontSize?: number;
  onEdgeLabelFontSizeChange?: (size: number) => void;

  // Optional className
  className?: string;
}
