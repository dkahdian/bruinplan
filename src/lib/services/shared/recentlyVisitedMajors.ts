/**
 * Service for managing recently visited majors in localStorage
 */

const STORAGE_KEY = 'bruinplan-recently-visited-majors';
const MAX_RECENT_MAJORS = 3;

interface RecentMajor {
  id: string;
  name: string;
  school: string;
  department: string;
  visitedAt: number;
}

export class RecentlyVisitedMajorsService {
  private static instance: RecentlyVisitedMajorsService;
  
  static getInstance(): RecentlyVisitedMajorsService {
    if (!RecentlyVisitedMajorsService.instance) {
      RecentlyVisitedMajorsService.instance = new RecentlyVisitedMajorsService();
    }
    return RecentlyVisitedMajorsService.instance;
  }

  /**
   * Add a major to the recently visited list
   * Implements queue behavior: most recent at front, duplicates moved to front
   */
  addRecentMajor(major: Omit<RecentMajor, 'visitedAt'>): void {
    if (typeof window === 'undefined') return; // SSR guard

    try {
      const recentMajors = this.getRecentMajors();
      
      // Remove if already exists
      const filtered = recentMajors.filter(m => m.id !== major.id);
      
      // Add to front with current timestamp
      const updated = [
        { ...major, visitedAt: Date.now() },
        ...filtered
      ].slice(0, MAX_RECENT_MAJORS); // Keep only max allowed
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to save recently visited major:', error);
    }
  }

  /**
   * Get the list of recently visited majors
   */
  getRecentMajors(): RecentMajor[] {
    if (typeof window === 'undefined') return []; // SSR guard

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      const majors = JSON.parse(stored) as RecentMajor[];
      
      // Validate and clean up the data
      return majors
        .filter(major => 
          major && 
          typeof major.id === 'string' && 
          typeof major.name === 'string' &&
          typeof major.visitedAt === 'number'
        )
        .slice(0, MAX_RECENT_MAJORS);
        
    } catch (error) {
      console.warn('Failed to load recently visited majors:', error);
      return [];
    }
  }

  /**
   * Clear all recently visited majors
   */
  clearRecentMajors(): void {
    if (typeof window === 'undefined') return; // SSR guard

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear recently visited majors:', error);
    }
  }
}

// Export singleton instance
export const recentlyVisitedMajorsService = RecentlyVisitedMajorsService.getInstance();
