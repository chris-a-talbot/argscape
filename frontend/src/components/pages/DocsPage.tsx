import { useEffect, useState } from 'react';
import Navbar from '../layout/Navbar';
import ParticleBackground from '../ui/ParticleBackground';
import { useColorTheme } from '../../context/ColorThemeContext';

export default function DocsPage() {
  const { colors } = useColorTheme();
  const [docsAvailable, setDocsAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if documentation is available before redirecting
    fetch('/documentation/', { method: 'HEAD' })
      .then((response) => {
        if (response.ok) {
          // Docs are available, redirect
          window.location.href = '/documentation/';
        } else {
          // Docs not available
          setDocsAvailable(false);
        }
      })
      .catch(() => {
        setDocsAvailable(false);
      });
  }, []);

  // Show fallback message if docs aren't available
  if (docsAvailable === false) {
    return (
      <div className="min-h-screen relative" style={{ backgroundColor: colors.background }}>
        <ParticleBackground />
        <div className="min-h-screen flex flex-col" style={{ color: colors.text }}>
          <Navbar />
          <div className="flex-grow px-4 pt-24 pb-32 flex items-center justify-center">
            <div className="text-center max-w-xl">
              <h1 className="text-2xl font-semibold mb-4">Documentation Not Installed</h1>
              <p style={{ color: colors.textSecondary }} className="mb-6">
                The documentation module is not currently built. To build the documentation locally:
              </p>
              <div
                className="text-left p-4 rounded-lg font-mono text-sm mb-6"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  border: `1px solid ${colors.border}`,
                }}
              >
                <p className="mb-2"># Install docs dependencies</p>
                <p className="mb-4" style={{ color: colors.accentPrimary }}>
                  pip install argscape[docs]
                </p>
                <p className="mb-2"># Build the documentation</p>
                <p style={{ color: colors.accentPrimary }}>bash docs/build.sh</p>
              </div>
              <p style={{ color: colors.textSecondary }}>
                Or view the documentation online at{' '}
                <a
                  href="https://argscape.com/documentation/"
                  className="underline"
                  style={{ color: colors.accentPrimary }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  argscape.com/documentation
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render a loading state while checking/redirecting
  return (
    <div className="min-h-screen relative" style={{ backgroundColor: colors.background }}>
      <ParticleBackground />
      <div className="min-h-screen flex flex-col" style={{ color: colors.text }}>
        <Navbar />
        <div className="flex-grow px-4 pt-24 pb-32 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-pulse">
              <h1 className="text-2xl font-semibold mb-4">Redirecting to Documentation...</h1>
              <p style={{ color: colors.textSecondary }}>
                If you are not redirected automatically,{' '}
                <a
                  href="/documentation/"
                  className="underline"
                  style={{ color: colors.accentPrimary }}
                >
                  click here
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
