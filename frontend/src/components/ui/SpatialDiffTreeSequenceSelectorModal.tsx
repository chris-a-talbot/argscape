import { useThemeStyles } from '../../hooks/useThemeStyles';
import { useSemanticColors } from '../../hooks/useSemanticColors';
import SpatialDiffTreeSequenceSelector from './SpatialDiffTreeSequenceSelector';

interface SpatialDiffTreeSequenceSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (treeSequence: any) => void;
}

export function SpatialDiffTreeSequenceSelectorModal({ isOpen, onClose, onSelect }: SpatialDiffTreeSequenceSelectorModalProps) {
  const { colors, modalGlassStyle, modalOverlayStyle } = useThemeStyles();
  const semanticColors = useSemanticColors();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10002] overflow-y-auto">
      {/* Backdrop with consistent blur */}
      <div
        className="fixed inset-0 transition-opacity"
        style={modalOverlayStyle}
        onClick={onClose}
      />

      {/* Modal panel with proper glass treatment */}
      <div className="flex items-start justify-center min-h-screen pt-8 pb-8 px-4">
        <div
          className="relative max-w-5xl w-full min-h-[70vh] max-h-[90vh] overflow-hidden flex flex-col z-[10003]"
          style={modalGlassStyle}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: colors.border }}>
            <div>
              <h2 className="text-xl font-semibold" style={{ color: colors.text }}>
                Select Tree Sequence for Spatial Comparison
              </h2>
              <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                Choose a tree sequence with identical structure to compare spatial coordinates
              </p>
            </div>
            <button
              className="rounded-lg p-2 transition-all duration-200"
              style={{ color: colors.textSecondary }}
              onClick={onClose}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = semanticColors.hoverOverlay;
                e.currentTarget.style.color = colors.text;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.textSecondary;
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <SpatialDiffTreeSequenceSelector onSelect={onSelect} className="h-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

