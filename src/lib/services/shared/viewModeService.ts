// View mode persistence service
// Handles saving and loading view mode preference to/from localStorage

export type ViewMode = 'list' | 'graph';

const STORAGE_KEY = 'bruinplan-view-mode';
const DEFAULT_VIEW_MODE: ViewMode = 'list';

/**
 * Load view mode preference from localStorage
 * Returns default mode if none exists or if there's an error
 */
export function loadViewMode(): ViewMode {
  try {
    if (typeof window === 'undefined') {
      // SSR - return default mode
      return DEFAULT_VIEW_MODE;
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return DEFAULT_VIEW_MODE;
    }

    // Validate that the stored value is a valid view mode
    if (stored === 'list' || stored === 'graph') {
      return stored;
    } else {
      // Invalid stored value, return default
      console.warn('Invalid view mode found in localStorage, using default');
      return DEFAULT_VIEW_MODE;
    }
  } catch (error) {
    console.warn('Error loading view mode from localStorage:', error);
    return DEFAULT_VIEW_MODE;
  }
}

/**
 * Save view mode preference to localStorage
 */
export function saveViewMode(mode: ViewMode): void {
  try {
    if (typeof window === 'undefined') {
      // SSR - do nothing
      return;
    }

    localStorage.setItem(STORAGE_KEY, mode);
  } catch (error) {
    console.warn('Error saving view mode to localStorage:', error);
  }
}

/**
 * Toggle between list and graph view modes and save the preference
 */
export function toggleViewMode(currentMode: ViewMode): ViewMode {
  const newMode: ViewMode = currentMode === 'list' ? 'graph' : 'list';
  saveViewMode(newMode);
  return newMode;
}
