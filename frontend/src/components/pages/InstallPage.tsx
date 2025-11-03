import React, { useState } from 'react';
import Navbar from '../layout/Navbar';
import { api } from '../../lib/api';
import { log } from '../../lib/logger';
import EnvironmentDownloadErrorModal from '../ui/EnvironmentDownloadErrorModal';
import ParticleBackground from '../ui/ParticleBackground';
import { useColorTheme } from '../../context/ColorThemeContext';

export default function InstallPage() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { colors } = useColorTheme();

  // Detect user's operating system
  const detectPlatform = (): 'macos' | 'linux' | 'windows' | 'unknown' => {
    if (typeof window === 'undefined') return 'unknown';
    const platform = window.navigator.platform.toLowerCase();
    const userAgent = window.navigator.userAgent.toLowerCase();
    
    if (platform.includes('mac') || userAgent.includes('mac')) return 'macos';
    if (platform.includes('win') || userAgent.includes('win')) return 'windows';
    if (platform.includes('linux') || userAgent.includes('linux')) return 'linux';
    return 'unknown';
  };

  const userPlatform = detectPlatform();

  const renderTextWithARGscape = (text: string) => {
    return text.split(/(ARGscape)/g).map((part, index) => 
      part === 'ARGscape' ? (
        <span key={index}>
          ARG<span style={{ color: colors.accentPrimary }}>scape</span>
        </span>
      ) : part
    );
  };

  const handleDownloadEnvironment = async () => {
    try {
      setIsDownloading(true);
      log.info('Starting environment.yml download', { component: 'InstallPage' });
      
      let response;
      try {
        // Try API endpoint first
        response = await api.downloadEnvironmentFile();
      } catch (apiError) {
        log.info('API download failed, trying static file fallback', { component: 'InstallPage' });
        
        // Fallback to static file
        const staticResponse = await fetch('/environment.yml');
        if (!staticResponse.ok) {
          throw apiError; // Use original API error
        }
        
        response = {
          data: await staticResponse.text(),
          status: staticResponse.status
        };
      }
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/yaml' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'environment.yml';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      log.info('Environment.yml downloaded successfully', { component: 'InstallPage' });
    } catch (error) {
      log.error('Failed to download environment.yml', {
        component: 'InstallPage',
        error: error instanceof Error ? error : new Error(String(error))
      });
      
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      setErrorMessage(errorMsg);
      setShowErrorModal(true);
    } finally {
      setIsDownloading(false);
    }
  };

  const steps = [
    {
      number: 1,
      title: 'System Prerequisites',
      description: 'Install build tools required for compiling Python packages (may not be necessary if you have experience installing Python packages). Most geospatial libraries (GDAL, PROJ, GEOS) are included via conda, but build tools are needed for some pip-installed packages.',
      platformSpecific: true,
      platforms: {
        macos: {
          description: 'Install Xcode Command Line Tools (required for compiling C/C++ packages):',
          code: 'xcode-select --install'
        },
        linux: {
          description: 'Install build tools (usually already installed, but if missing):',
          code: '# Ubuntu/Debian:\nsudo apt-get update\nsudo apt-get install build-essential\n\n# Fedora/RHEL:\nsudo dnf install gcc gcc-c++ make\n\n# Arch Linux:\nsudo pacman -S base-devel'
        },
        windows: {
          description: 'Install Visual Studio Build Tools or Visual Studio Community (with C++ build tools). Alternatively, install Microsoft C++ Build Tools:',
          link: 'https://visualstudio.microsoft.com/visual-cpp-build-tools/',
          linkText: 'Download Build Tools'
        }
      }
    },
    {
      number: 2,
      title: 'Install Conda',
      description: 'Install Anaconda, Miniconda, or another Conda distribution.',
      link: 'https://docs.anaconda.com/anaconda/install/',
      linkText: 'Download Anaconda',
      sidenote: 'Tip: Consider using mamba (a faster conda alternative). After installing conda, install mamba with: conda install mamba -n base -c conda-forge, then replace "conda" with "mamba" in the following steps.'
    },
    {
      number: 3,
      title: 'Verify Conda Installation',
      description: 'Verify that conda is installed and accessible from your terminal:',
      code: 'conda --version',
      verification: true
    },
    {
      number: 4,
      title: 'Download environment.yml',
      description: 'Save the environment file to a folder.',
      action: true
    },
    {
      number: 5,
      title: 'Navigate to folder',
      description: 'Open terminal (macOS/Linux) or Anaconda Prompt (Windows) and navigate to the folder containing environment.yml.',
      code: 'cd /path/to/your/folder'
    },
    {
      number: 6,
      title: 'Create environment',
      description: 'Create the ARGscape environment:',
      code: 'conda env create -f environment.yml'
    },
    {
      number: 7,
      title: 'Wait for install',
      description: 'Installation takes 5-15 minutes depending on your connection.'
    },
    {
      number: 8,
      title: 'Activate environment',
      description: 'Activate the environment:',
      code: 'conda activate argscape_local'
    },
    {
      number: 9,
      title: 'Launch ARGscape',
      description: 'Start ARGscape. Note: The backend will take 1-5 minutes to initialize before the frontend becomes available. ',
      code: 'argscape',
      portNote: true
    },
    {
      number: 10,
      title: 'Open in browser',
      description: 'ARGscape opens automatically at http://127.0.0.1:8000 on most platforms. If you used a different port, adjust the URL accordingly. Wait 1-5 minutes for the backend to fully load, then refresh the browser page if it doesn\'t load automatically.'
    }
  ];

  return (
    <div className="min-h-screen bg-sp-very-dark-blue relative">
      <ParticleBackground />
      <div className="text-sp-white min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow px-4 pt-24 pb-32">
          <div className="max-w-4xl mx-auto">
            <div className="bg-sp-very-dark-blue/95 backdrop-blur-sm rounded-2xl shadow-xl border border-sp-dark-blue overflow-hidden p-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">
              Install ARG<span style={{ color: colors.accentPrimary }}>scape</span> Locally
            </h1>
            <p className="text-xl text-sp-white/80 max-w-2xl mx-auto">
              Install ARG<span style={{ color: colors.accentPrimary }}>scape</span> on your machine for better performance and offline use.
            </p>
          </div>

          {/* Installation Steps */}
          <div className="space-y-6">
            {steps.map((step) => (
              <React.Fragment key={step.number}>
                <div className="bg-sp-dark-blue/50 border border-sp-pale-green/20 rounded-lg p-6">
                  <div className="flex items-start space-x-4">
                    {/* Step Number */}
                    <div className="flex-shrink-0 w-8 h-8 bg-sp-pale-green text-sp-very-dark-blue rounded-full flex items-center justify-center font-bold text-sm">
                      {step.number}
                    </div>
                    
                    {/* Step Content */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-sp-white mb-2">
                        {renderTextWithARGscape(step.title)}
                      </h3>
                      
                      {/* Platform-specific step rendering */}
                      {step.platformSpecific && step.platforms ? (
                        <>
                          <p className="text-sp-white/80 mb-3">
                            {renderTextWithARGscape(step.description)}
                          </p>
                          
                          {/* Show platform-specific content based on detected platform */}
                          {(() => {
                            const platform = step.platforms[userPlatform as keyof typeof step.platforms] || 
                                           (userPlatform === 'unknown' ? step.platforms.macos : null);
                            
                            if (!platform) {
                              // Show all platforms if detection failed
                              return (
                                <div className="space-y-4">
                                  {(Object.keys(step.platforms) as Array<keyof typeof step.platforms>).map((platformKey) => {
                                    const platformInfo = step.platforms[platformKey];
                                    return (
                                      <div key={platformKey} className="bg-sp-very-dark-blue/50 border border-sp-pale-green/20 rounded-lg p-4">
                                        <h4 className="text-sm font-semibold text-sp-pale-green mb-2 capitalize">
                                          {platformKey === 'macos' ? 'macOS' : platformKey === 'windows' ? 'Windows' : 'Linux'}
                                        </h4>
                                        <p className="text-sp-white/80 mb-2 text-sm">
                                          {platformInfo.description}
                                        </p>
                                        {'code' in platformInfo && platformInfo.code && (
                                          <div className="bg-sp-very-dark-blue border border-sp-pale-green/30 rounded p-3 font-mono text-sm text-sp-pale-green whitespace-pre-wrap">
                                            {platformInfo.code}
                                          </div>
                                        )}
                                        {'link' in platformInfo && platformInfo.link && (
                                          <a
                                            href={platformInfo.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center px-4 py-2 bg-sp-pale-green text-sp-very-dark-blue rounded-lg hover:bg-sp-pale-green/90 transition-colors duration-200 font-medium mt-2 text-sm"
                                          >
                                            {'linkText' in platformInfo ? platformInfo.linkText : 'Download'}
                                            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                          </a>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            }
                            
                            // Show detected platform's content
                            return (
                              <div>
                                <p className="text-sp-white/80 mb-2 text-sm">
                                  {platform.description}
                                </p>
                                {'code' in platform && platform.code && (
                                  <div className="bg-sp-very-dark-blue border border-sp-pale-green/30 rounded p-3 font-mono text-sm text-sp-pale-green whitespace-pre-wrap">
                                    {platform.code}
                                  </div>
                                )}
                                {'link' in platform && platform.link && (
                                  <a
                                    href={platform.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-4 py-2 bg-sp-pale-green text-sp-very-dark-blue rounded-lg hover:bg-sp-pale-green/90 transition-colors duration-200 font-medium mt-2"
                                  >
                                    {'linkText' in platform ? platform.linkText : 'Download'}
                                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </a>
                                )}
                                {userPlatform !== 'unknown' && (
                                  <p className="text-xs text-sp-white/60 mt-2 italic">
                                    Showing instructions for {userPlatform === 'macos' ? 'macOS' : userPlatform === 'windows' ? 'Windows' : 'Linux'}. Need instructions for another platform? View all platforms in the troubleshooting section.
                                  </p>
                                )}
                              </div>
                            );
                          })()}
                        </>
                      ) : (
                        <>
                          <p className="text-sp-white/80 mb-3">
                            {renderTextWithARGscape(step.description)}
                          </p>
                          
                          {/* Code block */}
                          {step.code && (
                            <div className="bg-sp-very-dark-blue border border-sp-pale-green/30 rounded p-3 font-mono text-sm text-sp-pale-green">
                              {step.code}
                            </div>
                          )}
                          
                          {/* External link */}
                          {step.link && (
                            <a
                              href={step.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-4 py-2 bg-sp-pale-green text-sp-very-dark-blue rounded-lg hover:bg-sp-pale-green/90 transition-colors duration-200 font-medium"
                            >
                              {step.linkText}
                              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          )}
                        </>
                      )}
                      
                      {/* Sidenote */}
                      {step.sidenote && (
                        <div className="mt-4 p-3 bg-sp-pale-green/10 border border-sp-pale-green/30 rounded-lg">
                          <p className="text-sm text-sp-white/90">
                            {step.sidenote}
                          </p>
                        </div>
                      )}
                      
                      {/* Port conflict note */}
                      {step.portNote && (
                        <div className="mt-4 p-3 bg-sp-dark-blue/50 border border-sp-pale-green/30 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <svg className="w-5 h-5 text-sp-pale-green flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <div>
                              <p className="text-sm font-medium text-sp-pale-green mb-1">Port Conflict?</p>
                              <p className="text-sm text-sp-white/80">
                                If port 8000 is already in use, ARGscape will show an error. Use <code className="bg-sp-very-dark-blue px-1 py-0.5 rounded text-xs text-sp-pale-green">argscape --port 8001</code> (or another available port) and access the app at the corresponding URL.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Download action */}
                      {step.action && (
                        <button
                          onClick={handleDownloadEnvironment}
                          disabled={isDownloading}
                          className="inline-flex items-center px-6 py-3 bg-sp-pale-green text-sp-very-dark-blue rounded-lg hover:bg-sp-pale-green/90 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isDownloading ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-3 h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Downloading...
                            </>
                          ) : (
                            <>
                              <svg className="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Download environment.yml
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* GitHub Alternative - Show after step 4 */}
                {step.number === 4 && (
                  <div className="p-4 bg-sp-pale-green/10 border border-sp-pale-green/20 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        <svg className="w-5 h-5 text-sp-pale-green" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-sp-pale-green mb-1">Alternative: GitHub</h3>
                        <p className="text-sm text-sp-white/70">
                          Download directly from{' '}
                          <a 
                            href="https://github.com/chris-a-talbot/argscape/blob/dev/argscape/api/environment.yml" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sp-pale-green hover:underline"
                          >
                            GitHub
                          </a>
                          .
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Troubleshooting */}
          <div className="mt-12 p-6 bg-sp-dark-blue/30 border border-sp-pale-green/20 rounded-lg">
            <h3 className="text-lg font-semibold text-sp-pale-green mb-3">
              Troubleshooting
            </h3>
            <ul className="space-y-2 text-sp-white/80">
              <li>• <strong>Build errors during installation?</strong> Ensure you've completed Step 1 (System Prerequisites) for your platform. Missing build tools (Xcode CLT on macOS, Visual Studio Build Tools on Windows, build-essential on Linux) will cause compilation failures.</li>
              <li>• <strong>Conda not found after installation?</strong> Check PATH or use Anaconda Prompt (Windows). You may need to restart your terminal after installing conda.</li>
              <li>• Environment already exists? Remove it first: <code className="bg-sp-very-dark-blue px-1 py-0.5 rounded text-xs text-sp-pale-green">conda env remove -n argscape_local</code>, then run step 6 again</li>
              <li>• Package conflicts? Try updating instead: <code className="bg-sp-very-dark-blue px-1 py-0.5 rounded text-xs text-sp-pale-green">conda env update -f environment.yml --prune</code></li>
              <li>• GDAL/geospatial errors? Ensure you're using conda (not pip) - the environment.yml handles all geospatial dependencies automatically via conda-forge</li>
              <li>• Installation too slow? Try using mamba (faster conda alternative): <code className="bg-sp-very-dark-blue px-1 py-0.5 rounded text-xs text-sp-pale-green">mamba env create -f environment.yml</code> (install mamba first: <code className="bg-sp-very-dark-blue px-1 py-0.5 rounded text-xs text-sp-pale-green">conda install mamba -n base -c conda-forge</code>)</li>
              <li>• <strong>Port 8000 already in use?</strong> Use <code className="bg-sp-very-dark-blue px-1 py-0.5 rounded text-xs text-sp-pale-green">argscape --port 8001</code> (or another port) and adjust the browser URL accordingly</li>
              <li>• Web interface not loading? Wait 2-3 minutes, then refresh</li>
            </ul>
          </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Modal */}
      <EnvironmentDownloadErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        errorMessage={errorMessage}
      />
    </div>
  );
} 