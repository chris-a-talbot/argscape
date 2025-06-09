import React, { useState, useRef, useEffect } from 'react';
import { ColorTheme, useColorTheme } from '../../context/ColorThemeContext';
import { CustomColorThemeModal } from './CustomColorThemeModal';
import ConfirmModal from './ConfirmModal';

interface ColorThemeOption {
  value: ColorTheme;
  label: string;
  icon: string;
}

const colorThemeOptions: ColorThemeOption[] = [
  { value: 'tskit', label: 'tskit', icon: '🎨' },
  { value: 'grayscale', label: 'B&W', icon: '🌑' },
  { value: 'custom', label: 'Custom', icon: '🎭' },
];

export const ColorThemeDropdown: React.FC = () => {
  const { 
    theme, 
    setTheme, 
    colors, 
    customThemes, 
    selectedCustomTheme, 
    setSelectedCustomTheme, 
    deleteCustomTheme 
  } = useColorTheme();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [editingTheme, setEditingTheme] = useState<{ id: string; name: string; colors: any } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; themeId: string; themeName: string }>({
    isOpen: false,
    themeId: '',
    themeName: ''
  });
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption = colorThemeOptions.find(option => option.value === theme);
  const currentCustomTheme = theme === 'custom' && selectedCustomTheme 
    ? customThemes.find(t => t.id === selectedCustomTheme)
    : null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleThemeSelect = (themeValue: ColorTheme) => {
    if (themeValue === 'custom') {
      if (customThemes.length === 0) {
        // No custom themes exist, open the creation modal
        setShowCustomModal(true);
        setEditingTheme(null);
      } else {
        // Set to custom theme and select the first one if none selected
        setTheme('custom');
        if (!selectedCustomTheme) {
          setSelectedCustomTheme(customThemes[0].id);
        }
      }
    } else {
      setTheme(themeValue);
    }
    setIsOpen(false);
  };

  const handleCustomThemeSelect = (themeId: string) => {
    setTheme('custom');
    setSelectedCustomTheme(themeId);
    setIsOpen(false);
  };

  const handleCreateNew = () => {
    setEditingTheme(null);
    setShowCustomModal(true);
    setIsOpen(false);
  };

  const handleEditTheme = (themeId: string) => {
    const themeToEdit = customThemes.find(t => t.id === themeId);
    if (themeToEdit) {
      setEditingTheme(themeToEdit);
      setShowCustomModal(true);
    }
    setIsOpen(false);
  };

  const handleDeleteTheme = (themeId: string) => {
    const themeToDelete = customThemes.find(t => t.id === themeId);
    if (themeToDelete) {
      setConfirmDelete({
        isOpen: true,
        themeId,
        themeName: themeToDelete.name
      });
    }
    setIsOpen(false);
  };

  const confirmDeleteTheme = () => {
    deleteCustomTheme(confirmDelete.themeId);
    setConfirmDelete({ isOpen: false, themeId: '', themeName: '' });
    
    // If we deleted the currently selected custom theme and no others exist, switch to tskit
    if (selectedCustomTheme === confirmDelete.themeId && customThemes.length <= 1) {
      setTheme('tskit');
    }
  };

  const getDisplayLabel = () => {
    if (theme === 'custom' && currentCustomTheme) {
      return currentCustomTheme.name.length > 12 ? `${currentCustomTheme.name.slice(0, 12)}...` : currentCustomTheme.name;
    }
    return currentOption?.label || 'Custom';
  };

  const getDisplayIcon = () => {
    if (theme === 'custom') {
      return '🎭';
    }
    return currentOption?.icon || '🎨';
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          className="font-medium px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-1"
          style={{
            backgroundColor: colors.containerBackground,
            color: colors.text,
            border: `1px solid ${colors.border}`
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.border;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.containerBackground;
          }}
          onClick={() => setIsOpen(!isOpen)}
          title="Select color theme"
        >
          {getDisplayIcon()} {getDisplayLabel()}
          <svg 
            className="w-4 h-4 ml-1" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div
            className="absolute right-0 mt-1 py-1 rounded-md shadow-lg z-50 min-w-[160px] max-w-[250px]"
            style={{
              backgroundColor: colors.containerBackground,
              border: `1px solid ${colors.border}`
            }}
          >
            {/* Built-in themes */}
            {colorThemeOptions.filter(option => option.value !== 'custom').map((option) => (
              <button
                key={option.value}
                className="w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2"
                style={{
                  color: theme === option.value ? colors.textSecondary : colors.text,
                  backgroundColor: theme === option.value ? colors.border : 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (theme !== option.value) {
                    e.currentTarget.style.backgroundColor = colors.border;
                  }
                }}
                onMouseLeave={(e) => {
                  if (theme !== option.value) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
                onClick={() => handleThemeSelect(option.value)}
              >
                {option.icon} {option.label}
                {theme === option.value && (
                  <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}

            {/* Separator */}
            <div className="h-px my-1" style={{ backgroundColor: colors.border }} />

            {/* Custom themes section */}
            <div className="px-3 py-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                  Custom Themes
                </span>
                <button
                  onClick={handleCreateNew}
                  className="text-xs hover:underline"
                  style={{ color: colors.textSecondary }}
                  title="Create new custom theme"
                >
                  + New
                </button>
              </div>
            </div>

            {/* Custom theme list */}
            {customThemes.length === 0 ? (
              <div className="px-3 py-2 text-xs" style={{ color: colors.text + '80' }}>
                No custom themes yet
              </div>
            ) : (
              customThemes.map((customTheme) => (
                <div
                  key={customTheme.id}
                  className="flex items-center gap-2 px-3 py-2 text-sm transition-colors group"
                  style={{
                    backgroundColor: theme === 'custom' && selectedCustomTheme === customTheme.id ? colors.border : 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (!(theme === 'custom' && selectedCustomTheme === customTheme.id)) {
                      e.currentTarget.style.backgroundColor = colors.border;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!(theme === 'custom' && selectedCustomTheme === customTheme.id)) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <button
                    onClick={() => handleCustomThemeSelect(customTheme.id)}
                    className="flex-1 text-left flex items-center gap-2 min-w-0"
                    style={{
                      color: theme === 'custom' && selectedCustomTheme === customTheme.id ? colors.textSecondary : colors.text
                    }}
                  >
                    🎭 
                    <span className="truncate">
                      {customTheme.name}
                    </span>
                    {theme === 'custom' && selectedCustomTheme === customTheme.id && (
                      <svg className="w-4 h-4 ml-auto flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                  
                  {/* Action buttons */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditTheme(customTheme.id)}
                      className="p-1 rounded hover:bg-opacity-20"
                      style={{ color: colors.textSecondary }}
                      title="Edit theme"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteTheme(customTheme.id)}
                      className="p-1 rounded hover:bg-red-500 hover:bg-opacity-20"
                      style={{ color: '#ef4444' }}
                      title="Delete theme"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* Create custom theme option */}
            {customThemes.length > 0 && (
              <>
                <div className="h-px my-1" style={{ backgroundColor: colors.border }} />
                <button
                  onClick={handleCreateNew}
                  className="w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2"
                  style={{ color: colors.textSecondary }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.border;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  ➕ Create New Theme
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Custom Color Theme Modal */}
      <CustomColorThemeModal
        isOpen={showCustomModal}
        onClose={() => {
          setShowCustomModal(false);
          setEditingTheme(null);
        }}
        editingTheme={editingTheme}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="Delete Custom Theme"
        message={`Are you sure you want to delete the custom theme "${confirmDelete.themeName}"? This action cannot be undone.`}
        type="danger"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteTheme}
        onCancel={() => setConfirmDelete({ isOpen: false, themeId: '', themeName: '' })}
      />
    </>
  );
}; 