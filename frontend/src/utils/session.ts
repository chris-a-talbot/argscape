const SESSION_KEY = 'argscape_first_visit';

export const isFirstVisit = (): boolean => {
  try {
    return !sessionStorage.getItem(SESSION_KEY);
  } catch (error) {
    // If sessionStorage is not available, assume first visit
    return true;
  }
};

export const markVisited = (): void => {
  try {
    sessionStorage.setItem(SESSION_KEY, 'true');
  } catch (error) {
    // Silently fail if sessionStorage is not available
    console.warn('Session storage not available');
  }
};

export const resetVisitStatus = (): void => {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch (error) {
    // Silently fail if sessionStorage is not available
    console.warn('Session storage not available');
  }
}; 