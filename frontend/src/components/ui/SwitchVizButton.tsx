import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useColorTheme } from '../../context/ColorThemeContext';
import ConfirmModal from './ConfirmModal';

interface SwitchVizButtonProps {
  /** Current visualization type ('2d' or '3d') */
  currentViz: '2d' | '3d';
  /** Current filename */
  filename: string;
  /** Current URL search params */
  currentParams?: string;
  /** Whether the tree sequence has spatial data (for 2D -> 3D check) */
  hasSpatialData?: boolean;
  /** Whether tree sequence data is loaded */
  hasTreeSequence?: boolean;
}

export function SwitchVizButton({
  currentViz,
  filename,
  currentParams,
  hasSpatialData = false,
  hasTreeSequence = false
}: SwitchVizButtonProps) {
  const { colors } = useColorTheme();
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);

  // For 2D, only show if we have tree sequence data and it has spatial data
  if (currentViz === '2d' && hasTreeSequence && !hasSpatialData) {
    return null;
  }

  const targetViz = currentViz === '2d' ? '3D' : '2D';
  const targetRoute = currentViz === '2d' ? 'spatial' : 'graph';

  const handleSwitch = () => {
    const encodedFilename = encodeURIComponent(filename);
    const params = currentParams ? `?${currentParams}` : '';
    navigate(`/${targetRoute}/${encodedFilename}${params}`);
    setShowConfirm(false);
  };

  const getIcon = () => {
    if (currentViz === '2d') {
      // 3D cube icon for switching to 3D
      return (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      );
    } else {
      // 2D grid icon for switching to 2D
      return (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      );
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors flex-shrink-0 border"
        style={{
          backgroundColor: colors.containerBackground,
          color: colors.text,
          borderColor: `${colors.accentPrimary}33`
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = colors.accentPrimary;
          e.currentTarget.style.color = colors.background;
          e.currentTarget.style.borderColor = colors.accentPrimary;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = colors.containerBackground;
          e.currentTarget.style.color = colors.text;
          e.currentTarget.style.borderColor = `${colors.accentPrimary}33`;
        }}
        title={`Switch to ${targetViz} visualization`}
      >
        {getIcon()}
        <span>Switch to {targetViz}</span>
      </button>

      <ConfirmModal
        isOpen={showConfirm}
        title={`Switch to ${targetViz} Visualization`}
        message={`Are you sure you want to switch to the ${targetViz} visualization? This will navigate away from the current view.`}
        confirmText={`Switch to ${targetViz}`}
        cancelText="Cancel"
        onConfirm={handleSwitch}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}