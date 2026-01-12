import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface UIPreferencesContextType {
  backgroundAnimationEnabled: boolean;
  setBackgroundAnimationEnabled: (enabled: boolean) => void;
  liquidEffectsEnabled: boolean;
  setLiquidEffectsEnabled: (enabled: boolean) => void;
}

const UIPreferencesContext = createContext<UIPreferencesContextType | undefined>(undefined);

const BACKGROUND_ANIMATION_KEY = 'argscape_background_animation_enabled';
const LIQUID_EFFECTS_KEY = 'argscape_liquid_effects_enabled';

export const UIPreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [backgroundAnimationEnabled, setBackgroundAnimationEnabledState] = useState<boolean>(true);
  const [liquidEffectsEnabled, setLiquidEffectsEnabledState] = useState<boolean>(true);

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const savedAnimation = localStorage.getItem(BACKGROUND_ANIMATION_KEY);
      if (savedAnimation !== null) {
        setBackgroundAnimationEnabledState(savedAnimation === 'true');
      }
      
      const savedLiquid = localStorage.getItem(LIQUID_EFFECTS_KEY);
      if (savedLiquid !== null) {
        setLiquidEffectsEnabledState(savedLiquid === 'true');
      }
    } catch (error) {
      console.warn('Failed to load UI preferences:', error);
    }
  }, []);

  // Save preferences to localStorage
  const setBackgroundAnimationEnabled = useCallback((enabled: boolean) => {
    setBackgroundAnimationEnabledState(enabled);
    localStorage.setItem(BACKGROUND_ANIMATION_KEY, enabled.toString());
  }, []);

  const setLiquidEffectsEnabled = useCallback((enabled: boolean) => {
    setLiquidEffectsEnabledState(enabled);
    localStorage.setItem(LIQUID_EFFECTS_KEY, enabled.toString());
  }, []);

  const value = {
    backgroundAnimationEnabled,
    setBackgroundAnimationEnabled,
    liquidEffectsEnabled,
    setLiquidEffectsEnabled
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

