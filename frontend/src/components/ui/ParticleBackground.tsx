import { useEffect, useRef } from 'react';
import { useUIPreferences } from '../../context/UIPreferencesContext';
import { useColorTheme } from '../../context/ColorThemeContext';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  connected: Particle[];
}

interface MousePosition {
  x: number;
  y: number;
  active: boolean;
}

interface ParticleBackgroundProps {
  forceShow?: boolean; // If true, always show regardless of preference
}

export default function ParticleBackground({ forceShow = false }: ParticleBackgroundProps) {
  const { backgroundAnimationEnabled } = useUIPreferences();
  const { colors, theme } = useColorTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const mouseRef = useRef<MousePosition>({ x: 0, y: 0, active: false });

  // Determine if we should show the animation
  const shouldShow = forceShow || backgroundAnimationEnabled;
  
  // Use different particle colors based on theme
  const particleColor = colors.accentPrimary; // ARGscape Green for all themes
  const particleOpacityMultiplier = theme === 'liquid' ? 0.4 : 0.5; // Lower opacity for light theme

  useEffect(() => {
    // Don't run effect if animation shouldn't be shown
    if (!shouldShow) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    // Initial resize
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Mouse event handlers
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX,
        y: e.clientY,
        active: true
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    // Create particles
    const createParticles = () => {
      const particleCount = Math.min(Math.floor(window.innerWidth * 0.05), 50);
      particlesRef.current = Array.from({ length: particleCount }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.2,
        connected: []
      }));
    };

    createParticles();

    const animate = () => {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particlesRef.current.forEach(particle => {
        // Mouse interaction
        if (mouseRef.current.active) {
          const dx = mouseRef.current.x - particle.x;
          const dy = mouseRef.current.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxDistance = 200;

          if (distance < maxDistance) {
            const force = (maxDistance - distance) / maxDistance;
            particle.x += (dx / distance) * force * 2;
            particle.y += (dy / distance) * force * 2;
          }
        }

        // Continuous movement
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Bounce off edges with slight speed variation
        if (particle.x < 0 || particle.x > canvas.width) {
          particle.speedX *= -1;
          // Add small random variation to speed when bouncing
          particle.speedX += (Math.random() - 0.5) * 0.1;
          particle.x = Math.max(0, Math.min(canvas.width, particle.x));
        }
        if (particle.y < 0 || particle.y > canvas.height) {
          particle.speedY *= -1;
          // Add small random variation to speed when bouncing
          particle.speedY += (Math.random() - 0.5) * 0.1;
          particle.y = Math.max(0, Math.min(canvas.height, particle.y));
        }

        // Ensure particles maintain minimum speed
        const minSpeed = 0.2;
        const currentSpeed = Math.sqrt(particle.speedX * particle.speedX + particle.speedY * particle.speedY);
        if (currentSpeed < minSpeed) {
          const scale = minSpeed / currentSpeed;
          particle.speedX *= scale;
          particle.speedY *= scale;
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        // Parse hex color and apply opacity
        const r = parseInt(particleColor.slice(1, 3), 16);
        const g = parseInt(particleColor.slice(3, 5), 16);
        const b = parseInt(particleColor.slice(5, 7), 16);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${particle.opacity * particleOpacityMultiplier})`;
        ctx.fill();

        // Connect nearby particles
        particlesRef.current.forEach(otherParticle => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxDistance = mouseRef.current.active ? 150 : 100;

          if (distance < maxDistance) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            const opacity = mouseRef.current.active ? 
              0.15 * (1 - distance / maxDistance) * particleOpacityMultiplier : 
              0.1 * (1 - distance / maxDistance) * particleOpacityMultiplier;
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
            ctx.stroke();
          }
        });
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [shouldShow, particleColor, particleOpacityMultiplier]);

  // Don't render if animation is disabled (unless forced to show)
  if (!shouldShow) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0"
      style={{ zIndex: 0 }}
    />
  );
} 