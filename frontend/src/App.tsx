import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
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
import { isFirstVisit, markVisited } from './utils/session';
import { api } from './lib/api';
import { log } from './lib/logger';

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
  const [isTransitioning, setIsTransitioning] = useState(false);
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
    
    // Determine if we should show intro based on the new rules
    const shouldShowIntro = () => {
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
    
    if (fromResult && selectedOptionFromResult) {
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
  }, [location.state, hasCheckedSequences, availableTreeSequences.length]);

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
  return (
    <ColorThemeProvider>
      <TreeSequenceProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Layout><Home /></Layout>} />
            <Route path="/result" element={<Layout><ResultPage /></Layout>} />
            <Route path="/visualize/:filename" element={<Layout><ArgVisualizationPage /></Layout>} />
            <Route path="/visualize-spatial/:filename" element={<Layout><SpatialArg3DVisualizationPage /></Layout>} />
            <Route path="/visualize-spatial-diff/:filename" element={<Layout><SpatialArgDiffVisualizationPage /></Layout>} />
          </Routes>
        </Router>
      </TreeSequenceProvider>
    </ColorThemeProvider>
  );
}

export default App;
