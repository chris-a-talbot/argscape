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

interface IntermediatePageProps {
  selectedOption: 'upload' | 'simulate' | 'load';
  onBack: () => void;
}

export default function IntermediatePage({ selectedOption, onBack }: IntermediatePageProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [dots, setDots] = useState(0);
  const [showNodeLimitModal, setShowNodeLimitModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { setTreeSequence } = useTreeSequence();
  const elapsedSeconds = useElapsedTime(loading);

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

  const getTitle = () => {
    switch (selectedOption) {
      case 'upload':
        return 'Upload a Tree Sequence';
      case 'simulate':
        return 'Simulate a Tree Sequence';
      case 'load':
        return 'Load a Tree Sequence';
      default:
        return '';
    }
  };

  const renderComponent = () => {
    if (loading) {
      const elapsedTime = formatElapsedTime(elapsedSeconds);
      const showElapsedTime = elapsedSeconds > 5; // Show elapsed time after 5 seconds
      const isLocal = !isRailway();
      
      return (
        <div className="flex flex-col items-center text-xl text-sp-white space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sp-pale-green"></div>
          <span>
            Processing{Array(dots + 1).join('.')}
          </span>
          {showElapsedTime && (
            <>
              <p className="text-sm text-sp-white/80 mt-2">
                Elapsed: {elapsedTime}
              </p>
              {isLocal && elapsedSeconds > 30 && (
                <p className="text-xs text-sp-white/70 mt-2 max-w-md text-center px-4">
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
    <div className="min-h-screen bg-sp-very-dark-blue relative">
      <ParticleBackground />
      <div className="text-sp-white min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow px-4 pt-24 pb-40">
          {/* Header with title */}
          <div className="max-w-7xl mx-auto mb-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{getTitle()}</h1>
            </div>
          </div>

          {/* Main content area */}
          <div className="max-w-7xl mx-auto">
            <div className="bg-sp-very-dark-blue/95 backdrop-blur-sm rounded-2xl shadow-xl border border-sp-dark-blue overflow-hidden">
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