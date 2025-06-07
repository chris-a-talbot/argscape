import { useEffect } from 'react';

interface AlertModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  buttonText?: string;
  onClose: () => void;
  type?: 'success' | 'error' | 'info';
}

export default function AlertModal({ 
  isOpen, 
  title, 
  message, 
  buttonText = 'OK',
  onClose,
  type = 'info'
}: AlertModalProps) {
  // Handle ESC key
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIconAndColors = () => {
    switch (type) {
      case 'success':
        return {
          icon: (
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          bgColor: 'bg-green-500/10',
          buttonColor: 'bg-green-600 hover:bg-green-500 text-white'
        };
      case 'error':
        return {
          icon: (
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          bgColor: 'bg-red-500/10',
          buttonColor: 'bg-red-600 hover:bg-red-500 text-white'
        };
      default: // info
        return {
          icon: (
            <svg className="w-5 h-5 text-sp-pale-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          bgColor: 'bg-sp-pale-green/10',
          buttonColor: 'bg-sp-pale-green hover:bg-sp-very-pale-green text-sp-very-dark-blue'
        };
    }
  };

  const { icon, bgColor, buttonColor } = getIconAndColors();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-sp-very-dark-blue border border-sp-pale-green/20 rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bgColor}`}>
              {icon}
            </div>
            <h3 className="text-lg font-semibold text-sp-white break-words">{title}</h3>
          </div>
          
          {/* Message */}
          <div className="text-sp-white/80 mb-6 leading-relaxed break-words whitespace-pre-wrap">
            {message}
          </div>
          
          {/* Action */}
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className={`font-bold py-3 px-6 rounded-xl transition-all duration-200 ${buttonColor}`}
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 