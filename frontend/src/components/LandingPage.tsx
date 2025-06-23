import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { log } from '../lib/logger';
import ClickableLogo from './ui/ClickableLogo';
import Navbar from './ui/Navbar';
import ParticleBackground from './ui/ParticleBackground';
import { useNavigate } from 'react-router-dom';

interface LandingPageProps {
  onOptionSelect: (option: 'upload' | 'simulate' | 'load') => void;
  isTransitioning?: boolean;
}

export default function LandingPage({ onOptionSelect, isTransitioning = false }: LandingPageProps) {
  const navigate = useNavigate();
  const [availableTreeSequences, setAvailableTreeSequences] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showContent, setShowContent] = useState(!isTransitioning);

  useEffect(() => {
    const fetchAvailableTreeSequences = async () => {
      try {
        log.data.processing('fetch-available-tree-sequences', 'LandingPage');
        const response = await api.getUploadedFiles();
        const data = response.data as { uploaded_tree_sequences: string[] };
        setAvailableTreeSequences(data.uploaded_tree_sequences || []);
      } catch (error) {
        log.error('Failed to fetch available tree sequences', {
          component: 'LandingPage',
          error: error instanceof Error ? error : new Error(String(error))
        });
        setAvailableTreeSequences([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableTreeSequences();
  }, []);

  // Handle transition timing
  useEffect(() => {
    if (isTransitioning) {
      // Delay showing content until transition starts
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setShowContent(true);
    }
  }, [isTransitioning]);

  const handleOptionClick = (option: 'upload' | 'simulate' | 'load') => {
    if (option === 'load' && availableTreeSequences.length === 0) {
      return; // Don't allow clicking if no sequences available
    }
    onOptionSelect(option);
  };

  return (
    <div className={`
      text-sp-white min-h-screen flex flex-col bg-sp-very-dark-blue relative
      ${isTransitioning ? 'absolute inset-0 z-40' : ''}
    `}>
      <ParticleBackground />
      <Navbar />
      <div className="flex-grow flex items-center justify-center px-4 pt-16">
        <div className="text-center">
          {/* Logo and Tagline - fade in during transition */}
          <div className={`
            mb-8 transition-all duration-2000 ease-in-out
            ${isTransitioning && !showContent ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'}
          `}>
            <ClickableLogo size="large" className="mb-4" />
            <p className="text-lg md:text-xl text-sp-white/70 mb-6">
              Explore ancestry through space, time, and the genome.
            </p>

            {/* Hero Button */}
            <button
              onClick={() => navigate('/tutorials')}
              className="inline-flex items-center gap-2 bg-sp-pale-green hover:bg-sp-very-pale-green text-sp-very-dark-blue font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg group mb-12"
            >
              <span>New to ARGs? Start here!</span>
              <svg 
                className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>

          {/* Main Options - fade in during transition */}
          <div className={`
            w-full max-w-2xl mx-auto space-y-4 transition-all duration-2000 ease-in-out delay-500
            ${isTransitioning && !showContent ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'}
          `}>
            {/* Upload Option */}
            <button
              onClick={() => handleOptionClick('upload')}
              className="w-full bg-sp-dark-blue hover:bg-sp-dark-blue/80 border border-sp-pale-green/20 hover:border-sp-pale-green/40 rounded-xl p-6 text-left transition-all duration-200 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-sp-pale-green/10 rounded-lg flex items-center justify-center group-hover:bg-sp-pale-green/20 transition-colors duration-200">
                  <svg className="w-6 h-6 text-sp-pale-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-sp-white mb-1">Upload a tree sequence</h3>
                  <p className="text-sp-white/60 text-sm">Upload your own .trees or .tsz file to visualize</p>
                </div>
              </div>
            </button>

            {/* Simulate Option */}
            <button
              onClick={() => handleOptionClick('simulate')}
              className="w-full bg-sp-dark-blue hover:bg-sp-dark-blue/80 border border-sp-pale-green/20 hover:border-sp-pale-green/40 rounded-xl p-6 text-left transition-all duration-200 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-sp-pale-green/10 rounded-lg flex items-center justify-center group-hover:bg-sp-pale-green/20 transition-colors duration-200">
                  <svg className="w-6 h-6 text-sp-pale-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-sp-white mb-1">Simulate a tree sequence</h3>
                  <p className="text-sp-white/60 text-sm">Generate new data using msprime simulation</p>
                </div>
              </div>
            </button>

            {/* Load Option */}
            <button
              onClick={() => handleOptionClick('load')}
              disabled={availableTreeSequences.length === 0}
              className={`w-full border rounded-xl p-6 text-left transition-all duration-200 group ${
                availableTreeSequences.length === 0
                  ? 'bg-sp-dark-blue/50 border-sp-pale-green/10 cursor-not-allowed opacity-50'
                  : 'bg-sp-dark-blue hover:bg-sp-dark-blue/80 border-sp-pale-green/20 hover:border-sp-pale-green/40'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors duration-200 ${
                  availableTreeSequences.length === 0
                    ? 'bg-sp-pale-green/5'
                    : 'bg-sp-pale-green/10 group-hover:bg-sp-pale-green/20'
                }`}>
                  <svg className="w-6 h-6 text-sp-pale-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-sp-white mb-1">Load a tree sequence</h3>
                  <p className="text-sp-white/60 text-sm">
                    Choose from existing uploaded sequences
                    {loading ? (
                      <span className="ml-2">
                        <span className="animate-pulse">Loading...</span>
                      </span>
                    ) : (
                      <span className={`ml-2 font-medium ${
                        availableTreeSequences.length === 0 ? 'text-red-400' : 'text-sp-pale-green'
                      }`}>
                        ({availableTreeSequences.length} available)
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Beta Notice - fade in during transition */}
          <div className={`
            bg-amber-900/15 border border-amber-700/25 rounded-lg p-3 mt-12 max-w-2xl mx-auto
            transition-all duration-2000 ease-in-out delay-1000
            ${isTransitioning && !showContent ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'}
          `}>
            <p className="text-amber-200 text-xs md:text-sm text-center leading-relaxed">
              <span className="font-semibold">⚠️ Beta Notice:</span> If you're using ARGscape.com, your data will be stored on a secure, private server for up to 24 hours. 
              Data may be wiped at any time during updates. Please download your results often and respect our limited resources by clearing data when you're done.
            </p>
          </div>

          {/* Attribution - fade in during transition */}
          <div className={`
            mt-8 text-center
            transition-all duration-2000 ease-in-out delay-1200
            ${isTransitioning && !showContent ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'}
          `}>
          </div>
        </div>
      </div>
    </div>
  );
} 