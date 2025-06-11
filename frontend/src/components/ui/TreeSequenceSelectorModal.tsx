import { useColorTheme } from '../../context/ColorThemeContext';
import TreeSequenceSelector from '../TreeSequenceSelector';

interface TreeSequenceSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (treeSequence: any) => void;
}

export function TreeSequenceSelectorModal({ isOpen, onClose, onSelect }: TreeSequenceSelectorModalProps) {
    const { colors } = useColorTheme();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 transition-opacity" 
                style={{ backgroundColor: `${colors.background}CC` }}
                onClick={onClose}
            />

            {/* Modal panel */}
            <div className="flex items-start justify-center min-h-screen pt-16 px-4">
                <div 
                    className="relative rounded-xl shadow-xl max-w-3xl w-full p-6 border"
                    style={{ 
                        backgroundColor: colors.background,
                        borderColor: colors.border
                    }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-medium" style={{ color: colors.text }}>
                            Switch Tree Sequence
                        </h2>
                        <button
                            className="rounded-lg p-2 transition-colors"
                            style={{ color: colors.text }}
                            onClick={onClose}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = `${colors.containerBackground}CC`;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Content */}
                    <TreeSequenceSelector onSelect={onSelect} />
                </div>
            </div>
        </div>
    );
} 