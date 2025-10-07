import Navbar from './ui/Navbar';
import ParticleBackground from './ui/ParticleBackground';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-sp-very-dark-blue relative">
      <ParticleBackground />
      <div className="text-sp-white min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow px-4 pt-24 pb-32">
          <div className="max-w-7xl mx-auto">
            <div className="bg-sp-very-dark-blue/95 backdrop-blur-sm rounded-2xl shadow-xl border border-sp-dark-blue overflow-hidden p-8">
              <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-2 text-center">Documentation</h1>
                <p className="text-sp-white/70 text-lg mb-10 text-center">
                  ARGscape v0.3.0 • Web UI and CLI usage
                </p>

                {/* Getting Started */}
                <section className="mb-10">
                  <h2 className="text-2xl font-semibold mb-3">Getting Started</h2>
                  <ul className="list-disc pl-6 space-y-1 text-sp-white/80">
                    <li>Launch locally with <code className="bg-black/30 px-1 py-0.5 rounded">argscape</code> (default: http://127.0.0.1:8000)</li>
                    <li>Open the web UI to upload <code className="bg-black/30 px-1 py-0.5 rounded">.trees</code> files, simulate data, and run inference</li>
                    <li>Use the CLI for automation and reproducible workflows</li>
                  </ul>
                </section>

                {/* Web UI Overview */}
                <section className="mb-10">
                  <h2 className="text-2xl font-semibold mb-3">Web UI</h2>
                  <ul className="list-disc pl-6 space-y-1 text-sp-white/80">
                    <li><strong>Upload</strong>: Add <code className="bg-black/30 px-1 py-0.5 rounded">.trees</code> or <code className="bg-black/30 px-1 py-0.5 rounded">.tsz</code> files</li>
                    <li><strong>Simulate</strong>: Generate sequences with <code className="bg-black/30 px-1 py-0.5 rounded">msprime</code></li>
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
                      <p className="text-sp-white/80 mb-2">Start the local server.</p>
                      <pre className="bg-black/40 p-3 rounded border border-sp-dark-blue overflow-auto text-sm">
{`argscape [--host HOST] [--port PORT] [--reload] [--no-browser] [--no-tsdate]`}
                      </pre>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-1">argscape_infer</h3>
                      <p className="text-sp-white/80 mb-2">Run spatial/temporal inference from the terminal.</p>
                      <ul className="list-disc pl-6 space-y-1 text-sp-white/80">
                        <li><code className="bg-black/30 px-1 py-0.5 rounded">load</code> – load a <code className="bg-black/30 px-1 py-0.5 rounded">.trees</code> file into persistent storage</li>
                        <li><code className="bg-black/30 px-1 py-0.5 rounded">run</code> – run an inference method and save the output</li>
                        <li>(no subcommand) – interactive mode</li>
                      </ul>
                      <p className="text-sp-white/70 text-sm mt-2">Methods: midpoint, fastgaia, gaia-quadratic, gaia-linear, sparg, tsdate</p>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-1">argscape_load</h3>
                      <p className="text-sp-white/80 mb-2">Manage persistent session storage.</p>
                      <ul className="list-disc pl-6 space-y-1 text-sp-white/80">
                        <li><code className="bg-black/30 px-1 py-0.5 rounded">load</code>, <code className="bg-black/30 px-1 py-0.5 rounded">list</code>, <code className="bg-black/30 px-1 py-0.5 rounded">rm</code>, <code className="bg-black/30 px-1 py-0.5 rounded">clear</code></li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Notes */}
                <section>
                  <h2 className="text-2xl font-semibold mb-3">Notes</h2>
                  <ul className="list-disc pl-6 space-y-1 text-sp-white/70">
                    <li>Session storage is keyed per client; CLI and UI share the same persistent session.</li>
                    <li>Visualization snapshot CLI is disabled in v0.3.0 while being stabilized.</li>
                    <li>Full API docs are available at <code className="bg-black/30 px-1 py-0.5 rounded">/docs</code>.</li>
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