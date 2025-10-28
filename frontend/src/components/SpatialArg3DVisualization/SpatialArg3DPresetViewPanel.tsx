import React, { useState, useRef } from 'react';
import { useColorTheme } from '../../context/ColorThemeContext';
import { useDraggable } from '../../hooks/useDraggable';

interface ViewState {
  target: [number, number, number];
  zoom: number;
  rotationX: number;
  rotationOrbit: number;
  orbitAxis: 'Y';
}

interface SpatialArg3DPresetViewPanelProps {
  currentViewState: ViewState;
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number;
    maxZ: number;
  } | null;
  onViewStateChange: (viewState: Partial<ViewState>) => void;
  autoRotationEnabled: boolean;
  autoRotationRate: number;
  onAutoRotationEnabledChange: (enabled: boolean) => void;
  onAutoRotationRateChange: (rate: number) => void;
  layerRevealEnabled: boolean;
  layerRevealPlaying: boolean;
  layerRevealRate: number;
  onLayerRevealStart: () => void;
  onLayerRevealPause: () => void;
  onLayerRevealResume: () => void;
  onLayerRevealCancel: () => void;
  onLayerRevealRateChange: (rate: number) => void;
}

// Zoom level constants
const ZOOM_LEVELS = {
  FIT: 1.8,      // Just fits all elements
  MEDIUM: 1.2,   // Bit more zoomed out
  FAR: 0.8       // Even more zoomed out
};

export const SpatialArg3DPresetViewPanel: React.FC<SpatialArg3DPresetViewPanelProps> = ({
  currentViewState,
  bounds,
  onViewStateChange,
  autoRotationEnabled,
  autoRotationRate,
  onAutoRotationEnabledChange,
  onAutoRotationRateChange,
  layerRevealEnabled,
  layerRevealPlaying,
  layerRevealRate,
  onLayerRevealStart,
  onLayerRevealPause,
  onLayerRevealResume,
  onLayerRevealCancel,
  onLayerRevealRateChange
}) => {
  const { colors } = useColorTheme();
  const [isExpanded, setIsExpanded] = useState(true);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  const { elementRef, dragProps, hasMoved, isRepositioned } = useDraggable({
    initialPosition: { x: 0, y: 0 },
    dragHandleRef: dragHandleRef as React.RefObject<HTMLElement>
  });

  // Calculate center point for proper targeting
  const getCenterTarget = (): [number, number, number] => {
    if (!bounds) return [0, 0, 0];
    
    return [
      (bounds.minX + bounds.maxX) / 2,
      (bounds.minY + bounds.maxY) / 2,
      (bounds.minZ + bounds.maxZ) / 2
    ];
  };

  // Apply preset view with smooth transitions
  const applyPresetView = (rotationOrbit: number, rotationX: number, zoom: number) => {
    const centerTarget = getCenterTarget();
    
    onViewStateChange({
      target: centerTarget,
      rotationOrbit,
      rotationX,
      zoom
    });
  };

  // Center the ARG without changing rotation or zoom
  const centerARG = () => {
    const centerTarget = getCenterTarget();
    
    onViewStateChange({
      target: centerTarget
    });
  };

  // Zoom level options
  const zoomOptions = [
    { value: ZOOM_LEVELS.FIT, label: 'Fit All', icon: '🔍' },
    { value: ZOOM_LEVELS.MEDIUM, label: 'Medium', icon: '👁️' },
    { value: ZOOM_LEVELS.FAR, label: 'Far', icon: '🌐' }
  ];

  // Handle rotation slider change
  const handleRotationChange = (value: number) => {
    const normalizedValue = value % 360; // Keep within 0-360 range
    applyPresetView(normalizedValue, currentViewState.rotationX, currentViewState.zoom);
  };

  // Handle angle slider change  
  const handleAngleChange = (value: number) => {
    const clampedValue = Math.max(0, Math.min(90, value)); // Keep within 0-90 range
    applyPresetView(currentViewState.rotationOrbit, clampedValue, currentViewState.zoom);
  };

  return (
    <div 
      ref={elementRef as React.RefObject<HTMLDivElement>}
      className={`border rounded-lg shadow-lg z-20 ${
        isRepositioned ? '' : 'absolute'
      }`}
      style={{ 
        backgroundColor: `${colors.background}F0`, // 94% opacity
        borderColor: colors.border,
        color: colors.text,
        ...(isRepositioned ? {} : {
          top: 16,
          right: 300 // Reduced offset since info panel is now narrower
        }),
        ...dragProps.style
      }}
      onMouseDown={dragProps.onMouseDown}
    >
      {/* Control Panel Header */}
      <div 
        ref={dragHandleRef}
        onClick={() => !hasMoved && setIsExpanded(!isExpanded)}
        className="flex items-center justify-between p-4 cursor-pointer rounded-t-lg transition-colors"
        style={{
          backgroundColor: isExpanded ? 'transparent' : `${colors.containerBackground}80`
        }}
        onMouseEnter={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.backgroundColor = `${colors.border}40`;
          }
        }}
        onMouseLeave={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.backgroundColor = `${colors.containerBackground}80`;
          }
        }}
      >
        <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: colors.text }}>
          <svg className="w-3 h-3 opacity-50" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 6h8v2H8V6zm0 4h8v2H8v-2zm0 4h8v2H8v-2z"/>
          </svg>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Preset Views
        </h3>
        <svg 
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          style={{ color: colors.accentPrimary }}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Control Panel Content */}
      {isExpanded && (
        <div className="p-4 pt-0 space-y-4 max-h-96 overflow-y-auto">
          {/* Center ARG Button */}
          <div className="space-y-2">
            <button
              onClick={centerARG}
              className="w-full px-2 py-1.5 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1"
              style={{
                backgroundColor: colors.accentPrimary,
                color: colors.background,
                border: `1px solid ${colors.accentPrimary}`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v18m0 0l-4-4m4 4l4-4" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18m0 0l-4-4m4 4l-4 4" />
              </svg>
              Center ARG
            </button>
          </div>

          {/* Rotation Control */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold" style={{ color: colors.text }}>Rotation</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-xs flex-shrink-0" style={{ color: colors.accentPrimary }}>
                  {Math.round(currentViewState.rotationOrbit)}°
                </label>
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={1}
                  value={currentViewState.rotationOrbit}
                  onChange={(e) => handleRotationChange(Number(e.target.value))}
                  className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${colors.accentPrimary} 0%, ${colors.accentPrimary} ${(currentViewState.rotationOrbit / 360) * 100}%, ${colors.border} ${(currentViewState.rotationOrbit / 360) * 100}%, ${colors.border} 100%)`,
                    accentColor: colors.accentPrimary
                  }}
                />
                <input
                  type="number"
                  min={0}
                  max={360}
                  value={Math.round(currentViewState.rotationOrbit)}
                  onChange={(e) => handleRotationChange(Number(e.target.value))}
                  className="w-12 px-1 py-0.5 text-xs border rounded"
                  style={{
                    color: colors.text,
                    backgroundColor: colors.containerBackground,
                    borderColor: colors.border
                  }}
                />
              </div>
            </div>
          </div>

          {/* View Angle Control */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold" style={{ color: colors.text }}>View Angle</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-xs flex-shrink-0" style={{ color: colors.accentPrimary }}>
                  {Math.round(currentViewState.rotationX)}°
                </label>
                <input
                  type="range"
                  min={0}
                  max={90}
                  step={1}
                  value={currentViewState.rotationX}
                  onChange={(e) => handleAngleChange(Number(e.target.value))}
                  className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${colors.accentPrimary} 0%, ${colors.accentPrimary} ${(currentViewState.rotationX / 90) * 100}%, ${colors.border} ${(currentViewState.rotationX / 90) * 100}%, ${colors.border} 100%)`,
                    accentColor: colors.accentPrimary
                  }}
                />
                <input
                  type="number"
                  min={0}
                  max={90}
                  value={Math.round(currentViewState.rotationX)}
                  onChange={(e) => handleAngleChange(Number(e.target.value))}
                  className="w-12 px-1 py-0.5 text-xs border rounded"
                  style={{
                    color: colors.text,
                    backgroundColor: colors.containerBackground,
                    borderColor: colors.border
                  }}
                />
              </div>
            </div>
          </div>

          {/* Zoom Control */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold" style={{ color: colors.text }}>Zoom Level</h4>
            <div className="space-y-2">
              {zoomOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => applyPresetView(currentViewState.rotationOrbit, currentViewState.rotationX, option.value)}
                  className="w-full px-3 py-2 text-xs font-medium rounded transition-colors flex items-center gap-2"
                  style={{
                    backgroundColor: Math.abs(currentViewState.zoom - option.value) < 0.1 
                      ? colors.accentPrimary 
                      : colors.containerBackground,
                    color: Math.abs(currentViewState.zoom - option.value) < 0.1 
                      ? colors.background 
                      : colors.text,
                    border: `1px solid ${colors.border}`
                  }}
                  title={`Set zoom to ${option.label}`}
                  onMouseEnter={(e) => {
                    if (Math.abs(currentViewState.zoom - option.value) >= 0.1) {
                      e.currentTarget.style.backgroundColor = colors.border;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (Math.abs(currentViewState.zoom - option.value) >= 0.1) {
                      e.currentTarget.style.backgroundColor = colors.containerBackground;
                    }
                  }}
                >
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Auto-Rotation Control */}
          <div className="space-y-2 pt-2 border-t" style={{ borderTopColor: colors.border }}>
            <h4 className="text-sm font-bold" style={{ color: colors.text }}>Auto-Rotation</h4>
            
            {/* Toggle Button */}
            <button
              onClick={() => onAutoRotationEnabledChange(!autoRotationEnabled)}
              className={`w-full px-2 py-1.5 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1 ${
                autoRotationEnabled ? 'border-2' : 'border'
              }`}
              style={{
                backgroundColor: autoRotationEnabled ? colors.accentPrimary : colors.containerBackground,
                color: autoRotationEnabled ? colors.background : colors.text,
                borderColor: autoRotationEnabled ? colors.accentPrimary : colors.border
              }}
              onMouseEnter={(e) => {
                if (!autoRotationEnabled) {
                  e.currentTarget.style.backgroundColor = `${colors.border}40`;
                }
              }}
              onMouseLeave={(e) => {
                if (!autoRotationEnabled) {
                  e.currentTarget.style.backgroundColor = colors.containerBackground;
                }
              }}
            >
              <svg 
                className="w-3 h-3" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{
                  animation: autoRotationEnabled ? 'spin 2s linear infinite' : 'none'
                }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {autoRotationEnabled ? 'Disable Auto-Rotation' : 'Enable Auto-Rotation'}
            </button>

            {/* Rotation Rate Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold" style={{ color: colors.text }}>
                  Rotation Speed
                </label>
                <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ 
                  color: `${colors.text}CC`, 
                  backgroundColor: `${colors.containerBackground}80` 
                }}>
                  {autoRotationRate}°/s
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="60"
                step="1"
                value={autoRotationRate}
                onChange={(e) => onAutoRotationRateChange(Number(e.target.value))}
                disabled={!autoRotationEnabled}
                className="w-full h-1 rounded-lg cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${colors.accentPrimary} 0%, ${colors.accentPrimary} ${((autoRotationRate - 1) / 59) * 100}%, ${colors.border} ${((autoRotationRate - 1) / 59) * 100}%, ${colors.border} 100%)`,
                  accentColor: colors.accentPrimary,
                  opacity: autoRotationEnabled ? 1 : 0.5
                }}
              />
              <div className="flex justify-between text-xs" style={{ color: `${colors.text}99` }}>
                <span>Slow</span>
                <span>Fast</span>
              </div>
            </div>
          </div>

          {/* Layer-by-Layer Reveal Control */}
          <div className="space-y-2 pt-2 border-t" style={{ borderTopColor: colors.border }}>
            <h4 className="text-sm font-bold" style={{ color: colors.text }}>Layer Reveal</h4>
            
            {/* Reveal Rate Slider - Always visible */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold" style={{ color: colors.text }}>
                  Reveal Speed
                </label>
                <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ 
                  color: `${colors.text}CC`, 
                  backgroundColor: `${colors.containerBackground}80` 
                }}>
                  {layerRevealRate.toFixed(1)} layers/s
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={layerRevealRate}
                onChange={(e) => onLayerRevealRateChange(Number(e.target.value))}
                disabled={layerRevealPlaying}
                className="w-full h-1 rounded-lg cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${colors.accentPrimary} 0%, ${colors.accentPrimary} ${((layerRevealRate - 0.1) / 9.9) * 100}%, ${colors.border} ${((layerRevealRate - 0.1) / 9.9) * 100}%, ${colors.border} 100%)`,
                  accentColor: colors.accentPrimary,
                  opacity: layerRevealPlaying ? 1 : 1
                }}
              />
              <div className="flex justify-between text-xs" style={{ color: `${colors.text}99` }}>
                <span>Slow</span>
                <span>Fast</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="grid grid-cols-3 gap-1">
              {!layerRevealEnabled ? (
                <button
                  onClick={onLayerRevealStart}
                  className="col-span-3 px-2 py-1.5 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1"
                  style={{
                    backgroundColor: colors.accentPrimary,
                    color: colors.background
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Start Reveal
                </button>
              ) : (
                <>
                  {layerRevealPlaying ? (
                    <button
                      onClick={onLayerRevealPause}
                      className="px-2 py-1.5 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1"
                      style={{
                        backgroundColor: colors.accentPrimary,
                        color: colors.background
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Pause
                    </button>
                  ) : (
                    <button
                      onClick={onLayerRevealResume}
                      className="px-2 py-1.5 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1"
                      style={{
                        backgroundColor: colors.accentPrimary,
                        color: colors.background
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Resume
                    </button>
                  )}
                  <button
                    onClick={onLayerRevealCancel}
                    className="px-2 py-1.5 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1 col-span-2"
                    style={{
                      backgroundColor: colors.containerBackground,
                      color: colors.text,
                      border: `1px solid ${colors.border}`
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${colors.border}40`}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.containerBackground}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Current View State Display */}
          <div className="space-y-2 pt-2 border-t" style={{ borderTopColor: colors.border }}>
            <h4 className="text-sm font-bold" style={{ color: colors.text }}>Current View</h4>
            <div className="text-xs space-y-1" style={{ color: colors.textSecondary }}>
              <div>Rotation: {Math.round(currentViewState.rotationOrbit)}°</div>
              <div>Pan: {Math.round(Math.abs(currentViewState.rotationX))}° {currentViewState.rotationX < 0 ? 'above' : currentViewState.rotationX > 0 ? 'below' : 'level'}</div>
              <div>Zoom: {currentViewState.zoom.toFixed(2)}x</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 