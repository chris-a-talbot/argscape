import { useNavigate } from 'react-router-dom';

interface LessonCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  nextLessonId?: string;
  lessonTitle: string;
}

export default function LessonCompletionModal({
  isOpen,
  onClose,
  nextLessonId,
  lessonTitle
}: LessonCompletionModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleNextLesson = () => {
    if (nextLessonId) {
      navigate(`/tutorials/${nextLessonId}`);
    } else {
      navigate('/tutorials');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-sp-dark-blue rounded-2xl p-8 max-w-lg w-full mx-4 border border-sp-pale-green/10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-sp-white mb-2">Lesson Completed!</h3>
          <p className="text-sp-white/70">
            Congratulations! You've completed "{lessonTitle}".
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleNextLesson}
            className="w-full px-6 py-3 rounded-lg bg-sp-pale-green text-sp-very-dark-blue font-semibold hover:bg-sp-pale-green/90 transition-colors"
          >
            {nextLessonId ? 'Continue to Next Lesson' : 'Return to Tutorials'}
          </button>
          <button
            onClick={onClose}
            className="w-full px-6 py-3 rounded-lg bg-sp-dark-blue hover:bg-sp-dark-blue/80 text-sp-white/70 transition-colors"
          >
            Review This Lesson
          </button>
        </div>
      </div>
    </div>
  );
} 