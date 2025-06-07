import { useEffect, useState } from 'react';

interface IntroAnimationProps {
  onComplete: () => void;
}

// Genealogy branching lines component
function GenealogyLines() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Background branching lines that animate in */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 800">
        {/* Central trunk - now flows downward */}
        <line 
          x1="600" y1="0" x2="600" y2="400"
          stroke="rgba(134, 239, 172, 0.15)"
          strokeWidth="3"
          className="animate-[drawLine_1s_ease-out_0.1s_both]"
        />
        
        {/* Primary branches - spreading downward */}
        <line 
          x1="600" y1="400" x2="450" y2="500"
          stroke="rgba(134, 239, 172, 0.12)"
          strokeWidth="2"
          className="animate-[drawLine_0.8s_ease-out_0.3s_both]"
        />
        <line 
          x1="600" y1="400" x2="750" y2="500"
          stroke="rgba(134, 239, 172, 0.12)"
          strokeWidth="2"
          className="animate-[drawLine_0.8s_ease-out_0.4s_both]"
        />
        
        {/* Secondary branches - tips at bottom */}
        <line 
          x1="450" y1="500" x2="350" y2="600"
          stroke="rgba(134, 239, 172, 0.08)"
          strokeWidth="1.5"
          className="animate-[drawLine_0.6s_ease-out_0.5s_both]"
        />
        <line 
          x1="450" y1="500" x2="500" y2="620"
          stroke="rgba(134, 239, 172, 0.08)"
          strokeWidth="1.5"
          className="animate-[drawLine_0.6s_ease-out_0.6s_both]"
        />
        <line 
          x1="750" y1="500" x2="700" y2="620"
          stroke="rgba(134, 239, 172, 0.08)"
          strokeWidth="1.5"
          className="animate-[drawLine_0.6s_ease-out_0.7s_both]"
        />
        <line 
          x1="750" y1="500" x2="850" y2="600"
          stroke="rgba(134, 239, 172, 0.08)"
          strokeWidth="1.5"
          className="animate-[drawLine_0.6s_ease-out_0.8s_both]"
        />
        
        {/* Recombination crossovers - positioned between branches */}
        <path 
          d="M 400 550 Q 500 570 600 550"
          stroke="rgba(134, 239, 172, 0.2)"
          strokeWidth="2"
          fill="none"
          strokeDasharray="4,4"
          className="animate-[drawPath_0.6s_ease-out_0.9s_both]"
        />
        <path 
          d="M 600 550 Q 700 570 800 550"
          stroke="rgba(134, 239, 172, 0.2)"
          strokeWidth="2"
          fill="none"
          strokeDasharray="4,4"
          className="animate-[drawPath_0.6s_ease-out_1s_both]"
        />
        
        {/* Terminal nodes - now at the bottom tips */}
        <circle cx="350" cy="600" r="4" fill="rgba(134, 239, 172, 0.3)" className="animate-[fadeInScale_0.4s_ease-out_1.1s_both]" />
        <circle cx="500" cy="620" r="4" fill="rgba(134, 239, 172, 0.3)" className="animate-[fadeInScale_0.4s_ease-out_1.2s_both]" />
        <circle cx="700" cy="620" r="4" fill="rgba(134, 239, 172, 0.3)" className="animate-[fadeInScale_0.4s_ease-out_1.3s_both]" />
        <circle cx="850" cy="600" r="4" fill="rgba(134, 239, 172, 0.3)" className="animate-[fadeInScale_0.4s_ease-out_1.4s_both]" />
      </svg>
    </div>
  );
}

export default function IntroAnimation({ onComplete }: IntroAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Start animation immediately
    setIsVisible(true);
    
    // Start exit animation after 2.2 seconds (faster)
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 2200);

    // Complete animation after 2.7 seconds
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2700);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <>
      {/* Custom keyframes for animations */}
      <style>{`
        @keyframes drawLine {
          from { stroke-dasharray: 1000; stroke-dashoffset: 1000; }
          to { stroke-dasharray: 1000; stroke-dashoffset: 0; }
        }
        @keyframes drawPath {
          from { stroke-dasharray: 200; stroke-dashoffset: 200; }
          to { stroke-dasharray: 200; stroke-dashoffset: 0; }
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
      
      <div className={`
        fixed inset-0 bg-sp-very-dark-blue flex items-center justify-center z-50
        transition-opacity duration-500
        ${isExiting ? 'opacity-0' : 'opacity-100'}
      `}>
        {/* Background genealogy lines */}
        <GenealogyLines />
        
        {/* Main content */}
        <div className={`
          transform transition-all duration-1000 ease-out relative z-10
          ${isVisible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}
        `}>
          <h1 className="text-[4rem] md:text-[6rem] font-extrabold tracking-tight text-center select-none" 
              style={{letterSpacing: '-0.04em'}}>
            <span className="text-white">ARG</span><span className="text-sp-pale-green">scape</span>
          </h1>
          <div className="mt-6 text-center">
            <div className="text-sp-pale-green text-lg md:text-xl font-bold">
              Visualizing Ancestral Recombination Graphs
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 