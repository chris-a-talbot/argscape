import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { log } from '../../lib/logger';
import ClickableLogo from '../ui/ClickableLogo';
import Navbar from '../layout/Navbar';
import ParticleBackground from '../ui/ParticleBackground';
import { useNavigate } from 'react-router-dom';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { useColorTheme } from '../../context/ColorThemeContext';
import { useSemanticColors } from '../../hooks/useSemanticColors';
import { LiquidCard } from '../ui/LiquidCard';
import { ARGTreeVisualization } from '../ui/ARGTreeVisualization';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface LandingPageProps {
  onOptionSelect: (option: 'upload' | 'simulate' | 'load') => void;
  isTransitioning?: boolean;
}

export default function LandingPage({ onOptionSelect, isTransitioning = false }: LandingPageProps) {
  const navigate = useNavigate();
  const [availableTreeSequences, setAvailableTreeSequences] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showContent, setShowContent] = useState(!isTransitioning);
  const [betaNoticeDismissed, setBetaNoticeDismissed] = useState(false);
  const { pageStyle } = useThemeStyles();
  const { colors } = useColorTheme();
  const semanticColors = useSemanticColors();
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const dismissBetaNotice = () => {
    setBetaNoticeDismissed(true);
  };

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

  const startHereButton = (
    <button
      onClick={() => navigate('/tutorials')}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-300 hover:scale-105"
      style={{
        background: `linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: `1px solid rgba(255,255,255,0.2)`,
        boxShadow: `0 4px 16px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.2)`,
        color: colors.text,
      }}
    >
      <span className="text-sm">New to ARGs? Start here</span>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
      </svg>
    </button>
  );

  const uploadButton = (
    <LiquidCard onClick={() => handleOptionClick('upload')} interactive className="text-center w-48">
      <div className="flex flex-col items-center gap-2 py-2">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${colors.accentPrimary}1A` }}>
          <svg className="w-6 h-6" style={{ color: colors.accentPrimary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <h3 className="text-base font-semibold" style={{ color: colors.text }}>Upload</h3>
        <p className="text-xs" style={{ color: colors.textSecondary }}>Load your own .trees file</p>
      </div>
    </LiquidCard>
  );

  const simulateButton = (
    <LiquidCard onClick={() => handleOptionClick('simulate')} interactive className="text-center w-48">
      <div className="flex flex-col items-center gap-2 py-2">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${colors.accentPrimary}1A` }}>
          <svg className="w-6 h-6" style={{ color: colors.accentPrimary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold" style={{ color: colors.text }}>Simulate</h3>
        <p className="text-xs" style={{ color: colors.textSecondary }}>Generate with msprime</p>
      </div>
    </LiquidCard>
  );

  const loadButtonElement = (
    <LiquidCard
      onClick={availableTreeSequences.length > 0 ? () => handleOptionClick('load') : undefined}
      interactive={availableTreeSequences.length > 0}
      className={`text-center w-48 ${availableTreeSequences.length === 0 ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      <div className="flex flex-col items-center gap-2 py-2">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${colors.accentPrimary}1A` }}>
          <svg className="w-6 h-6" style={{ color: colors.accentPrimary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold" style={{ color: colors.text }}>Load</h3>
        <p className="text-xs" style={{ color: availableTreeSequences.length === 0 ? semanticColors.error : colors.textSecondary }}>
          {loading ? <span className="animate-pulse">Loading...</span> : <span>{availableTreeSequences.length} available</span>}
        </p>
      </div>
    </LiquidCard>
  );

  return (
    <div
      className={`min-h-screen flex flex-col relative ${isTransitioning ? 'absolute inset-0 z-40' : ''}`}
      style={pageStyle}
    >
      <ParticleBackground />
      <Navbar />

      {/* Dismissible Beta Notice Banner - appears below navbar */}
      {!betaNoticeDismissed && (
        <div
          className="w-full px-4 py-2"
          style={{
            position: 'relative',
            zIndex: 40,
            backgroundColor: 'rgba(251, 191, 36, 0.15)',
            borderBottom: '1px solid rgba(251, 191, 36, 0.3)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-3">
            <p className="text-xs text-center" style={{ color: colors.text }}>
              <span className="font-semibold" style={{ color: '#fbbf24' }}>Beta:</span>{' '}
              Data on ARGscape.com is stored for up to 24h and may be wiped during updates. Download results often.
            </p>
            <button
              onClick={dismissBetaNotice}
              className="flex-shrink-0 p-1 rounded-full hover:bg-white/20 transition-colors"
              style={{ color: colors.textSecondary }}
              aria-label="Dismiss notice"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      <div className="flex-grow flex items-center justify-center px-4 pt-16">
        <div className="text-center">
          {isDesktop ? (
            <div className={`transition-all duration-2000 ease-in-out ${isTransitioning && !showContent ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'}`}>
              <ARGTreeVisualization
                startHereButton={startHereButton}
                uploadButton={uploadButton}
                simulateButton={simulateButton}
                loadButton={loadButtonElement}
                tagline="Ancestry through space, time, and the genome."
                onLogoClick={() => navigate('/', { state: { forceIntro: true } })}
              />
            </div>
          ) : (
            <>
              <div className={`mb-8 transition-all duration-2000 ease-in-out ${isTransitioning && !showContent ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'}`}>
                <ClickableLogo size="large" className="mb-4" />
                <p className="text-lg md:text-xl mb-6" style={{ color: colors.textSecondary }}>
                  Ancestry through space, time, and the genome.
                </p>
                <div className="mb-12">{startHereButton}</div>
              </div>
              <div className={`w-full max-w-4xl mx-auto grid grid-cols-1 gap-4 transition-all duration-2000 ease-in-out delay-500 ${isTransitioning && !showContent ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'}`}>
                {uploadButton}
                {simulateButton}
                {loadButtonElement}
              </div>
            </>
          )}
          <div className={`mt-8 text-center transition-all duration-2000 ease-in-out delay-1200 ${isTransitioning && !showContent ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'}`}></div>
        </div>
      </div>
    </div>
  );
} 