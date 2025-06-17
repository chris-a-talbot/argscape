import Navbar from './ui/Navbar';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-sp-very-dark-blue text-sp-white flex flex-col">
      <Navbar />
      <div className="flex-grow px-4 pt-24 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Documentation</h1>
            <p className="text-sp-white/70 text-lg mb-8">
              Comprehensive documentation for ARGscape's features and capabilities.
            </p>
            
            {/* Placeholder content */}
            <div className="bg-sp-dark-blue/30 rounded-lg p-8 text-center">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-sp-pale-green"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-xl font-semibold mb-2">Coming Soon</p>
              <p className="text-sp-white/70">
                Our documentation is currently under development. Check back soon!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 