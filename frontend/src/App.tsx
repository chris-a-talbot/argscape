import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Dropzone from './components/Home/Dropzone';
import ResultPage from './components/ResultPage';
import ArgVisualizationPage from './components/ArgVisualizationPage';
import Footer from './components/Footer';
import TreeSequenceSelector from './components/TreeSequenceSelector';
import TreeSequenceSimulator from './components/Home/TreeSequenceSimulator';
import { useState, useEffect } from 'react';
import { TreeSequenceProvider, useTreeSequence } from './context/TreeSequenceContext';
import { ColorThemeProvider } from './context/ColorThemeContext';
import SpatialArg3DVisualizationPage from './components/SpatialArg3DVisualizationPage';
import { log } from './lib/logger';
import { VISUALIZATION_DEFAULTS } from './config/constants';

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

function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [dots, setDots] = useState(0);
  const { setTreeSequence } = useTreeSequence();

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setDots((prevDots) => (prevDots + 1) % 4);
      }, VISUALIZATION_DEFAULTS.LOADING_DOTS_INTERVAL);
      return () => clearInterval(interval);
    } else {
      setDots(0);
    }
  }, [loading]);

  const handleUploadComplete = (result: any) => {
    log.user.action('upload-complete', { result }, 'Home');
    setTreeSequence(result);
    log.nav('home', 'result');
    navigate('/result');
  };

  const handleTreeSequenceSelect = (treeSequence: any) => {
    log.user.action('tree-sequence-select', { treeSequence }, 'Home');
    setTreeSequence(treeSequence);
    log.nav('home', 'result');
    navigate('/result');
  };

  const handleSimulationComplete = (result: any) => {
    log.user.action('simulation-complete', { result }, 'Home');
    setTreeSequence(result);
    log.nav('home', 'result');
    navigate('/result');
  };

    return (
    <div className="bg-sp-very-dark-blue text-sp-white flex flex-col items-center px-4 pt-8 pb-20 font-sans min-h-screen">
      {/* Title - Smaller and more compact */}
      <h1 className="text-[3rem] md:text-[4rem] font-extrabold mb-6 tracking-tight text-center select-none" style={{letterSpacing: '-0.04em'}}>
        ARG<span className="text-sp-pale-green">scape</span>
      </h1>
      
      {/* Disclaimer - More compact design */}
      <div className="bg-amber-900/15 border border-amber-700/25 rounded-lg p-3 mb-8 max-w-4xl mx-auto">
        <p className="text-amber-200 text-xs md:text-sm text-center leading-relaxed">
          <span className="font-semibold">⚠️ Beta Notice:</span> Tree sequences are stored on a secure server for up to 24 hours. 
          This is a beta application and data may be wiped during updates. Please download your results and respect our limited resources.
          Clear files after use.
        </p>
      </div>
      
      {/* Main content */}
      {loading ? (
        <div className="flex flex-col items-center text-xl text-sp-white space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sp-pale-green"></div>
          <span>
            Processing{Array(dots + 1).join('.')}
          </span>
        </div>
      ) : (
        <div className="w-full max-w-7xl">
          {/* Desktop: Three columns side by side with max-width constraints */}
          <div className="hidden lg:flex items-stretch bg-transparent rounded-2xl shadow-xl overflow-hidden border border-sp-dark-blue">
            {/* Left: File Upload - max 1/4 width */}
            <div className="flex-1 max-w-[25%] flex flex-col p-6 bg-sp-very-dark-blue min-h-[500px]">
              <h2 className="text-xl font-bold mb-4 text-sp-white">Upload a file</h2>
              <div className="flex-1 flex items-center justify-center">
                <Dropzone onUploadComplete={handleUploadComplete} setLoading={setLoading} />
              </div>
            </div>
            {/* Divider */}
            <div className="w-px bg-sp-dark-blue" />
            {/* Center: Simulate Tree Sequence - max 1/2 width */}
            <div className="flex-1 max-w-[50%] flex flex-col p-6 bg-sp-very-dark-blue min-h-[500px]">
              <h2 className="text-xl font-bold mb-4 text-sp-white">Simulate new (msprime)</h2>
              <div className="flex-1 overflow-y-auto pr-2">
                <TreeSequenceSimulator onSimulationComplete={handleSimulationComplete} setLoading={setLoading} />
              </div>
            </div>
            {/* Divider */}
            <div className="w-px bg-sp-dark-blue" />
            {/* Right: Existing Tree Sequences - max 1/3 width */}
            <div className="flex-1 max-w-[33.333%] flex flex-col p-6 bg-sp-very-dark-blue min-h-[500px]">
              <h2 className="text-xl font-bold mb-4 text-sp-white">Load existing</h2>
              <div className="flex-1 overflow-y-auto pr-2">
                <TreeSequenceSelector onSelect={handleTreeSequenceSelect} />
              </div>
            </div>
          </div>
          
          {/* Mobile/Tablet: Stacked cards */}
          <div className="lg:hidden space-y-6">
            {/* File Upload Card */}
            <div className="bg-sp-very-dark-blue rounded-xl border border-sp-dark-blue p-6">
              <h2 className="text-xl font-bold mb-4 text-sp-white">Upload a file</h2>
              <Dropzone onUploadComplete={handleUploadComplete} setLoading={setLoading} />
            </div>
            
            {/* Simulate Card */}
            <div className="bg-sp-very-dark-blue rounded-xl border border-sp-dark-blue p-6">
              <h2 className="text-xl font-bold mb-4 text-sp-white">Simulate new (msprime)</h2>
              <TreeSequenceSimulator onSimulationComplete={handleSimulationComplete} setLoading={setLoading} />
            </div>
            
            {/* Load Existing Card */}
            <div className="bg-sp-very-dark-blue rounded-xl border border-sp-dark-blue p-6">
              <h2 className="text-xl font-bold mb-4 text-sp-white">Load existing</h2>
              <TreeSequenceSelector onSelect={handleTreeSequenceSelect} />
            </div>
          </div>
        </div>
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
          </Routes>
        </Router>
      </TreeSequenceProvider>
    </ColorThemeProvider>
  );
}

export default App;
