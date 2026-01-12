import Navbar from '../layout/Navbar';
import ParticleBackground from '../ui/ParticleBackground';
import { useColorTheme } from '../../context/ColorThemeContext';

export default function DocsPage() {
  const { colors } = useColorTheme();
  
  return (
    <div className="min-h-screen relative" style={{ backgroundColor: colors.background }}>
      <ParticleBackground />
      <div className="min-h-screen flex flex-col" style={{ color: colors.text }}>
        <Navbar />
        <div className="flex-grow px-4 pt-24 pb-32">
          <div className="max-w-7xl mx-auto">
            <div className="backdrop-blur-sm rounded-2xl shadow-xl border overflow-hidden p-8" style={{
              backgroundColor: `${colors.containerBackground}f0`,
              borderColor: colors.border
            }}>
              <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-2 text-center">Documentation</h1>
                <p className="text-lg mb-10 text-center" style={{ color: colors.textSecondary }}>
                  ARGscape v0.3.0 • Web UI and CLI usage
                </p>

                {/* Getting Started */}
                <section className="mb-10">
                  <h2 className="text-2xl font-semibold mb-3">Getting Started</h2>
                  <ul className="list-disc pl-6 space-y-1" style={{ color: colors.text, opacity: 0.8 }}>
                    <li>Launch locally with <code className="px-1 py-0.5 rounded" style={{
                      backgroundColor: `${colors.background}80`,
                      color: colors.accentPrimary
                    }}>argscape</code> (default: http://127.0.0.1:8000)</li>
                    <li>Open the web UI to upload <code className="px-1 py-0.5 rounded" style={{
                      backgroundColor: `${colors.background}80`,
                      color: colors.accentPrimary
                    }}>.trees</code> files, simulate data, and run inference</li>
                    <li>Use the CLI for automation and reproducible workflows</li>
                  </ul>
                </section>

                {/* Web UI Overview */}
                <section className="mb-10">
                  <h2 className="text-2xl font-semibold mb-3">Web UI</h2>
                  <ul className="list-disc pl-6 space-y-1" style={{ color: colors.text, opacity: 0.8 }}>
                    <li><strong>Upload</strong>: Add <code className="px-1 py-0.5 rounded" style={{
                      backgroundColor: `${colors.background}80`,
                      color: colors.accentPrimary
                    }}>.trees</code> or <code className="px-1 py-0.5 rounded" style={{
                      backgroundColor: `${colors.background}80`,
                      color: colors.accentPrimary
                    }}>.tsz</code> files</li>
                    <li><strong>Simulate</strong>: Generate sequences with <code className="px-1 py-0.5 rounded" style={{
                      backgroundColor: `${colors.background}80`,
                      color: colors.accentPrimary
                    }}>msprime</code></li>
                    <li><strong>Visualize</strong>:
                      <ul className="list-disc pl-6 space-y-1 mt-1">
                        <li>2D ARG (force-directed)</li>
                        <li>3D Spatial ARG (for spatially-embedded data)</li>
                        <li>Diff visualization (compare two spatial sequences)</li>
                      </ul>
                    </li>
                    <li><strong>Export</strong>: Download processed tree sequences and visualization images</li>
                  </ul>
                </section>

                {/* CLI Overview */}
                <section className="mb-10">
                  <h2 className="text-2xl font-semibold mb-3">Command-line (CLI)</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-1">argscape</h3>
                      <p className="mb-2" style={{ color: colors.text, opacity: 0.8 }}>Start the local server.</p>
                      <pre className="p-3 rounded border overflow-auto text-sm" style={{
                        backgroundColor: `${colors.background}80`,
                        borderColor: colors.border,
                        color: colors.accentPrimary
                      }}>
{`argscape [--host HOST] [--port PORT] [--reload] [--no-browser] [--no-tsdate]`}
                      </pre>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-1">argscape_infer</h3>
                      <p className="mb-2" style={{ color: colors.text, opacity: 0.8 }}>Run spatial/temporal inference from the terminal.</p>
                      <ul className="list-disc pl-6 space-y-1" style={{ color: colors.text, opacity: 0.8 }}>
                        <li><code className="px-1 py-0.5 rounded" style={{
                          backgroundColor: `${colors.background}80`,
                          color: colors.accentPrimary
                        }}>load</code> – load a <code className="px-1 py-0.5 rounded" style={{
                          backgroundColor: `${colors.background}80`,
                          color: colors.accentPrimary
                        }}>.trees</code> file into persistent storage</li>
                        <li><code className="px-1 py-0.5 rounded" style={{
                          backgroundColor: `${colors.background}80`,
                          color: colors.accentPrimary
                        }}>run</code> – run an inference method and save the output</li>
                        <li>(no subcommand) – interactive mode</li>
                      </ul>
                      <p className="text-sm mt-2" style={{ color: colors.textSecondary }}>Methods: midpoint, fastgaia, gaia-quadratic, gaia-linear, sparg, tsdate</p>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-1">argscape_load</h3>
                      <p className="mb-2" style={{ color: colors.text, opacity: 0.8 }}>Manage persistent session storage.</p>
                      <ul className="list-disc pl-6 space-y-1" style={{ color: colors.text, opacity: 0.8 }}>
                        <li><code className="px-1 py-0.5 rounded" style={{
                          backgroundColor: `${colors.background}80`,
                          color: colors.accentPrimary
                        }}>load</code>, <code className="px-1 py-0.5 rounded" style={{
                          backgroundColor: `${colors.background}80`,
                          color: colors.accentPrimary
                        }}>list</code>, <code className="px-1 py-0.5 rounded" style={{
                          backgroundColor: `${colors.background}80`,
                          color: colors.accentPrimary
                        }}>rm</code>, <code className="px-1 py-0.5 rounded" style={{
                          backgroundColor: `${colors.background}80`,
                          color: colors.accentPrimary
                        }}>clear</code></li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Notes */}
                <section>
                  <h2 className="text-2xl font-semibold mb-3">Notes</h2>
                  <ul className="list-disc pl-6 space-y-1" style={{ color: colors.textSecondary }}>
                    <li>Session storage is keyed per client; CLI and UI share the same persistent session.</li>
                    <li>Visualization snapshot CLI is disabled in v0.3.0 while being stabilized.</li>
                    <li>Full API docs are available at <code className="px-1 py-0.5 rounded" style={{
                      backgroundColor: `${colors.background}80`,
                      color: colors.accentPrimary
                    }}>/docs</code>.</li>
                  </ul>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}