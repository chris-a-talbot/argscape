import { useNavigate } from 'react-router-dom';
import Dropzone from './Home/Dropzone';
import TreeSequenceSimulator from './Home/TreeSequenceSimulator';
import TreeSequenceSelector from './TreeSequenceSelector';
import { useState, useEffect } from 'react';
import { useTreeSequence } from '../context/TreeSequenceContext';
import { VISUALIZATION_DEFAULTS } from '../config/constants';
import ClickableLogo from './ui/ClickableLogo';
import Navbar from './ui/Navbar';

interface IntermediatePageProps {
  selectedOption: 'upload' | 'simulate' | 'load';
  onBack: () => void;
}

export default function IntermediatePage({ selectedOption, onBack }: IntermediatePageProps) {
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
    setTreeSequence(result);
    navigate('/result', { state: { fromIntermediate: selectedOption } });
  };

  const handleTreeSequenceSelect = (treeSequence: any) => {
    setTreeSequence(treeSequence);
    navigate('/result', { state: { fromIntermediate: selectedOption } });
  };

  const handleSimulationComplete = (result: any) => {
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

  const getDescription = () => {
    switch (selectedOption) {
      case 'upload':
        return 'Upload your own .trees file to visualize';
      case 'simulate':
        return 'Generate new data using msprime simulation';
      case 'load':
        return 'Choose from existing uploaded sequences';
      default:
        return '';
    }
  };

  const renderComponent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center text-xl text-sp-white space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sp-pale-green"></div>
          <span>
            Processing{Array(dots + 1).join('.')}
          </span>
        </div>
      );
    }

    switch (selectedOption) {
      case 'upload':
        return <Dropzone onUploadComplete={handleUploadComplete} setLoading={setLoading} />;
      case 'simulate':
        return <TreeSequenceSimulator onSimulationComplete={handleSimulationComplete} setLoading={setLoading} />;
      case 'load':
        return <TreeSequenceSelector onSelect={handleTreeSequenceSelect} />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-sp-very-dark-blue text-sp-white min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow px-4 pt-24 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{getTitle()}</h1>
            <p className="text-sp-white/70 text-lg">{getDescription()}</p>
          </div>
        </div>

        {/* Main content area */}
        <div className="max-w-7xl mx-auto">
          <div className="bg-sp-very-dark-blue rounded-2xl shadow-xl border border-sp-dark-blue overflow-hidden">
            <div className="p-8 min-h-[600px] flex items-start justify-center">
              {renderComponent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 