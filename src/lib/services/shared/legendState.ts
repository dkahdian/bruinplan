// Legend state persistence service
// Handles saving and loading legend state to/from localStorage
import { STORAGE_KEYS } from '../../constants.js';

export interface LegendState {
  isExpanded: boolean;
  showWarnings: boolean;
  showCompletedCourses: boolean;
}

// Default legend state
const DEFAULT_STATE: LegendState = {
  isExpanded: true,
  showWarnings: true,
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

    const stored = localStorage.getItem(STORAGE_KEYS.legendState);
    if (!stored) {
      return { ...DEFAULT_STATE };
    }

    const parsed = JSON.parse(stored);
    if (
      typeof parsed.isExpanded === 'boolean' &&
      typeof parsed.showWarnings === 'boolean' &&
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

    localStorage.setItem(STORAGE_KEYS.legendState, JSON.stringify(state));
  } catch (error) {
    console.warn('Error saving legend state to localStorage:', error);
  }
}
