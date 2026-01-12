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
  const [isStep0Expanded, setIsStep0Expanded] = useState(false);
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

  const step0 = {
    number: 0,
    title: 'System Prerequisites (Optional)',
    description: 'Install build tools required for compiling Python packages. This step may not be necessary if you have experience installing Python packages. Only complete this step if you encounter build errors during installation.',
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
  };

  const steps = [
    {
      number: 1,
      title: 'Install and Verify Conda',
      description: 'Install Anaconda, Miniconda, or another Conda distribution, then verify the installation:',
      link: 'https://docs.anaconda.com/anaconda/install/',
      linkText: 'Download Anaconda',
      verificationCode: 'conda --version',
      sidenote: 'Tip: Consider using mamba (a faster conda alternative). After installing conda, install mamba with: conda install mamba -n base -c conda-forge, then replace "conda" with "mamba" in the following steps.'
    },
    {
      number: 2,
      title: 'Download environment.yml',
      description: 'Save the environment file to a folder.',
      action: true,
      githubAlternative: true
    },
    {
      number: 3,
      title: 'Navigate to folder',
      description: 'Open terminal (macOS/Linux) or Anaconda Prompt (Windows) and navigate to the folder containing environment.yml.',
      code: 'cd /path/to/your/folder'
    },
    {
      number: 4,
      title: 'Create environment',
      description: 'Create the ARGscape environment. Installation takes 5-15 minutes depending on your connection:',
      code: 'conda env create -f environment.yml'
    },
    {
      number: 5,
      title: 'Activate environment',
      description: 'Activate the environment:',
      code: 'conda activate argscape_local'
    },
    {
      number: 6,
      title: 'Launch ARGscape',
      description: 'Start ARGscape. Note: The backend will take 1-5 minutes to initialize before the frontend becomes available. ',
      code: 'argscape',
      portNote: true,
      cliToolsNote: true
    },
    {
      number: 7,
      title: 'Open in browser',
      description: 'ARGscape opens automatically at http://127.0.0.1:8000 on most platforms. If you used a different port, adjust the URL accordingly. Wait 1-5 minutes for the backend to fully load, then refresh the browser page if it doesn\'t load automatically.'
    }
  ];

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: colors.background }}>
      <ParticleBackground />
      <div className="min-h-screen flex flex-col" style={{ color: colors.text }}>
        <Navbar />
        <div className="flex-grow px-4 pt-24 pb-32">
          <div className="max-w-4xl mx-auto">
            <div className="backdrop-blur-sm rounded-2xl shadow-xl border overflow-hidden p-8" style={{
              backgroundColor: `${colors.containerBackground}f0`,
              borderColor: colors.border
            }}>
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">
              Install ARG<span style={{ color: colors.accentPrimary }}>scape</span> Locally
            </h1>
            <p className="text-xl max-w-2xl mx-auto" style={{ color: colors.textSecondary }}>
              Install ARG<span style={{ color: colors.accentPrimary }}>scape</span> on your machine for better performance and offline use.
            </p>
          </div>

          {/* Installation Steps */}
          <div className="space-y-6">
            {/* Step 0 - Collapsible Prerequisites */}
            <div className="border rounded-lg overflow-hidden" style={{
              backgroundColor: `${colors.containerBackground}50`,
              borderColor: `${colors.border}30`
            }}>
              <button
                onClick={() => setIsStep0Expanded(!isStep0Expanded)}
                className="w-full p-6 flex items-start space-x-4 transition-colors text-left"
                style={{ color: colors.text }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${colors.containerBackground}80`}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{
                  backgroundColor: colors.accentPrimary,
                  color: colors.buttonText
                }}>
                  {step0.number}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2" style={{ color: colors.text }}>
                    {step0.title}
                  </h3>
                  <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>
                    {step0.description}
                  </p>
                  <p className="text-xs italic" style={{ color: colors.accentPrimary, opacity: 0.8 }}>
                    Click to {isStep0Expanded ? 'collapse' : 'expand'} instructions
                  </p>
                </div>
                <svg
                  className={`w-5 h-5 transition-transform ${isStep0Expanded ? 'rotate-180' : ''}`}
                  style={{ color: colors.accentPrimary }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isStep0Expanded && (
                <div className="px-6 pb-6 pt-0 border-t" style={{ borderColor: `${colors.border}30` }}>
                  <div className="pt-4">
                    {step0.platformSpecific && step0.platforms ? (
                      <>
                        {/* Show platform-specific content based on detected platform */}
                        {(() => {
                          const platform = step0.platforms[userPlatform as keyof typeof step0.platforms] || 
                                         (userPlatform === 'unknown' ? step0.platforms.macos : null);
                          
                          if (!platform) {
                            // Show all platforms if detection failed
                            return (
                              <div className="space-y-4">
                                {(Object.keys(step0.platforms) as Array<keyof typeof step0.platforms>).map((platformKey) => {
                                  const platformInfo = step0.platforms[platformKey];
                                  return (
                                    <div key={platformKey} className="border rounded-lg p-4" style={{
                                      backgroundColor: `${colors.containerBackground}80`,
                                      borderColor: colors.border
                                    }}>
                                      <h4 className="text-sm font-semibold mb-2 capitalize" style={{ color: colors.accentPrimary }}>
                                        {platformKey === 'macos' ? 'macOS' : platformKey === 'windows' ? 'Windows' : 'Linux'}
                                      </h4>
                                      <p className="mb-2 text-sm" style={{ color: colors.text, opacity: 0.8 }}>
                                        {platformInfo.description}
                                      </p>
                                      {'code' in platformInfo && platformInfo.code && (
                                        <div className="border rounded p-3 font-mono text-sm whitespace-pre-wrap" style={{
                                          backgroundColor: colors.background,
                                          borderColor: colors.border,
                                          color: colors.accentPrimary
                                        }}>
                                          {platformInfo.code}
                                        </div>
                                      )}
                                      {'link' in platformInfo && platformInfo.link && (
                                        <a
                                          href={platformInfo.link}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center px-4 py-2 rounded-lg transition-colors duration-200 font-medium mt-2 text-sm"
                                          style={{
                                            backgroundColor: colors.accentPrimary,
                                            color: colors.buttonText
                                          }}
                                          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                                          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
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
                              <p className="mb-2 text-sm" style={{ color: colors.text, opacity: 0.8 }}>
                                {platform.description}
                              </p>
                              {'code' in platform && platform.code && (
                                <div className="border rounded p-3 font-mono text-sm whitespace-pre-wrap" style={{
                                  backgroundColor: colors.background,
                                  borderColor: colors.border,
                                  color: colors.accentPrimary
                                }}>
                                  {platform.code}
                                </div>
                              )}
                              {'link' in platform && platform.link && (
                                <a
                                  href={platform.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-4 py-2 rounded-lg transition-colors duration-200 font-medium mt-2"
                                  style={{
                                    backgroundColor: colors.accentPrimary,
                                    color: colors.buttonText
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                >
                                  {'linkText' in platform ? platform.linkText : 'Download'}
                                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              )}
                            </div>
                          );
                        })()}
                      </>
                    ) : null}
                  </div>
                </div>
              )}
            </div>

            {/* Main Steps */}
            {steps.map((step) => (
              <React.Fragment key={step.number}>
                <div className="border rounded-lg p-6" style={{
                  backgroundColor: `${colors.containerBackground}80`,
                  borderColor: colors.border
                }}>
                  <div className="flex items-start space-x-4">
                    {/* Step Number */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{
                      backgroundColor: colors.accentPrimary,
                      color: colors.buttonText
                    }}>
                      {step.number}
                    </div>
                    
                    {/* Step Content */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2" style={{ color: colors.text }}>
                        {renderTextWithARGscape(step.title)}
                      </h3>
                      
                      <p className="mb-3" style={{ color: colors.text, opacity: 0.8 }}>
                        {renderTextWithARGscape(step.description)}
                      </p>
                      
                      {/* Code block */}
                      {step.code && (
                        <div className="border rounded p-3 font-mono text-sm" style={{
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                          color: colors.accentPrimary
                        }}>
                          {step.code}
                        </div>
                      )}
                      
                      {/* Verification code block */}
                      {step.verificationCode && (
                        <div className="mt-3">
                          <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>Verify installation:</p>
                          <div className="border rounded p-3 font-mono text-sm" style={{
                            backgroundColor: colors.background,
                            borderColor: colors.border,
                            color: colors.accentPrimary
                          }}>
                            {step.verificationCode}
                          </div>
                        </div>
                      )}
                      
                      {/* External link */}
                      {step.link && (
                        <div className="mt-4">
                          <a
                            href={step.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 rounded-lg transition-colors duration-200 font-medium"
                            style={{
                              backgroundColor: colors.accentPrimary,
                              color: colors.buttonText
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                          >
                            {step.linkText}
                            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      )}
                      
                      {/* Sidenote */}
                      {step.sidenote && (
                        <div className="mt-4 p-3 border rounded-lg" style={{
                          backgroundColor: `${colors.accentPrimary}10`,
                          borderColor: `${colors.accentPrimary}50`
                        }}>
                          <p className="text-sm" style={{ color: colors.text, opacity: 0.9 }}>
                            {step.sidenote}
                          </p>
                        </div>
                      )}
                      
                      {/* Port conflict note */}
                      {step.portNote && (
                        <div className="mt-4 p-3 border rounded-lg" style={{
                          backgroundColor: `${colors.containerBackground}80`,
                          borderColor: colors.border
                        }}>
                          <div className="flex items-start space-x-2">
                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: colors.accentPrimary }} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <div>
                              <p className="text-sm font-medium mb-1" style={{ color: colors.accentPrimary }}>Port Conflict?</p>
                              <p className="text-sm" style={{ color: colors.text, opacity: 0.8 }}>
                                If port 8000 is already in use, ARGscape will show an error. Use <code className="px-1 py-0.5 rounded text-xs" style={{
                                  backgroundColor: colors.background,
                                  color: colors.accentPrimary
                                }}>argscape --port 8001</code> (or another available port) and access the app at the corresponding URL.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* CLI Tools note */}
                      {step.cliToolsNote && (
                        <div className="mt-4 p-3 border rounded-lg" style={{
                          backgroundColor: `${colors.accentPrimary}10`,
                          borderColor: `${colors.accentPrimary}50`
                        }}>
                          <div className="flex items-start space-x-2">
                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: colors.accentPrimary }} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <div>
                              <p className="text-sm font-medium mb-2" style={{ color: colors.accentPrimary }}>Command-line Tools</p>
                              <p className="text-sm mb-2" style={{ color: colors.text, opacity: 0.9 }}>
                                ARGscape also includes CLI tools for command-line use:
                              </p>
                              <ul className="text-sm space-y-1.5 ml-4 list-disc" style={{ color: colors.text, opacity: 0.8 }}>
                                <li>
                                  <code className="px-1 py-0.5 rounded text-xs" style={{
                                    backgroundColor: colors.background,
                                    color: colors.accentPrimary
                                  }}>argscape</code> – Start the local web server
                                </li>
                                <li>
                                  <code className="px-1 py-0.5 rounded text-xs" style={{
                                    backgroundColor: colors.background,
                                    color: colors.accentPrimary
                                  }}>argscape_infer</code> – Run spatial/temporal inference
                                </li>
                                <li>
                                  <code className="px-1 py-0.5 rounded text-xs" style={{
                                    backgroundColor: colors.background,
                                    color: colors.accentPrimary
                                  }}>argscape_load</code> – Manage persistent session storage for tree sequences
                                </li>
                              </ul>
                              <p className="text-sm mt-2" style={{ color: colors.textSecondary }}>
                                Run <code className="px-1 py-0.5 rounded text-xs" style={{
                                  backgroundColor: colors.background,
                                  color: colors.accentPrimary
                                }}>argscape --help</code>, <code className="px-1 py-0.5 rounded text-xs" style={{
                                  backgroundColor: colors.background,
                                  color: colors.accentPrimary
                                }}>argscape_infer --help</code>, or <code className="px-1 py-0.5 rounded text-xs" style={{
                                  backgroundColor: colors.background,
                                  color: colors.accentPrimary
                                }}>argscape_load --help</code> to see usage information.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Download action */}
                      {step.action && (
                        <>
                          <button
                            onClick={handleDownloadEnvironment}
                            disabled={isDownloading}
                            className="inline-flex items-center px-6 py-3 rounded-lg transition-colors duration-200 font-medium"
                            style={{
                              backgroundColor: isDownloading ? colors.border : colors.accentPrimary,
                              color: isDownloading ? colors.textSecondary : colors.buttonText,
                              opacity: isDownloading ? 0.5 : 1,
                              cursor: isDownloading ? 'not-allowed' : 'pointer'
                            }}
                            onMouseEnter={(e) => !isDownloading && (e.currentTarget.style.opacity = '0.9')}
                            onMouseLeave={(e) => !isDownloading && (e.currentTarget.style.opacity = '1')}
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
                          
                          {/* GitHub Alternative */}
                          {step.githubAlternative && (
                            <div className="mt-4 p-3 border rounded-lg" style={{
                              backgroundColor: `${colors.accentPrimary}10`,
                              borderColor: `${colors.accentPrimary}50`
                            }}>
                              <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 mt-0.5">
                                  <svg className="w-4 h-4" style={{ color: colors.accentPrimary }} fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-sm" style={{ color: colors.text, opacity: 0.9 }}>
                                    <strong style={{ color: colors.accentPrimary }}>Alternative:</strong> Download directly from{' '}
                                    <a 
                                      href="https://github.com/chris-a-talbot/argscape/blob/dev/argscape/api/environment.yml" 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="hover:underline"
                                      style={{ color: colors.accentPrimary }}
                                    >
                                      GitHub
                                    </a>
                                    .
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* Troubleshooting */}
          <div className="mt-12 p-6 border rounded-lg" style={{
            backgroundColor: `${colors.containerBackground}50`,
            borderColor: colors.border
          }}>
            <h3 className="text-lg font-semibold mb-3" style={{ color: colors.accentPrimary }}>
              Troubleshooting
            </h3>
            <ul className="space-y-2" style={{ color: colors.text, opacity: 0.8 }}>
              <li>• <strong>Build errors during installation?</strong> Expand Step 0 (System Prerequisites) above and complete it for your platform. Missing build tools (Xcode CLT on macOS, Visual Studio Build Tools on Windows, build-essential on Linux) will cause compilation failures.</li>
              <li>• <strong>Conda not found after installation?</strong> Check PATH or use Anaconda Prompt (Windows). You may need to restart your terminal after installing conda.</li>
              <li>• Environment already exists? Remove it first: <code className="px-1 py-0.5 rounded text-xs" style={{
                backgroundColor: colors.background,
                color: colors.accentPrimary
              }}>conda env remove -n argscape_local</code>, then run step 4 again</li>
              <li>• Package conflicts? Try updating instead: <code className="px-1 py-0.5 rounded text-xs" style={{
                backgroundColor: colors.background,
                color: colors.accentPrimary
              }}>conda env update -f environment.yml --prune</code></li>
              <li>• GDAL/geospatial errors? Ensure you're using conda (not pip) - the environment.yml handles all geospatial dependencies automatically via conda-forge</li>
              <li>• Installation too slow? Try using mamba (faster conda alternative): <code className="px-1 py-0.5 rounded text-xs" style={{
                backgroundColor: colors.background,
                color: colors.accentPrimary
              }}>mamba env create -f environment.yml</code> (install mamba first: <code className="px-1 py-0.5 rounded text-xs" style={{
                backgroundColor: colors.background,
                color: colors.accentPrimary
              }}>conda install mamba -n base -c conda-forge</code>)</li>
              <li>• <strong>Port 8000 already in use?</strong> Use <code className="px-1 py-0.5 rounded text-xs" style={{
                backgroundColor: colors.background,
                color: colors.accentPrimary
              }}>argscape --port 8001</code> (or another port) and adjust the browser URL accordingly</li>
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