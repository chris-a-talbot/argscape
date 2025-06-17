interface ClearProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ClearProgressModal({
  isOpen,
  onClose,
  onConfirm
}: ClearProgressModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-sp-dark-blue rounded-2xl p-8 max-w-lg w-full mx-4 border border-sp-pale-green/10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-sp-white mb-2">Clear Progress?</h3>
          <p className="text-sp-white/70">
            This will reset all your tutorial progress. This action cannot be undone.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="w-full px-6 py-3 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
          >
            Clear All Progress
          </button>
          <button
            onClick={onClose}
            className="w-full px-6 py-3 rounded-lg bg-sp-dark-blue hover:bg-sp-dark-blue/80 text-sp-white/70 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
} 