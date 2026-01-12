import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import ResultPage from './components/pages/ResultPage';
import ArgVisualizationPage from './components/pages/ArgVisualizationPage';
import Footer from './components/layout/Footer';
import { useState, useEffect } from 'react';
import { TreeSequenceProvider } from './context/TreeSequenceContext';
import { ColorThemeProvider, useColorTheme } from './context/ColorThemeContext';
import { UIPreferencesProvider } from './context/UIPreferencesContext';
import SpatialArg3DVisualizationPage from './components/pages/SpatialArg3DVisualizationPage';
import SpatialArgDiffVisualizationPage from './components/pages/SpatialArgDiffVisualizationPage';
import IntroAnimation from './components/layout/IntroAnimation';
import LandingPage from './components/pages/LandingPage';
import IntermediatePage from './components/pages/IntermediatePage';
import TutorialsPage from './components/pages/TutorialsPage';
import DocsPage from './components/pages/DocsPage';
import { isFirstVisit, markVisited } from './utils/session';
import { api } from './lib/api';
import { log } from './lib/logger';
import LessonPage from './components/pages/LessonPage';
import InstallPage from './components/pages/InstallPage';
import BackgroundAnimationPage from './components/pages/BackgroundAnimationPage';

// Loading screen colors - uses tskit theme colors as defaults since this renders
// before ColorThemeProvider mounts. These match the tskit theme in ColorThemeContext.tsx
const LOADING_SCREEN_COLORS = {
  background: '#03303E',       // tskit.background
  accent: '#14E2A8',           // tskit.accentPrimary
  logBackground: 'rgba(0, 0, 0, 0.3)', // dark overlay
  logText: 'rgba(255, 255, 255, 0.8)', // light text
};

// Loading screen component - renders before theme context is available
function LoadingScreen({ logs }: { logs: string[] }) {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ backgroundColor: LOADING_SCREEN_COLORS.background }}
    >
      <div className="text-2xl mb-8" style={{ color: LOADING_SCREEN_COLORS.accent }}>
        Starting ARGscape...
      </div>
      <div
        className="w-96 h-64 rounded-lg p-4 overflow-auto font-mono text-sm"
        style={{ backgroundColor: LOADING_SCREEN_COLORS.logBackground }}
      >
        {logs.map((log, i) => (
          <div key={i} style={{ color: LOADING_SCREEN_COLORS.logText }}>{log}</div>
        ))}
      </div>
    </div>
  );
}

// Layout component that includes the footer
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main>
        {children}
      </main>
      <Footer />
    </>
  );
}

type AppState = 'intro' | 'transitioning' | 'landing' | 'intermediate';
type SelectedOption = 'upload' | 'simulate' | 'load' | null;

function Home() {
  const { colors } = useColorTheme();
  const location = useLocation();
  const [appState, setAppState] = useState<AppState>('intro');
  const [selectedOption, setSelectedOption] = useState<SelectedOption>(null);
  const [showIntro, setShowIntro] = useState(false);
  const [availableTreeSequences, setAvailableTreeSequences] = useState<string[]>([]);
  const [hasCheckedSequences, setHasCheckedSequences] = useState(false);

  // Fetch available tree sequences to determine animation behavior
  useEffect(() => {
    // AbortController for cleanup on unmount
    const abortController = new AbortController();
    const { signal } = abortController;

    const fetchAvailableTreeSequences = async () => {
      try {
        if (signal.aborted) return;
        log.data.processing('fetch-available-tree-sequences', 'Home');
        const response = await api.getUploadedFiles();

        // Check if aborted before updating state
        if (signal.aborted) return;

        const data = response.data as { uploaded_tree_sequences: string[] };
        setAvailableTreeSequences(data.uploaded_tree_sequences || []);
        log.info(`Found ${data.uploaded_tree_sequences?.length || 0} available tree sequences for animation logic`, {
          component: 'Home'
        });
      } catch (error) {
        // Don't log errors if aborted
        if (signal.aborted) return;

        log.error('Failed to fetch available tree sequences', {
          component: 'Home',
          error: error instanceof Error ? error : new Error(String(error))
        });
        setAvailableTreeSequences([]);
      } finally {
        if (!signal.aborted) {
          setHasCheckedSequences(true);
        }
      }
    };

    // Only fetch if we haven't checked yet
    if (!hasCheckedSequences) {
      fetchAvailableTreeSequences();
    }

    return () => {
      abortController.abort();
    };
  }, [hasCheckedSequences]);

  useEffect(() => {
    // Wait until we've checked for available sequences before deciding on animation
    if (!hasCheckedSequences) return;

    // Check if we're coming from an internal navigation (state will be present)
    const isInternalNavigation = location.state?.fromInternal;
    const fromResult = location.state?.fromResult;
    const selectedOptionFromResult = location.state?.selectedOption;
    const forceIntro = location.state?.forceIntro;
    
    // Check if we're navigating to a specific option via URL
    const pathOption = location.pathname === '/upload' ? 'upload' : 
                      location.pathname === '/simulate' ? 'simulate' : 
                      location.pathname === '/load' ? 'load' : null;
    
    // Determine if we should show intro based on the new rules
    // NOTE: Intro animation temporarily disabled - kept for future use
    const shouldShowIntro = () => {
      // Temporarily disabled - always skip intro animation
      return false;

      /* Original logic preserved for future use:
      // If we're navigating to a specific option, don't show intro
      if (pathOption) return false;

      // If tree sequences are available (1+), never show animation
      if (availableTreeSequences.length > 0) {
        return false;
      }

      // If no tree sequences available (0), show animation except for internal back buttons
      if (fromResult && selectedOptionFromResult) {
        return false; // This is from result page back button
      } else if (isInternalNavigation) {
        return false; // This is from internal back button
      } else if (forceIntro) {
        return true; // Logo click when no sequences
      } else if (isFirstVisit()) {
        return true; // First visit when no sequences
      } else {
        return true; // Direct browser access when no sequences
      }
      */
    };
    
    if (pathOption) {
      // Direct navigation to a specific option
      setSelectedOption(pathOption);
      setAppState('intermediate');
      setShowIntro(false);
    } else if (fromResult && selectedOptionFromResult) {
      // Coming back from result page with a specific option to restore
      setSelectedOption(selectedOptionFromResult);
      setAppState('intermediate');
      setShowIntro(false);
    } else if (shouldShowIntro()) {
      // Show intro animation
      setShowIntro(true);
      setAppState('intro');
      setSelectedOption(null);
      markVisited();
    } else {
      // Skip intro and go to landing
      setAppState('landing');
      setShowIntro(false);
      setSelectedOption(null);
    }
  }, [location.pathname, location.state, hasCheckedSequences, availableTreeSequences.length]);

  const handleIntroComplete = () => {
    setAppState('transitioning');
    
    // After transition completes, show landing page
    setTimeout(() => {
      setAppState('landing');
      setShowIntro(false);
    }, 2000); // 2 second transition duration
  };

  const handleOptionSelect = (option: 'upload' | 'simulate' | 'load') => {
    setSelectedOption(option);
    setAppState('intermediate');
  };

  const handleBackToLanding = () => {
    setSelectedOption(null);
    setAppState('landing');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      {/* Show intro animation */}
      {showIntro && appState === 'intro' && (
        <IntroAnimation onComplete={handleIntroComplete} />
      )}

      {/* Show smooth transition */}
      {appState === 'transitioning' && (
        <div className="relative min-h-screen">
          <IntroAnimation 
            onComplete={handleIntroComplete} 
            isTransitioning={true}
          />
          <LandingPage 
            onOptionSelect={handleOptionSelect} 
            isTransitioning={true}
          />
        </div>
      )}

      {/* Show landing page */}
      {appState === 'landing' && (
        <LandingPage onOptionSelect={handleOptionSelect} />
      )}

      {/* Show intermediate page */}
      {appState === 'intermediate' && selectedOption && (
        <IntermediatePage selectedOption={selectedOption} onBack={handleBackToLanding} />
      )}
    </div>
  );
}

function App() {
  const [isBackendReady, setIsBackendReady] = useState(false);
  const [startupLogs, setStartupLogs] = useState<string[]>([]);

  useEffect(() => {
    // AbortController to cancel operations on unmount
    const abortController = new AbortController();
    const { signal } = abortController;

    const checkBackendHealth = async () => {
      try {
        // Check if aborted before making request
        if (signal.aborted) return false;

        const response = await api.checkHealth();

        // Check if aborted before updating state
        if (signal.aborted) return false;

        // Check if we have a valid response with status
        if (!response?.data) {
          setStartupLogs(prev => [...prev, '⚠️ Invalid response from backend']);
          return false;
        }

        if (response.data.status === 'healthy') {
          setStartupLogs(prev => [...prev, '✅ Backend is ready']);
          setIsBackendReady(true);
          return true;
        }

        // Log the actual response for debugging
        setStartupLogs(prev => [...prev, `⚠️ Backend not ready: ${JSON.stringify(response.data)}`]);
      } catch (error) {
        // Don't log errors if aborted
        if (signal.aborted) return false;

        setStartupLogs(prev => [...prev, `⚠️ Failed to connect to backend: ${error instanceof Error ? error.message : 'Unknown error'}`]);
      }
      return false;
    };

    const startupSequence = async () => {
      if (signal.aborted) return;
      setStartupLogs(prev => [...prev, '🚀 Starting ARGscape...']);

      // Try to connect to backend with timeout
      const startTime = Date.now();
      const timeout = 30000; // 30 seconds

      while (Date.now() - startTime < timeout && !signal.aborted) {
        if (await checkBackendHealth()) {
          return;
        }
        if (signal.aborted) return;
        setStartupLogs(prev => [...prev, '⏳ Waiting for backend to start...']);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (!signal.aborted) {
        setStartupLogs(prev => [...prev, '❌ Backend failed to start within timeout period']);
      }
    };

    startupSequence();

    return () => {
      abortController.abort();
    };
  }, []);

  if (!isBackendReady) {
    return <LoadingScreen logs={startupLogs} />;
  }

  return (
    <ColorThemeProvider>
      <UIPreferencesProvider>
        <TreeSequenceProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/upload" element={<Home />} />
              <Route path="/simulate" element={<Home />} />
              <Route path="/load" element={<Home />} />
              <Route path="/install" element={<Layout><InstallPage /></Layout>} />
              <Route path="/background-animation" element={<BackgroundAnimationPage />} />
              <Route path="/graph/:filename" element={<ArgVisualizationPage />} />
              <Route path="/spatial/:filename" element={<SpatialArg3DVisualizationPage />} />
              <Route path="/spatial-diff/:filename" element={<SpatialArgDiffVisualizationPage />} />
              <Route path="/result" element={<ResultPage />} />
              <Route path="/tutorials" element={<Layout><TutorialsPage /></Layout>} />
              <Route path="/tutorials/:lessonId" element={<Layout><LessonPage /></Layout>} />
              <Route path="/docs" element={<Layout><DocsPage /></Layout>} />
            </Routes>
          </Router>
        </TreeSequenceProvider>
      </UIPreferencesProvider>
    </ColorThemeProvider>
  );
}

export default App;
