import Navbar from '../layout/Navbar';
import ParticleBackground from '../ui/ParticleBackground';
import { useThemeStyles } from '../../hooks/useThemeStyles';

export default function BackgroundAnimationPage() {
  const { pageStyle } = useThemeStyles();
  
  return (
    <div className="min-h-screen flex flex-col relative" style={pageStyle}>
      <ParticleBackground forceShow={true} />
      <Navbar />
      {/* Content is empty - just showing the background animation and navbar */}
    </div>
  );
}

