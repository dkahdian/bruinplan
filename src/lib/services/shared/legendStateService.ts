// Legend state persistence service
// Handles saving and loading legend state to/from localStorage

export interface LegendState {
  isExpanded: boolean;
  showWarnings: boolean;
  showRecommended: boolean;
  showCompletedCourses: boolean;
}

const STORAGE_KEY = 'bruinplan-legend-state';

// Default legend state
const DEFAULT_STATE: LegendState = {
  isExpanded: true,
  showWarnings: true,
  showRecommended: true,
  showCompletedCourses: true
};

/**
 * Load legend state from localStorage
 * Returns default state if none exists or if there's an error
 */
export function loadLegendState(): LegendState {
  try {
    if (typeof window === 'undefined') {
      // SSR - return default state
      return { ...DEFAULT_STATE };
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { ...DEFAULT_STATE };
    }

    const parsed = JSON.parse(stored);
    
    // Validate the stored state has all required properties
    if (
      typeof parsed.isExpanded === 'boolean' &&
      typeof parsed.showWarnings === 'boolean' &&
      typeof parsed.showRecommended === 'boolean' &&
      typeof parsed.showCompletedCourses === 'boolean'
    ) {
      return parsed;
    } else {
      // Invalid stored state, return defaults
      console.warn('Invalid legend state found in localStorage, using defaults');
      return { ...DEFAULT_STATE };
    }
  } catch (error) {
    console.warn('Error loading legend state from localStorage:', error);
    return { ...DEFAULT_STATE };
  }
}

/**
 * Save legend state to localStorage
 */
export function saveLegendState(state: LegendState): void {
  try {
    if (typeof window === 'undefined') {
      // SSR - do nothing
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Error saving legend state to localStorage:', error);
  }
}

/**
 * Update a specific property of the legend state and save it
 */
export function updateLegendState(updates: Partial<LegendState>): LegendState {
  const currentState = loadLegendState();
  const newState = { ...currentState, ...updates };
  saveLegendState(newState);
  return newState;
}
