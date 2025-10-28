import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import ResultPage from './components/ResultPage';
import ArgVisualizationPage from './components/ArgVisualizationPage';
import Footer from './components/Footer';
import { useState, useEffect } from 'react';
import { TreeSequenceProvider } from './context/TreeSequenceContext';
import { ColorThemeProvider } from './context/ColorThemeContext';
import SpatialArg3DVisualizationPage from './components/SpatialArg3DVisualizationPage';
import SpatialArgDiffVisualizationPage from './components/SpatialArgDiffVisualizationPage';
import IntroAnimation from './components/IntroAnimation';
import LandingPage from './components/LandingPage';
import IntermediatePage from './components/IntermediatePage';
import TutorialsPage from './components/TutorialsPage';
import DocsPage from './components/DocsPage';
import { isFirstVisit, markVisited } from './utils/session';
import { api } from './lib/api';
import { log } from './lib/logger';
import LessonPage from './components/LessonPage';
import InstallPage from './components/InstallPage';
import BackgroundAnimationPage from './components/BackgroundAnimationPage';

// Loading screen component
function LoadingScreen({ logs }: { logs: string[] }) {
  return (
    <div className="fixed inset-0 bg-sp-very-dark-blue flex flex-col items-center justify-center">
      <div className="text-sp-pale-green text-2xl mb-8">Starting ARGscape...</div>
      <div className="w-96 h-64 bg-black/30 rounded-lg p-4 overflow-auto font-mono text-sm">
        {logs.map((log, i) => (
          <div key={i} className="text-sp-white/80">{log}</div>
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
  const location = useLocation();
  const [appState, setAppState] = useState<AppState>('intro');
  const [selectedOption, setSelectedOption] = useState<SelectedOption>(null);
  const [showIntro, setShowIntro] = useState(false);
  const [availableTreeSequences, setAvailableTreeSequences] = useState<string[]>([]);
  const [hasCheckedSequences, setHasCheckedSequences] = useState(false);
  const [transitionStarted, setTransitionStarted] = useState(false);

  // Fetch available tree sequences to determine animation behavior
  useEffect(() => {
    const fetchAvailableTreeSequences = async () => {
      try {
        log.data.processing('fetch-available-tree-sequences', 'Home');
        const response = await api.getUploadedFiles();
        const data = response.data as { uploaded_tree_sequences: string[] };
        setAvailableTreeSequences(data.uploaded_tree_sequences || []);
        log.info(`Found ${data.uploaded_tree_sequences?.length || 0} available tree sequences for animation logic`, {
          component: 'Home'
        });
      } catch (error) {
        log.error('Failed to fetch available tree sequences', {
          component: 'Home',
          error: error instanceof Error ? error : new Error(String(error))
        });
        setAvailableTreeSequences([]);
      } finally {
        setHasCheckedSequences(true);
      }
    };

    // Only fetch if we haven't checked yet
    if (!hasCheckedSequences) {
      fetchAvailableTreeSequences();
    }
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
    const shouldShowIntro = () => {
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
    setTransitionStarted(true);
    setAppState('transitioning');
    
    // After transition completes, show landing page
    setTimeout(() => {
      setAppState('landing');
      setShowIntro(false);
      setTransitionStarted(false);
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
    <div className="bg-sp-very-dark-blue min-h-screen">
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
    const checkBackendHealth = async () => {
      try {
        const response = await api.checkHealth();
        console.log('Health check response:', response);
        
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
        console.error('Health check error:', error);
        setStartupLogs(prev => [...prev, `⚠️ Failed to connect to backend: ${error instanceof Error ? error.message : 'Unknown error'}`]);
      }
      return false;
    };

    const startupSequence = async () => {
      setStartupLogs(prev => [...prev, '🚀 Starting ARGscape...']);
      
      // Try to connect to backend with timeout
      const startTime = Date.now();
      const timeout = 30000; // 30 seconds
      
      while (Date.now() - startTime < timeout) {
        if (await checkBackendHealth()) {
          return;
        }
        setStartupLogs(prev => [...prev, '⏳ Waiting for backend to start...']);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      setStartupLogs(prev => [...prev, '❌ Backend failed to start within timeout period']);
    };

    startupSequence();
  }, []);

  if (!isBackendReady) {
    return <LoadingScreen logs={startupLogs} />;
  }

  return (
    <ColorThemeProvider>
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
    </ColorThemeProvider>
  );
}

export default App;
