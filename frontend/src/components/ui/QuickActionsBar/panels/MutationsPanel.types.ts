/**
 * MutationsPanel Type Definitions
 *
 * Defines TypeScript interfaces for the Mutations tab panel,
 * which consolidates all mutation-related settings:
 * - Appearance (marker size)
 * - Labels (show mutation labels)
 */

/**
 * Props for MutationsPanel component
 */
export interface MutationsPanelProps {
  // Show mutation markers
  showMutationMarkers?: boolean;
  onShowMutationMarkersChange?: (show: boolean) => void;

  // Mutation marker size
  mutationMarkerSize?: number;
  onMutationMarkerSizeChange?: (size: number) => void;

  // Optional className
  className?: string;
}
