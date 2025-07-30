/**
 * Collapse state management service for major sections/groups
 * Persists expand/collapse states in localStorage per major
 */

const STORAGE_KEY = 'bruinplan-collapse-states';

interface CollapseState {
  [majorId: string]: {
    [groupId: string]: boolean; // true = collapsed, false = expanded
  };
}

class CollapseStateService {
  private collapseStates: CollapseState = {};

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Load collapse states from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') {
      // Server-side rendering - skip localStorage access
      return;
    }
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.collapseStates = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load collapse states from localStorage:', error);
      this.collapseStates = {};
    }
  }

  /**
   * Save collapse states to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') {
      // Server-side rendering - skip localStorage access
      return;
    }
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.collapseStates));
    } catch (error) {
      console.warn('Failed to save collapse states to localStorage:', error);
    }
  }

  /**
   * Get collapse state for a specific group in a major
   */
  isCollapsed(majorId: string, groupId: string): boolean {
    return this.collapseStates[majorId]?.[groupId] ?? false;
  }

  /**
   * Set collapse state for a specific group in a major
   */
  setCollapsed(majorId: string, groupId: string, collapsed: boolean): void {
    if (!this.collapseStates[majorId]) {
      this.collapseStates[majorId] = {};
    }
    
    this.collapseStates[majorId][groupId] = collapsed;
    this.saveToStorage();
  }

  /**
   * Toggle collapse state for a specific group in a major
   */
  toggle(majorId: string, groupId: string): boolean {
    const newState = !this.isCollapsed(majorId, groupId);
    this.setCollapsed(majorId, groupId, newState);
    return newState;
  }

  /**
   * Get all collapse states for a major (useful for initialization)
   */
  getMajorCollapseStates(majorId: string): Record<string, boolean> {
    return this.collapseStates[majorId] ? { ...this.collapseStates[majorId] } : {};
  }

  /**
   * Set initial auto-collapse state for large groups (only if not already set by user)
   */
  setAutoCollapseIfNotSet(majorId: string, groupId: string, shouldAutoCollapse: boolean): void {
    // Only set if user hasn't already configured this group
    if (this.collapseStates[majorId]?.[groupId] === undefined) {
      this.setCollapsed(majorId, groupId, shouldAutoCollapse);
    }
  }
}

// Export singleton instance
export const collapseStateService = new CollapseStateService();
