import { useThemeStyles } from '../../hooks/useThemeStyles';
import { useSemanticColors } from '../../hooks/useSemanticColors';
import TreeSequenceSelector from '../home/TreeSequenceSelector';

interface TreeSequenceSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (treeSequence: any) => void;
}

export function TreeSequenceSelectorModal({ isOpen, onClose, onSelect }: TreeSequenceSelectorModalProps) {
    const { colors, modalGlassStyle, modalOverlayStyle } = useThemeStyles();
    const semanticColors = useSemanticColors();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] overflow-y-auto">
            {/* Backdrop with consistent blur */}
            <div 
                className="fixed inset-0 transition-opacity" 
                style={modalOverlayStyle}
                onClick={onClose}
            />

            {/* Modal panel with proper glass treatment */}
            <div className="flex items-start justify-center min-h-screen pt-8 pb-8 px-4">
                <div 
                    className="relative max-w-5xl w-full min-h-[70vh] max-h-[90vh] overflow-hidden flex flex-col z-[10001]"
                    style={modalGlassStyle}
                >
                    {/* Close button */}
                    <button
                        className="absolute top-4 right-4 rounded-lg p-2 transition-all duration-200 z-10"
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

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <TreeSequenceSelector onSelect={onSelect} className="h-full" />
                    </div>
                </div>
            </div>
        </div>
    );
} 