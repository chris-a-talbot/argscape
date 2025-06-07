import { useEffect, useState } from 'react';

interface IntroAnimationProps {
  onComplete: () => void;
  isTransitioning?: boolean;
}

// Tree sequence visualization - 3 local genealogical trees
function TreeSequenceVisualization() {
  return (
    <div className="absolute top-0 left-0 w-full h-1/2 overflow-hidden pointer-events-none">
      {/* Tree sequence with 3 larger local trees */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 400">
        
        {/* Tree 1 - Original topology (larger, repositioned, slower) */}
        <g className="animate-[fadeIn_0.8s_ease-out_0.3s_both]">
          {/* Tree 1 branches */}
          <line x1="200" y1="30" x2="200" y2="90" stroke="rgba(134, 239, 172, 0.15)" strokeWidth="4" className="animate-[drawLine_0.7s_ease-out_0.4s_both]" />
          <line x1="200" y1="90" x2="140" y2="150" stroke="rgba(134, 239, 172, 0.13)" strokeWidth="3.5" className="animate-[drawLine_0.6s_ease-out_0.5s_both]" />
          <line x1="200" y1="90" x2="260" y2="150" stroke="rgba(134, 239, 172, 0.13)" strokeWidth="3.5" className="animate-[drawLine_0.6s_ease-out_0.55s_both]" />
          <line x1="140" y1="150" x2="100" y2="210" stroke="rgba(134, 239, 172, 0.11)" strokeWidth="3" className="animate-[drawLine_0.5s_ease-out_0.6s_both]" />
          <line x1="140" y1="150" x2="180" y2="210" stroke="rgba(134, 239, 172, 0.11)" strokeWidth="3" className="animate-[drawLine_0.5s_ease-out_0.65s_both]" />
          <line x1="260" y1="150" x2="220" y2="210" stroke="rgba(134, 239, 172, 0.11)" strokeWidth="3" className="animate-[drawLine_0.5s_ease-out_0.7s_both]" />
          <line x1="260" y1="150" x2="300" y2="210" stroke="rgba(134, 239, 172, 0.11)" strokeWidth="3" className="animate-[drawLine_0.5s_ease-out_0.75s_both]" />
          
          {/* Tree 1 coalescence nodes */}
          <circle cx="200" cy="90" r="5" fill="rgba(134, 239, 172, 0.35)" className="animate-[fadeInScale_0.3s_ease-out_0.8s_both]" />
          <circle cx="140" cy="150" r="4" fill="rgba(134, 239, 172, 0.3)" className="animate-[fadeInScale_0.3s_ease-out_0.85s_both]" />
          <circle cx="260" cy="150" r="4" fill="rgba(134, 239, 172, 0.3)" className="animate-[fadeInScale_0.3s_ease-out_0.9s_both]" />
        </g>
        
        {/* Tree 2 - Modified topology after recombination (overlapping timing, slower) */}
        <g className="animate-[fadeIn_0.8s_ease-out_0.7s_both]">
          {/* Tree 2 branches - different topology */}
          <line x1="600" y1="30" x2="600" y2="90" stroke="rgba(134, 239, 172, 0.15)" strokeWidth="4" className="animate-[drawLine_0.7s_ease-out_0.8s_both]" />
          <line x1="600" y1="90" x2="540" y2="150" stroke="rgba(134, 239, 172, 0.13)" strokeWidth="3.5" className="animate-[drawLine_0.6s_ease-out_0.9s_both]" />
          <line x1="600" y1="90" x2="660" y2="150" stroke="rgba(134, 239, 172, 0.13)" strokeWidth="3.5" className="animate-[drawLine_0.6s_ease-out_0.95s_both]" />
          <line x1="540" y1="150" x2="500" y2="210" stroke="rgba(134, 239, 172, 0.11)" strokeWidth="3" className="animate-[drawLine_0.5s_ease-out_1s_both]" />
          <line x1="540" y1="150" x2="580" y2="210" stroke="rgba(134, 239, 172, 0.11)" strokeWidth="3" className="animate-[drawLine_0.5s_ease-out_1.05s_both]" />
          <line x1="660" y1="150" x2="620" y2="210" stroke="rgba(134, 239, 172, 0.11)" strokeWidth="3" className="animate-[drawLine_0.5s_ease-out_1.1s_both]" />
          <line x1="660" y1="150" x2="700" y2="210" stroke="rgba(134, 239, 172, 0.11)" strokeWidth="3" className="animate-[drawLine_0.5s_ease-out_1.15s_both]" />
          
          {/* Tree 2 coalescence nodes */}
          <circle cx="600" cy="90" r="5" fill="rgba(134, 239, 172, 0.35)" className="animate-[fadeInScale_0.3s_ease-out_1.2s_both]" />
          <circle cx="540" cy="150" r="4" fill="rgba(134, 239, 172, 0.3)" className="animate-[fadeInScale_0.3s_ease-out_1.25s_both]" />
          <circle cx="660" cy="150" r="4" fill="rgba(134, 239, 172, 0.3)" className="animate-[fadeInScale_0.3s_ease-out_1.3s_both]" />
        </g>
        
        {/* Tree 3 - Further modified topology (overlapping timing, slower) */}
        <g className="animate-[fadeIn_0.8s_ease-out_1.1s_both]">
          {/* Tree 3 branches - another topology change */}
          <line x1="1000" y1="30" x2="1000" y2="90" stroke="rgba(134, 239, 172, 0.15)" strokeWidth="4" className="animate-[drawLine_0.7s_ease-out_1.2s_both]" />
          <line x1="1000" y1="90" x2="940" y2="150" stroke="rgba(134, 239, 172, 0.13)" strokeWidth="3.5" className="animate-[drawLine_0.6s_ease-out_1.3s_both]" />
          <line x1="1000" y1="90" x2="1060" y2="150" stroke="rgba(134, 239, 172, 0.13)" strokeWidth="3.5" className="animate-[drawLine_0.6s_ease-out_1.35s_both]" />
          <line x1="940" y1="150" x2="900" y2="210" stroke="rgba(134, 239, 172, 0.11)" strokeWidth="3" className="animate-[drawLine_0.5s_ease-out_1.4s_both]" />
          <line x1="940" y1="150" x2="980" y2="210" stroke="rgba(134, 239, 172, 0.11)" strokeWidth="3" className="animate-[drawLine_0.5s_ease-out_1.45s_both]" />
          <line x1="1060" y1="150" x2="1020" y2="210" stroke="rgba(134, 239, 172, 0.11)" strokeWidth="3" className="animate-[drawLine_0.5s_ease-out_1.5s_both]" />
          <line x1="1060" y1="150" x2="1100" y2="210" stroke="rgba(134, 239, 172, 0.11)" strokeWidth="3" className="animate-[drawLine_0.5s_ease-out_1.55s_both]" />
          
          {/* Tree 3 coalescence nodes */}
          <circle cx="1000" cy="90" r="5" fill="rgba(134, 239, 172, 0.35)" className="animate-[fadeInScale_0.3s_ease-out_1.6s_both]" />
          <circle cx="940" cy="150" r="4" fill="rgba(134, 239, 172, 0.3)" className="animate-[fadeInScale_0.3s_ease-out_1.65s_both]" />
          <circle cx="1060" cy="150" r="4" fill="rgba(134, 239, 172, 0.3)" className="animate-[fadeInScale_0.3s_ease-out_1.7s_both]" />
        </g>
        
        {/* Sample sequences - consistent across all trees */}
        <g className="animate-[fadeIn_0.6s_ease-out_1.5s_both]">
          {/* Sample nodes */}
          <circle cx="100" cy="210" r="5" fill="rgba(134, 239, 172, 0.8)" className="animate-[fadeIn_0.4s_ease-out_1.7s_both]" />
          <circle cx="180" cy="210" r="5" fill="rgba(134, 239, 172, 0.8)" className="animate-[fadeIn_0.4s_ease-out_1.75s_both]" />
          <circle cx="220" cy="210" r="5" fill="rgba(134, 239, 172, 0.8)" className="animate-[fadeIn_0.4s_ease-out_1.8s_both]" />
          <circle cx="300" cy="210" r="5" fill="rgba(134, 239, 172, 0.8)" className="animate-[fadeIn_0.4s_ease-out_1.85s_both]" />
          
          <circle cx="500" cy="210" r="5" fill="rgba(134, 239, 172, 0.8)" className="animate-[fadeIn_0.4s_ease-out_1.9s_both]" />
          <circle cx="580" cy="210" r="5" fill="rgba(134, 239, 172, 0.8)" className="animate-[fadeIn_0.4s_ease-out_1.95s_both]" />
          <circle cx="620" cy="210" r="5" fill="rgba(134, 239, 172, 0.8)" className="animate-[fadeIn_0.4s_ease-out_2s_both]" />
          <circle cx="700" cy="210" r="5" fill="rgba(134, 239, 172, 0.8)" className="animate-[fadeIn_0.4s_ease-out_2.05s_both]" />
          
          <circle cx="900" cy="210" r="5" fill="rgba(134, 239, 172, 0.8)" className="animate-[fadeIn_0.4s_ease-out_2.1s_both]" />
          <circle cx="980" cy="210" r="5" fill="rgba(134, 239, 172, 0.8)" className="animate-[fadeIn_0.4s_ease-out_2.15s_both]" />
          <circle cx="1020" cy="210" r="5" fill="rgba(134, 239, 172, 0.8)" className="animate-[fadeIn_0.4s_ease-out_2.2s_both]" />
          <circle cx="1100" cy="210" r="5" fill="rgba(134, 239, 172, 0.8)" className="animate-[fadeIn_0.4s_ease-out_2.25s_both]" />
        </g>
        
        {/* Recombination breakpoints between trees */}
        <g className="animate-[fadeIn_0.6s_ease-out_2.3s_both]">
          <line x1="400" y1="20" x2="400" y2="230" stroke="rgba(255, 182, 193, 0.4)" strokeWidth="3" strokeDasharray="10,10" />
          <line x1="800" y1="20" x2="800" y2="230" stroke="rgba(255, 182, 193, 0.4)" strokeWidth="3" strokeDasharray="10,10" />
        </g>
      </svg>
    </div>
  );
}

export default function IntroAnimation({ onComplete, isTransitioning = false }: IntroAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (isTransitioning) {
      // In transition mode, start fading out immediately
      setIsVisible(true);
      setIsExiting(true);
      return;
    }
    
    // Normal intro mode
    setIsVisible(true);
    
    // Start exit animation
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 2300);

    // Complete animation
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2600);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete, isTransitioning]);

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
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
      
      <div className={`
        ${isTransitioning ? 'absolute' : 'fixed'} inset-0 bg-sp-very-dark-blue flex items-center justify-center z-50
        transition-all duration-2000 ease-in-out
        ${isExiting ? 'opacity-0' : 'opacity-100'}
      `}>
        {/* Background tree sequence visualization - fade out during transition */}
        <div className={`
          transition-opacity duration-1000 ease-in-out
          ${isTransitioning ? 'opacity-0' : 'opacity-100'}
        `}>
          <TreeSequenceVisualization />
        </div>
        
        {/* Main content - shrink and move up during transition */}
        <div className={`
          transform transition-all duration-2000 ease-in-out relative z-10
          ${isTransitioning 
            ? 'scale-50 -translate-y-32' 
            : isVisible 
              ? 'scale-100 opacity-100' 
              : 'scale-75 opacity-0'
          }
        `}>
          <h1 className="text-[6rem] md:text-[8rem] lg:text-[10rem] font-extrabold tracking-tight text-center select-none" 
              style={{letterSpacing: '-0.04em'}}>
            <span className="text-white">ARG</span><span className="text-sp-pale-green">scape</span>
          </h1>
          <div className={`
            mt-8 text-center transition-opacity duration-1000 ease-in-out
            ${isTransitioning ? 'opacity-0' : 'opacity-100'}
          `}>
            <div className="text-sp-pale-green text-2xl md:text-3xl lg:text-4xl font-bold">
              Visualizing Ancestral Recombination Graphs
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 