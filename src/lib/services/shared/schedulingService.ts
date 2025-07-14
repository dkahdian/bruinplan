import { writable, get } from 'svelte/store';
import type { CourseSchedule, ValidationError, CourseRequirement } from '../../types.js';
import { courseMapStore } from '../data/loadCourses.js';

// Storage keys for localStorage
const STORAGE_KEYS = {
  courseSchedules: 'bruinplan_course_schedules',
  lastVisit: 'bruinplan_last_visit'
};

// UCLA Quarter Calendar Implementation
const QUARTER_TRANSITIONS = {
  // January 1st: Fall → Winter
  WINTER_START: { month: 0, day: 1 }, // Jan 1
  
  // March 25th: Winter → Spring  
  SPRING_START: { month: 2, day: 25 }, // Mar 25
  
  // June 17th: Spring → Summer
  SUMMER_START: { month: 5, day: 17 }, // Jun 17
  
  // September 20th: Summer → Fall
  FALL_START: { month: 8, day: 20 }   // Sep 20
};

// Svelte stores for reactive state management
export const courseSchedulesStore = writable<CourseSchedule>({});
export const validationErrorsStore = writable<ValidationError[]>([]);

// Derived store for completed courses compatibility
export const completedCoursesStore = writable<Set<string>>(new Set());

// Update completedCoursesStore when courseSchedulesStore changes
courseSchedulesStore.subscribe(schedules => {
  const completedCourses = new Set<string>();
  for (const [courseId, quarterCode] of Object.entries(schedules)) {
    if (quarterCode === 1) {
      completedCourses.add(courseId);
    }
  }
  completedCoursesStore.set(completedCourses);
});


// Update validation when courseMapStore changes (courses are loaded)
courseMapStore.subscribe(courseMap => {
  if (courseMap.size > 0) {
    // Course map is loaded, update validation
    schedulingService.updateValidation();
  }
});

/**
 * Get the current quarter code based on the current date
 */
export function getCurrentQuarterCode(): number {
  const now = new Date();
  const year = now.getFullYear() % 100; // 2025 → 25
  let quarter = 4;
  if (isAfterTransition(now, QUARTER_TRANSITIONS.FALL_START)) {
    quarter = 4;
  } else if (isAfterTransition(now, QUARTER_TRANSITIONS.SUMMER_START)) {
    quarter = 3;
  } else if (isAfterTransition(now, QUARTER_TRANSITIONS.SPRING_START)) {
    quarter = 2;
  } else if (isAfterTransition(now, QUARTER_TRANSITIONS.WINTER_START)) {
    quarter = 1;
  } else {
    // Before Winter start (Jan 1), so we're in previous year's Fall
    return (year - 1) * 10 + 4;
  }
  return year * 10 + quarter;
}

/**
 * Check if a date is after a specific transition
 */
function isAfterTransition(date: Date, transition: { month: number, day: number }): boolean {
  const transitionDate = new Date(date.getFullYear(), transition.month, transition.day);
  return date >= transitionDate;
}

/**
 * Check if a quarter is in the past
 */
export function isPastQuarter(quarterCode: number): boolean {
  return quarterCode < getCurrentQuarterCode() && quarterCode !== 0;
}

/**
 * Format a quarter code into a readable string
 */
export function formatQuarterCode(quarterCode: number): string {
  if (quarterCode === 0) return 'Not scheduled';
  if (quarterCode === 1) return 'Completed';
  const year = Math.floor(quarterCode / 10);
  const season = quarterCode % 10;
  const seasonNames = {
    1: 'Winter',
    2: 'Spring', 
    3: 'Summer',
    4: 'Fall'
  };
  return `${seasonNames[season as keyof typeof seasonNames]} 20${year.toString().padStart(2, '0')}`;
}

/**
 * Get smart default quarter range based on existing schedules
 */
export function getSmartQuarterRange(courseSchedules: CourseSchedule): number {
  const scheduledQuarters = Object.values(courseSchedules)
    .filter((quarterCode): quarterCode is number => quarterCode > 1) // Exclude completed courses (0 or 1)
    .sort((a, b) => a - b); // Sort ascending
  if (scheduledQuarters.length === 0) {
    return 3; // Default range
  }
  const lastQuarter = scheduledQuarters[scheduledQuarters.length - 1];
  const currentQuarter = getCurrentQuarterCode();
  // Compute the range: split into year and quarter values
  const currentYear = Math.floor(currentQuarter / 10);
  const lastYear = Math.floor(lastQuarter / 10);
  const currentSeason = currentQuarter % 10;
  const lastSeason = lastQuarter % 10;
  // Calculate the difference in years and seasons
  const yearDifference = lastYear - currentYear;
  const seasonDifference = lastSeason - currentSeason;
  return 4 * yearDifference + seasonDifference + 1; // +1 to include the last quarter
}

/**
 * Load course schedules from localStorage
 */
export function loadCourseSchedules(): CourseSchedule {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.courseSchedules);
    if (stored) {
      const schedules = JSON.parse(stored) as CourseSchedule;
      courseSchedulesStore.set(schedules);
      return schedules;
    }
  } catch (error) {
    console.error('Error loading course schedules:', error);
  }
  
  return {};
}

/**
 * Save course schedules to localStorage
 */
function saveCourseSchedules(schedules: CourseSchedule): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEYS.courseSchedules, JSON.stringify(schedules));
  } catch (error) {
    console.error('Error saving course schedules:', error);
  }
}

/**
 * Main scheduling service class
 */
export class SchedulingService {
  constructor() {
    // Initialize validation when service is created
    this.updateValidation();
  }
  
  // Course scheduling methods
  
  /**
   * Schedule a course for a specific quarter
   */
  scheduleCourse(courseId: string, quarterCode: number): void {
    courseSchedulesStore.update(schedules => {
      const newSchedules = { ...schedules };
      newSchedules[courseId] = quarterCode;
      saveCourseSchedules(newSchedules);
      return newSchedules;
    });
    this.updateValidation();
  }
  
  /**
   * Get the schedule for a course
   */
  getSchedule(courseId: string): number {
    const schedules = get(courseSchedulesStore);
    return schedules[courseId] || 0; // Return 0 if not scheduled
    // Note that 1 means completed, 0 means not scheduled
  }
  
  /**
   * Check if a course is completed (quarterCode === 1)
   */
  isCompleted(courseId: string): boolean {
    const schedules = get(courseSchedulesStore);
    return schedules[courseId] === 1;
  }

  /**
   * Check if a course is effectively completed (either the course itself or any of its equivalents)
   */
  isCourseEffectivelyCompleted(courseId: string, equivalentCourses: string[] = [], completed: Set<string>): boolean {
    // Check if the main course is completed
    if (this.isCompleted(courseId)) {
      return true;
    }
    
    // Check if any equivalent course is completed
    return equivalentCourses.some(equivalent => this.isCompleted(equivalent));
  }

  /**
   * Get the source of completion for a course (original course ID, equivalent course ID, or null)
   */
  getCompletedCourseSource(courseId: string): string | null {
    // Check if the course itself is completed
    if (this.isCompleted(courseId)) {
      return courseId;
    }
    
    // Get equivalent courses from the global course map
    const globalCourseMap = get(courseMapStore);
    const course = globalCourseMap.get(courseId);
    const equivalentCourses = course?.equivalentCourses || [];
    
    // Check if any equivalent course is completed
    for (const equivalent of equivalentCourses) {
      if (this.isCompleted(equivalent)) {
        return equivalent;
      }
    }
    
    return null;
  }

  /**
   * Get the source of completion for a course within a group context
   */
  getCompletedCourseOfGroupSource(courseId: string, groupCourseIds: string[]): string | null {
    // Check if the course itself is completed
    if (this.isCompleted(courseId)) {
      return courseId;
    }
    
    // Get equivalent courses from the global course map
    const globalCourseMap = get(courseMapStore);
    const course = globalCourseMap.get(courseId);
    const equivalentCourses = course?.equivalentCourses || [];
    
    // Check if any equivalent course is completed, but only if it's not in the same group
    for (const equivalent of equivalentCourses) {
      if (this.isCompleted(equivalent) && !groupCourseIds.includes(equivalent)) {
        return equivalent;
      }
    }
    
    return null;
  }

  /**
   * Mark a course as completed (quarterCode = 1)
   */
  markCourseCompleted(courseId: string): void {
    this.scheduleCourse(courseId, 1);
  }

  /**
   * Mark a course as not completed (quarterCode = 0)
   */
  markCourseIncomplete(courseId: string): void {
    this.scheduleCourse(courseId, 0);
  }

  /**
   * Toggle completion status of a course
   */
  toggleCourseCompletion(courseId: string): void {
    const isCurrentlyCompleted = this.isCompleted(courseId);
    if (isCurrentlyCompleted) {
      this.markCourseIncomplete(courseId);
    } else {
      this.markCourseCompleted(courseId);
    }
  }

  /**
   * Get all completed courses as an array
   */
  getCompletedCoursesArray(): string[] {
    const schedules = get(courseSchedulesStore);
    return Object.keys(schedules).filter(courseId => schedules[courseId] === 1);
  }

  /**
   * Get all completed courses as a Set
   */
  getCompletedCoursesSet(): Set<string> {
    return new Set(this.getCompletedCoursesArray());
  }

  /**
   * Clear all completed courses
   */
  clearCompletedCourses(): void {
    courseSchedulesStore.update(schedules => {
      const newSchedules = { ...schedules };
      // Set all completed courses (quarterCode = 1) to not scheduled (quarterCode = 0)
      for (const courseId in newSchedules) {
        if (newSchedules[courseId] === 1) {
          newSchedules[courseId] = 0;
        }
      }
      saveCourseSchedules(newSchedules);
      return newSchedules;
    });
    this.updateValidation();
  }

  /**
   * Clear all course schedules (both completed and planned)
   */
  clearAllSchedules(): void {
    courseSchedulesStore.set({});
    saveCourseSchedules({});
    this.updateValidation();
  }

  // Validation methods (basic structure - will be expanded in later steps)
  
  /**
   * Update validation errors after schedule changes
   */
  updateValidation(): void {
    const errors = this.validateSchedule();
    validationErrorsStore.set(errors);
  }
  
  /**
   * Validate all course schedules
   */
  validateSchedule(): ValidationError[] {
    const schedules = get(courseSchedulesStore);
    const courseMap = get(courseMapStore);
    const validationErrors: ValidationError[] = [];
    
    // Check all scheduled courses
    for (const [courseId, quarterCode] of Object.entries(schedules)) {
      const courseErrors = this.validateCourse(courseId);
      validationErrors.push(...courseErrors);
    }
    
    return validationErrors;
  }
  
  /**
   * Validate a specific course schedule
   */
  validateCourse(courseId: string): ValidationError[] {
    const schedules = get(courseSchedulesStore);
    const courseMap = get(courseMapStore);
    const validationErrors: ValidationError[] = [];
    
    const quarterCode = schedules[courseId];
    if (!quarterCode) return validationErrors;
    
    const course = courseMap.get(courseId);
    if (!course) return validationErrors;
    
    // Skip validation for completed courses
    if (quarterCode === 1) return validationErrors;
    
    // Check prerequisites
    if (course.requisites && course.requisites.length > 0) {
      const missingPrereqs = this.checkPrerequisites(course.requisites, courseId, quarterCode);
      validationErrors.push(...missingPrereqs);
    }
    
    // Check for future quarter warnings
    const futureWarnings = this.checkFutureQuarterWarnings(courseId, quarterCode);
    validationErrors.push(...futureWarnings);
    
    return validationErrors;
  }
  
  /**
   * Check prerequisites for a course
   */
  private checkPrerequisites(prerequisites: CourseRequirement[], courseId: string, quarterCode: number): ValidationError[] {
    const schedules = get(courseSchedulesStore);
    const errors: ValidationError[] = [];
    
    const checkRequirementRecursive = (requirement: CourseRequirement, addErrors: boolean = true): boolean => {
      if (requirement.type === 'Group') {
        // Group requirement - check if enough options are satisfied
        // First pass: check satisfaction without adding errors
        const satisfiedOptions = requirement.options.filter((option: CourseRequirement) => 
          checkRequirementRecursive(option, false) // Don't add errors for individual options yet
        );
        
        if (satisfiedOptions.length >= requirement.needs) {
          // Group is satisfied, no errors needed
          return true;
        } else {
          // Group is not satisfied, generate proper error message
          if (addErrors) {
            const unsatisfiedOptions = requirement.options.filter((option: CourseRequirement) => 
              !checkRequirementRecursive(option, false)
            );
            const missingCount = requirement.needs - satisfiedOptions.length;
            
            // Get course IDs from unsatisfied options
            const courseIds = unsatisfiedOptions
              .filter(option => option.type === 'Requisite' || option.type === 'Recommended')
              .map(option => (option as any).course)
              .filter(Boolean);
            
            let message: string;
            if (courseIds.length <= 3) {
              message = `Needs ${missingCount} from {${courseIds.join(', ')}}`;
            } else {
              const displayedCourses = courseIds.slice(0, 3);
              const remainingCount = courseIds.length - 3;
              message = `Needs ${missingCount} from {${displayedCourses.join(', ')}}...(and ${remainingCount} more)`;
            }
            
            errors.push({
              type: 'error',
              courseId,
              quarterCode,
              message
            });
          }
          return false;
        }
      }
      
      if (requirement.type === 'Requisite' || requirement.type === 'Recommended') {
        // Single course requirement
        const prereqCourse = requirement.course;
        const prereqQuarter = schedules[prereqCourse];
        
        if (!prereqQuarter) {
          // Not scheduled at all
          if (addErrors) {
            const errorType = requirement.type === 'Requisite' && 
                             (requirement as any).level === 'Enforced' ? 'error' : 'warning';
            
            errors.push({
              type: errorType,
              courseId,
              quarterCode,
              message: `Missing ${prereqCourse}`,
              prerequisiteId: prereqCourse
            });
          }
          return false;
        }
        
        // Check if prerequisite is scheduled before this course
        if (prereqQuarter !== 1 && prereqQuarter >= quarterCode) {
          if (addErrors) {
            const errorType = requirement.type === 'Requisite' && 
                             (requirement as any).level === 'Enforced' ? 'error' : 'warning';
            
            errors.push({
              type: errorType,
              courseId,
              quarterCode,
              message: `Schedule ${prereqCourse} before this course`,
              prerequisiteId: prereqCourse
            });
          }
          return false;
        }
        
        return true;
      }
      
      return true;
    };
    
    // Check all requirements and add errors for top-level failures
    prerequisites.forEach(requirement => {
      checkRequirementRecursive(requirement, true);
    });
    
    return errors;
  }
  
  /**
   * Check for future quarter warnings
   */
  private checkFutureQuarterWarnings(courseId: string, quarterCode: number): ValidationError[] {
    const errors: ValidationError[] = [];
    const currentQuarter = getCurrentQuarterCode();
    
    // If course is scheduled more than 2 quarters in the future, show warning
    if (quarterCode > currentQuarter + 20) { // 20 = 2 years ahead
      errors.push({
        type: 'warning',
        courseId,
        quarterCode,
        message: `Course scheduled far in the future`
      });
    }
    
    return errors;
  }
  
  // Auto-reassignment methods
  
  /**
   * Reassign courses from past quarters to completed status (quarterCode = 1)
   */
  reassignPastQuarters(): string[] {
    const schedules = get(courseSchedulesStore);
    const reassignedCourses: string[] = [];

    courseSchedulesStore.update(currentSchedules => {
      const newSchedules = { ...currentSchedules };

      for (const [courseId, quarterCode] of Object.entries(newSchedules)) {
        const qCode = Number(quarterCode);
        if (isPastQuarter(qCode)) {
          newSchedules[courseId] = 1; // Mark as completed
          reassignedCourses.push(courseId);
        }
      }

      if (reassignedCourses.length > 0) {
        saveCourseSchedules(newSchedules);
      }

      return newSchedules;
    });

    if (reassignedCourses.length > 0) {
      this.updateValidation();
    }

    return reassignedCourses;
  }
}

// Export singleton instance
export const schedulingService = new SchedulingService();

// Initialize data on module load
export function initializeSchedulingService(): void {
  loadCourseSchedules();
}

