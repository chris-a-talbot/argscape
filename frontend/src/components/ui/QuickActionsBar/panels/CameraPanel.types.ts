/**
 * CameraPanel Types
 *
 * Type definitions for the CameraPanel component.
 * Provides camera control functionality for 3D visualizers.
 */

export interface CameraPreset {
  id: string;
  label: string;
  rotationX: number;
  rotationOrbit: number;
  shortcut?: string;
}

export interface CameraPanelProps {
  // Current camera state (read-only display)
  currentRotationX?: number;
  currentRotationOrbit?: number;
  currentZoom?: number;

  // Preset controls
  onPresetSelect?: (preset: CameraPreset) => void;
  onCenterView?: () => void;

  // Auto-rotation
  autoRotationEnabled?: boolean;
  onAutoRotationEnabledChange?: (enabled: boolean) => void;
  autoRotationRate?: number;
  onAutoRotationRateChange?: (rate: number) => void;

  className?: string;
}

export const CAMERA_PRESETS: CameraPreset[] = [
  { id: 'front', label: 'Front', rotationX: 0, rotationOrbit: 0, shortcut: '1' },
  { id: 'top', label: 'Top', rotationX: 90, rotationOrbit: 0, shortcut: '2' },
  { id: 'right', label: 'Right', rotationX: 0, rotationOrbit: 90, shortcut: '3' },
  { id: 'iso', label: 'Iso', rotationX: 30, rotationOrbit: 45, shortcut: '4' },
];
