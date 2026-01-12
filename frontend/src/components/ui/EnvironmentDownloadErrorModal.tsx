import { useState } from 'react';

interface EnvironmentDownloadErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorMessage: string;
}

export default function EnvironmentDownloadErrorModal({ 
  isOpen, 
  onClose, 
  errorMessage 
}: EnvironmentDownloadErrorModalProps) {
  const [isDownloadingFromGitHub, setIsDownloadingFromGitHub] = useState(false);

  if (!isOpen) return null;

  const handleGitHubDownload = async () => {
    setIsDownloadingFromGitHub(true);
    try {
      // Direct download from GitHub raw URL
      const response = await fetch('https://raw.githubusercontent.com/chris-a-talbot/argscape/dev/argscape/api/environment.yml');
      if (response.ok) {
        const text = await response.text();
        const blob = new Blob([text], { type: 'text/yaml' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'environment.yml';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        onClose();
      } else {
        throw new Error('Failed to download from GitHub');
      }
    } catch (error) {
      // If that fails, open GitHub page
      window.open('https://github.com/chris-a-talbot/argscape/blob/dev/argscape/api/environment.yml', '_blank');
      onClose();
    } finally {
      setIsDownloadingFromGitHub(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10002] p-4">
      <div className="bg-sp-dark-blue border border-sp-pale-green/20 rounded-lg max-w-md w-full p-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-sp-white mb-2">
              Download Failed
            </h3>
            <p className="text-sp-white/80 mb-4">
              We couldn't download the environment.yml file from our servers.
            </p>
            <div className="bg-sp-very-dark-blue border border-sp-pale-green/20 rounded p-3 mb-4">
              <p className="text-xs text-sp-white/60 font-mono">
                Error: {errorMessage}
              </p>
            </div>
            <p className="text-sp-white/80 mb-6">
              Would you like to download it directly from our GitHub repository instead?
            </p>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleGitHubDownload}
            disabled={isDownloadingFromGitHub}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-sp-pale-green text-sp-very-dark-blue rounded-lg hover:bg-sp-pale-green/90 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDownloadingFromGitHub ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Downloading...
              </>
            ) : (
              <>
                <svg className="mr-2 w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                Download from GitHub
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-sp-pale-green/30 text-sp-white rounded-lg hover:bg-sp-pale-green/10 transition-colors duration-200 font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
} 