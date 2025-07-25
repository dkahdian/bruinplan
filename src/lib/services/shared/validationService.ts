/**
 * Course validation service for prerequisite checking and error reporting
 */
import { writable, get } from 'svelte/store';
import type { ValidationError, CourseRequirement, Course } from '../../types.js';
import { courseMapStore } from './coursesStore.js';
import { courseSchedulesStore } from './courseScheduleStore.js';
import { getCurrentQuarterCode } from './quarterUtils.js';

// Store for validation errors
export const validationErrorsStore = writable<ValidationError[]>([]);

/**
 * Course validation service class
 */
export class ValidationService {
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
    const courseMap = get(courseMapStore) as Map<string, Course>;
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
      if (requirement.type === 'group') {
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
              .filter(option => option.type === 'requisite')
              .map(option => (option as any).course)
              .filter(Boolean);
            
            let message: string;
            if (courseIds.length <= 3) {
              message = `Needs ${missingCount} from (${courseIds.join(', ')})`;
            } else {
              const displayedCourses = courseIds.slice(0, 3);
              const remainingCount = courseIds.length - 3;
              message = `Needs ${missingCount} from (${displayedCourses.join(', ')})...(and ${remainingCount} more)`;
            }
            
            errors.push({
              courseId,
              quarterCode,
              message
            });
          }
          return false;
        }
      }
      
      if (requirement.type === 'requisite') {
        // Single course requirement
        const prereqCourse = requirement.course;
        const prereqQuarter = schedules[prereqCourse];
        
        if (!prereqQuarter) {
          // Not scheduled at all
          if (addErrors) {
            errors.push({
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
            // All prerequisites are treated as warnings now            
            errors.push({
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
        courseId,
        quarterCode,
        message: `Course scheduled far in the future`
      });
    }
    
    return errors;
  }

}

// Export singleton instance
export const validationService = new ValidationService();

// Update validation when courseMapStore changes (courses are loaded)
courseMapStore.subscribe((courseMap: Map<string, Course>) => {
  if (courseMap.size > 0) {
    // Course map is loaded, update validation
    validationService.updateValidation();
  }
});
