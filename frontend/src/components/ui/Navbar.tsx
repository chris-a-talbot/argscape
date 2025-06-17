import { useNavigate, useLocation } from 'react-router-dom';
import ClickableLogo from './ClickableLogo';
import { useColorTheme } from '../../context/ColorThemeContext';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { colors } = useColorTheme();

  const navItems = [
    { label: 'Upload', path: '/upload' },
    { label: 'Simulate', path: '/simulate' },
    { label: 'Load', path: '/load' },
    { label: 'Learn', path: '/tutorials' },
    { label: 'Docs', path: '/docs' }
  ];

  const isActive = (path: string) => {
    if (path === '/upload' && location.pathname === '/') return true;
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-sp-very-dark-blue/80 border-b border-sp-pale-green/10">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex-shrink-0 transition-transform hover:scale-105">
          <ClickableLogo size="small" />
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center justify-center space-x-1">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative group ${
                isActive(item.path) 
                  ? 'text-sp-pale-green bg-sp-pale-green/10' 
                  : 'text-sp-white hover:text-sp-pale-green'
              }`}
            >
              {item.label}
              <span className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-sp-pale-green transition-all duration-200 ${
                isActive(item.path) ? 'w-full' : 'group-hover:w-full'
              }`} />
            </button>
          ))}
        </div>

        {/* Settings */}
        <button
          className="w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 hover:bg-sp-pale-green/10 hover:text-sp-pale-green text-sp-white"
          aria-label="Settings"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>

        {/* Mobile Menu Button - Shown on small screens */}
        <button
          className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 hover:bg-sp-pale-green/10 hover:text-sp-pale-green text-sp-white"
          aria-label="Menu"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>
    </nav>
  );
} 