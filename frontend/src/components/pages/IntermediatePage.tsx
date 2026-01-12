import { useNavigate } from 'react-router-dom';
import Dropzone from '../home/Dropzone';
import TreeSequenceSimulator from '../home/TreeSequenceSimulator';
import TreeSequenceSelector from '../home/TreeSequenceSelector';
import { useState, useEffect } from 'react';
import { useTreeSequence } from '../../context/TreeSequenceContext';
import { VISUALIZATION_DEFAULTS, isRailway } from '../../config/constants';
import Navbar from '../layout/Navbar';
import ParticleBackground from '../ui/ParticleBackground';
import Footer from '../layout/Footer';
import { useElapsedTime, formatElapsedTime } from '../../hooks/useElapsedTime';

import { useThemeStyles } from '../../hooks/useThemeStyles';
import { useColorTheme } from '../../context/ColorThemeContext';

interface IntermediatePageProps {
  selectedOption: 'upload' | 'simulate' | 'load';
  onBack: () => void;
}

export default function IntermediatePage({ selectedOption, onBack: _onBack }: IntermediatePageProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [dots, setDots] = useState(0);
  const [showNodeLimitModal, setShowNodeLimitModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { setTreeSequence } = useTreeSequence();
  const elapsedSeconds = useElapsedTime(loading);
  const { pageStyle, glassPanelStyle } = useThemeStyles() as any; // Using existing hooks, expanding them
  // Manually grab colors from context just in case useThemeStyles return type isn't fully updated yet in TS
  const { colors: themeColors } = useColorTheme();

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
    console.log('[IntermediatePage] handleUploadComplete called with:', result);
    // Ensure loading is cleared before navigation
    setLoading(false);
    setTreeSequence(result);
    console.log('[IntermediatePage] Navigating to /result');
    navigate('/result', { state: { fromIntermediate: selectedOption } });
  };

  const handleTreeSequenceSelect = (treeSequence: any) => {
    setTreeSequence(treeSequence);
    navigate('/result', { state: { fromIntermediate: selectedOption } });
  };

  const handleSimulationComplete = (result: any) => {
    // Ensure loading is cleared before navigation
    setLoading(false);
    setTreeSequence(result);
    navigate('/result', { state: { fromIntermediate: selectedOption } });
  };

  const renderComponent = () => {
    if (loading) {
      const elapsedTime = formatElapsedTime(elapsedSeconds);
      const showElapsedTime = elapsedSeconds > 5; // Show elapsed time after 5 seconds
      const isLocal = !isRailway();
      
      return (
        <div className="flex flex-col items-center text-xl space-y-4" style={{ color: themeColors.text }}>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: themeColors.accentPrimary }}></div>
          <span>
            Processing{Array(dots + 1).join('.')}
          </span>
          {showElapsedTime && (
            <>
              <p className="text-sm mt-2" style={{ color: themeColors.textSecondary }}>
                Elapsed: {elapsedTime}
              </p>
              {isLocal && elapsedSeconds > 30 && (
                <p className="text-xs mt-2 max-w-md text-center px-4" style={{ color: themeColors.textSecondary }}>
                  Large files may take several minutes. Upload continues in the background...
                </p>
              )}
            </>
          )}
        </div>
      );
    }

    switch (selectedOption) {
      case 'upload':
        return <Dropzone 
          onUploadComplete={handleUploadComplete} 
          setLoading={setLoading}
          showNodeLimitModal={showNodeLimitModal}
          setShowNodeLimitModal={setShowNodeLimitModal}
          showErrorModal={showErrorModal}
          setShowErrorModal={setShowErrorModal}
          errorMessage={errorMessage}
          setErrorMessage={setErrorMessage}
        />;
      case 'simulate':
        return <TreeSequenceSimulator onSimulationComplete={handleSimulationComplete} setLoading={setLoading} />;
      case 'load':
        return <TreeSequenceSelector onSelect={handleTreeSequenceSelect} />;
      default:
        return null;
    }
  };

  return (
    <div style={pageStyle}>
      <ParticleBackground />
      <div className="min-h-screen flex flex-col relative z-10">
        <Navbar />
        <div className="flex-grow px-4 pt-24 pb-40">
          {/* Main content area */}
          <div className="max-w-7xl mx-auto">
            <div 
              style={glassPanelStyle}
              className="overflow-hidden"
            >
              <div className="p-8 min-h-[600px] flex items-start justify-center">
                {renderComponent()}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
} 