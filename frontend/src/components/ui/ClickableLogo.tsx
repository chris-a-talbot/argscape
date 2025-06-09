import { useNavigate } from 'react-router-dom';
import { useColorTheme } from '../../context/ColorThemeContext';

interface ClickableLogoProps {
  className?: string;
  style?: React.CSSProperties;
  size?: 'small' | 'medium' | 'large';
  showSubtext?: boolean;
}

export default function ClickableLogo({ 
  className = '', 
  style = {}, 
  size = 'medium',
  showSubtext = false 
}: ClickableLogoProps) {
  const navigate = useNavigate();
  const { colors } = useColorTheme();

  const handleLogoClick = () => {
    // Navigate to home with force intro state
    // The Home component will decide whether to show animation based on available sequences
    navigate('/', { state: { forceIntro: true } });
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'text-xl md:text-2xl';
      case 'medium':
        return 'text-2xl md:text-3xl';
      case 'large':
        return 'text-[3rem] md:text-[4rem]';
      default:
        return 'text-2xl md:text-3xl';
    }
  };

  return (
    <div className="cursor-pointer select-none" onClick={handleLogoClick}>
      <h1 
        className={`${getSizeClasses()} font-extrabold tracking-tight ${className}`}
        style={{ letterSpacing: '-0.04em', ...style }}
      >
        ARG<span style={{ color: colors.accentPrimary }}>scape</span>
      </h1>
      {showSubtext && (
        <div className="mt-2 text-center">
          <div className="text-sm font-medium" style={{ color: colors.accentPrimary }}>
            Visualizing Ancestral Recombination Graphs
          </div>
        </div>
      )}
    </div>
  );
} 