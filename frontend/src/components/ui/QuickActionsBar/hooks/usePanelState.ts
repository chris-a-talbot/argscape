/**
 * usePanelState Hook
 * 
 * Manages Quick Actions Bar panel state including:
 * - Active tab tracking
 * - Panel open/closed/minimized states
 * - State persistence to localStorage
 */

import { useState, useCallback, useEffect } from 'react';
import type { QuickActionTab, PanelState, UsePanelStateReturn } from '../QuickActionsBar.types';

const STORAGE_KEY_PREFIX = 'argscape_quick_actions_';
const ACTIVE_TAB_KEY = `${STORAGE_KEY_PREFIX}active_tab`;
const PANEL_STATES_KEY = `${STORAGE_KEY_PREFIX}panel_states`;

/**
 * Load state from localStorage
 */
function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored !== null) {
      return JSON.parse(stored) as T;
    }
  } catch (error) {
    console.warn(`Failed to load ${key} from localStorage:`, error);
  }
  return defaultValue;
}

/**
 * Save state to localStorage
 */
function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to save ${key} to localStorage:`, error);
  }
}

/**
 * Hook to manage panel state for Quick Actions Bar
 */
export function usePanelState(): UsePanelStateReturn {
  // Load initial state from localStorage
  const [activeTab, setActiveTabState] = useState<QuickActionTab | null>(() =>
    loadFromStorage<QuickActionTab | null>(ACTIVE_TAB_KEY, null)
  );

  const [panelStates, setPanelStatesState] = useState<Record<QuickActionTab, PanelState>>(() =>
    loadFromStorage<Record<QuickActionTab, PanelState>>(PANEL_STATES_KEY, {
      filter: 'closed',
      nodes: 'closed',
      edges: 'closed',
      mutations: 'closed',
      layout: 'closed',
      stats: 'closed',
      export: 'closed',
      camera: 'closed',
      spatial: 'closed',
      diff: 'closed',
    })
  );

  // Persist activeTab to localStorage
  useEffect(() => {
    saveToStorage(ACTIVE_TAB_KEY, activeTab);
  }, [activeTab]);

  // Persist panelStates to localStorage
  useEffect(() => {
    saveToStorage(PANEL_STATES_KEY, panelStates);
  }, [panelStates]);

  /**
   * Set the active tab
   */
  const setActiveTab = useCallback((tab: QuickActionTab | null) => {
    setActiveTabState(tab);
  }, []);

  /**
   * Toggle a tab (open if closed, close if open)
   */
  const toggleTab = useCallback((tab: QuickActionTab) => {
    setActiveTabState((current) => (current === tab ? null : tab));
  }, []);

  /**
   * Close all panels
   */
  const closeAllPanels = useCallback(() => {
    setActiveTabState(null);
  }, []);

  /**
   * Set panel state for a specific tab
   */
  const setPanelState = useCallback((tab: QuickActionTab, state: PanelState) => {
    setPanelStatesState((current) => ({
      ...current,
      [tab]: state,
    }));
  }, []);

  return {
    activeTab,
    setActiveTab,
    toggleTab,
    closeAllPanels,
    panelStates,
    setPanelState,
  };
}

