import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface UIPreferencesContextType {
  backgroundAnimationEnabled: boolean;
  setBackgroundAnimationEnabled: (enabled: boolean) => void;
}

const UIPreferencesContext = createContext<UIPreferencesContextType | undefined>(undefined);

const BACKGROUND_ANIMATION_KEY = 'argscape_background_animation_enabled';

export const UIPreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [backgroundAnimationEnabled, setBackgroundAnimationEnabledState] = useState<boolean>(true);

  // Load preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(BACKGROUND_ANIMATION_KEY);
      if (saved !== null) {
        setBackgroundAnimationEnabledState(saved === 'true');
      }
    } catch (error) {
      console.warn('Failed to load background animation preference:', error);
    }
  }, []);

  // Save preference to localStorage
  const setBackgroundAnimationEnabled = useCallback((enabled: boolean) => {
    setBackgroundAnimationEnabledState(enabled);
    localStorage.setItem(BACKGROUND_ANIMATION_KEY, enabled.toString());
  }, []);

  const value = {
    backgroundAnimationEnabled,
    setBackgroundAnimationEnabled
  };

  return (
    <UIPreferencesContext.Provider value={value}>
      {children}
    </UIPreferencesContext.Provider>
  );
};

export const useUIPreferences = () => {
  const context = useContext(UIPreferencesContext);
  if (context === undefined) {
    throw new Error('useUIPreferences must be used within a UIPreferencesProvider');
  }
  return context;
};

