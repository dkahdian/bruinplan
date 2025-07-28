/**
 * Unified scheduling service exports
 * Re-exports all scheduling-related services with a clean API
 */

// Core scheduling
export { schedulingService } from './shared/scheduling.js';
export { courseSchedulesStore, completedCoursesStore, loadCourseSchedules } from './shared/courseScheduleStore.js';

// Validation
export { validationService, validationErrorsStore } from './shared/validation.js';

// Course completion
export { courseCompletionService } from './shared/completion.js';

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
export { majorRequirementsService } from './major/requirements.js';

// Initialize function
import { loadCourseSchedules } from './shared/courseScheduleStore.js';
import { schedulingService } from './shared/scheduling.js';

export function initializeSchedulingService(): void {
  loadCourseSchedules();
  
  // Auto-reassign past quarters to completed status
  schedulingService.reassignPastQuarters();
}
