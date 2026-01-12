import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ClickableLogo from '../ui/ClickableLogo';
import { ColorThemeDropdown } from '../ui/ColorThemeDropdown';
import { useUIPreferences } from '../../context/UIPreferencesContext';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { useSemanticColors } from '../../hooks/useSemanticColors';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsDropdownRef = useRef<HTMLDivElement>(null);
  const { backgroundAnimationEnabled, setBackgroundAnimationEnabled, liquidEffectsEnabled, setLiquidEffectsEnabled } = useUIPreferences();
  const { navStyle, isLiquid, dropdownMenuStyle } = useThemeStyles();
  const semanticColors = useSemanticColors();

  const navItems = [
    { label: 'Upload', path: '/upload' },
    { label: 'Simulate', path: '/simulate' },
    { label: 'Load', path: '/load' },
    { label: 'Install', path: '/install' },
    { label: 'Learn', path: '/tutorials' },
    { label: 'Docs', path: '/docs' }
  ];

  const isActive = (path: string) => {
    // Don't highlight any tab when on the homepage
    if (location.pathname === '/') return false;
    return location.pathname.startsWith(path);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsDropdownRef.current && !settingsDropdownRef.current.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav 
      className="fixed top-0 left-0 right-0 z-50 border-b transition-colors duration-300"
      style={navStyle}
    >
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
                  ? 'bg-white/10' 
                  : 'hover:bg-white/5'
              }`}
              style={{
                color: isActive(item.path) 
                  ? semanticColors.activeHighlight
                  : navStyle.color
              }}
            >
              {item.label}
              <span 
                className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 transition-all duration-200 ${
                  isActive(item.path) ? 'w-full' : 'group-hover:w-full'
                }`} 
                style={{
                  backgroundColor: semanticColors.activeHighlight
                }}
              />
            </button>
          ))}
        </div>

        {/* Settings Dropdown */}
        <div className="relative" ref={settingsDropdownRef}>
          <button
            className="w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 hover:bg-white/10"
            style={{ color: navStyle.color }}
            aria-label="Settings"
            onClick={() => setSettingsOpen(!settingsOpen)}
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

          {settingsOpen && (
            <div 
              className="absolute right-0 mt-2 py-2 z-50 min-w-[200px]"
              style={dropdownMenuStyle}
            >
              {/* Theme Selector */}
              <div className="px-4 py-2">
                <div className="text-xs font-medium mb-2" style={{ color: navStyle.color }}>
                  Theme
                </div>
                <ColorThemeDropdown />
              </div>
              
              {/* Separator */}
              <div className="h-px my-2" style={{ backgroundColor: navStyle.borderBottomColor }} />
              
              {/* Background Animation Toggle */}
              <button
                onClick={() => {
                  setBackgroundAnimationEnabled(!backgroundAnimationEnabled);
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Background animation</span>
                </div>
                <div 
                  className="relative w-10 h-5 rounded-full transition-colors duration-200 bg-white/20"
                  style={{
                    backgroundColor: backgroundAnimationEnabled ? semanticColors.activeHighlight : 'rgba(255,255,255,0.2)'
                  }}
                >
                  <div className={`absolute w-4 h-4 bg-white rounded-full transition-transform duration-200 top-0.5 ${
                    backgroundAnimationEnabled ? 'left-5' : 'left-0.5'
                  }`} />
                </div>
              </button>

              {/* Liquid Effects Toggle - Only show in liquid theme */}
              {isLiquid && (
                <button
                  onClick={() => {
                    setLiquidEffectsEnabled(!liquidEffectsEnabled);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    <span>Liquid glass effects</span>
                  </div>
                  <div 
                    className="relative w-10 h-5 rounded-full transition-colors duration-200 bg-white/20"
                    style={{
                      backgroundColor: liquidEffectsEnabled ? semanticColors.activeHighlight : 'rgba(255,255,255,0.2)'
                    }}
                  >
                    <div className={`absolute w-4 h-4 bg-white rounded-full transition-transform duration-200 top-0.5 ${
                      liquidEffectsEnabled ? 'left-5' : 'left-0.5'
                    }`} />
                  </div>
                </button>
              )}
              
              {/* View Animation Only */}
              <button
                onClick={() => {
                  navigate('/background-animation');
                  setSettingsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View animation only
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button - Shown on small screens */}
        <button
          className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 hover:bg-white/10"
          style={{ color: navStyle.color }}
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