import Navbar from '../layout/Navbar';
import ParticleBackground from '../ui/ParticleBackground';

export default function BackgroundAnimationPage() {
  return (
    <div className="text-sp-white min-h-screen flex flex-col bg-sp-very-dark-blue relative">
      <ParticleBackground />
      <Navbar />
      {/* Content is empty - just showing the background animation and navbar */}
    </div>
  );
}

