/**
 * Unified scheduling service exports
 * Re-exports all scheduling-related services with a clean API
 */

// Core scheduling
export { schedulingService } from './shared/coreSchedulingService.js';
export { courseSchedulesStore, completedCoursesStore, loadCourseSchedules } from './shared/courseScheduleStore.js';

// Validation
export { validationService, validationErrorsStore } from './shared/validationService.js';

// Course completion
export { courseCompletionService } from './shared/courseCompletionService.js';

// Quarter utilities
export { 
  getCurrentQuarterCode, 
  isPastQuarter, 
  formatQuarterCode, 
  getSmartQuarterRange 
} from './shared/quarterUtils.js';

// Drag and drop utilities
export { 
  handleCourseDragStart, 
  handleCourseDragEnd, 
  createCourseDragImage 
} from './shared/dragDropUtils.js';

// Major requirements
export { majorRequirementsService } from './major/majorRequirementsService.js';

// Initialize function
import { loadCourseSchedules } from './shared/courseScheduleStore.js';
import { schedulingService } from './shared/coreSchedulingService.js';

export function initializeSchedulingService(): void {
  loadCourseSchedules();
  
  // Auto-reassign past quarters to completed status
  const reassignedCourses = schedulingService.reassignPastQuarters();
  
  if (reassignedCourses.length > 0) {
    console.log(`Auto-reassigned ${reassignedCourses.length} courses from past quarters to completed:`, reassignedCourses);
  }
}
