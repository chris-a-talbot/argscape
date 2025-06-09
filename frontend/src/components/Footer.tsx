import { useColorTheme } from '../context/ColorThemeContext';
import { useLocation } from 'react-router-dom';

export default function Footer() {
  const location = useLocation();
  const isVisualizationPage = location.pathname.startsWith('/visualize');
  
  // Always call the hook - conditionally use the result
  const { colors, theme } = useColorTheme();
  // Use tskit theme colors for footer UI when custom theme is active for visualizations
  const shouldUseTskitColors = isVisualizationPage && theme === 'custom';
  const themeColors = isVisualizationPage && !shouldUseTskitColors ? colors : null;

  return (
    <footer 
      className={`fixed bottom-0 left-0 right-0 py-4 text-center text-sm backdrop-blur-sm border-t z-50 ${
        !isVisualizationPage ? 'text-sp-white bg-sp-very-dark-blue/90 border-t-sp-dark-blue/50' : ''
      }`}
      style={isVisualizationPage && themeColors ? {
        color: themeColors.text,
        backgroundColor: themeColors.background + 'E6', // 90% opacity equivalent
        borderTopColor: themeColors.border + '80' // 50% opacity equivalent
      } : {}}
    >
      <div className="flex flex-col items-center gap-3">
        {/* Main footer content */}
        <div className="flex items-center gap-4">
          <p>
            © {new Date().getFullYear()}{" "}
                          <a 
                href="https://chris-a-talbot.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className={!isVisualizationPage ? "text-sp-pale-green hover:text-sp-white transition-colors" : "transition-colors"}
                style={isVisualizationPage && themeColors ? {
                  color: themeColors.accentPrimary
                } : {}}
              >
              Chris Talbot
            </a>
            . All rights reserved.
          </p>
          
          {/* GitHub link */}
          <a 
            href="https://github.com/chris-a-talbot/argscape" 
            target="_blank" 
            rel="noopener noreferrer"
            className={!isVisualizationPage ? "text-sp-white hover:text-sp-pale-green transition-colors" : "transition-colors"}
            style={isVisualizationPage && themeColors ? {
              color: themeColors.accentPrimary
            } : {}}
            title="View source on GitHub"
          >
            <svg 
              className="w-5 h-5" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
        </div>
        
        {/* Resources section */}
        <div className="flex items-center gap-4 text-xs">
          <span 
            className={!isVisualizationPage ? "text-sp-white/70" : ""}
            style={isVisualizationPage && themeColors ? {
              color: themeColors.textSecondary,
              opacity: 0.7
            } : {}}
          >
            Resources:
          </span>
          <a 
            href="https://tskit.dev/" 
            target="_blank" 
            rel="noopener noreferrer"
            className={!isVisualizationPage ? "text-sp-white/90 hover:text-sp-pale-green transition-colors" : "transition-colors"}
            style={isVisualizationPage && themeColors ? {
              color: themeColors.accentPrimary,
              opacity: 0.9
            } : {}}
          >
            tskit
          </a>
          <span 
            className={!isVisualizationPage ? "text-sp-white/50" : ""}
            style={isVisualizationPage && themeColors ? {
              color: themeColors.text,
              opacity: 0.5
            } : {}}
          >
            •
          </span>
          <a 
            href="https://tskit.dev/msprime/docs/stable/intro.html" 
            target="_blank" 
            rel="noopener noreferrer"
            className={!isVisualizationPage ? "text-sp-white/90 hover:text-sp-pale-green transition-colors" : "transition-colors"}
            style={isVisualizationPage && themeColors ? {
              color: themeColors.accentPrimary,
              opacity: 0.9
            } : {}}
          >
            msprime
          </a>
          <span 
            className={!isVisualizationPage ? "text-sp-white/50" : ""}
            style={isVisualizationPage && themeColors ? {
              color: themeColors.text,
              opacity: 0.5
            } : {}}
          >
            •
          </span>
          <a 
            href="https://github.com/chris-a-talbot/fastgaia" 
            target="_blank" 
            rel="noopener noreferrer"
            className={!isVisualizationPage ? "text-sp-white/90 hover:text-sp-pale-green transition-colors" : "transition-colors"}
            style={isVisualizationPage && themeColors ? {
              color: themeColors.accentPrimary,
              opacity: 0.9
            } : {}}
          >
            fastgaia
          </a>
        </div>
      </div>
    </footer>
  );
} 