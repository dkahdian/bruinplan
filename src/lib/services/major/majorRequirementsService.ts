/**
 * Major requirements service - handles complex logic for major requirement displays
 */
import { get } from 'svelte/store';
import type { MajorRequirement, ValidationError } from '../../types.js';
import { courseSchedulesStore, completedCoursesStore } from '../shared/courseScheduleStore.js';
import { validationErrorsStore } from '../shared/validationService.js';
import { courseCompletionService } from '../shared/courseCompletionService.js';
import { schedulingService } from '../shared/coreSchedulingService.js';

/**
 * Major requirements service class
 */
export class MajorRequirementsService {
  /**
   * Get course status for a requirement
   */
  getCourseStatus(courseId: string) {
    const completedSource = courseCompletionService.getCompletedCourseSource(courseId);
    const isEffectivelyCompleted = completedSource !== null;
    const isDirectlyCompleted = get(completedCoursesStore).has(courseId);
    const isScheduled = schedulingService.getSchedule(courseId) > 0;
    const courseErrors = get(validationErrorsStore).filter((error: ValidationError) => error.courseId === courseId);
    const hasErrors = courseErrors.some((error: ValidationError) => error.type === 'error');
    const hasWarnings = courseErrors.some((error: ValidationError) => error.type === 'warning');
    
    const validationBgClass = hasErrors ? 'bg-red-200 border-red-300' : 
                             hasWarnings ? 'bg-orange-100 border-orange-300' : 
                             (isScheduled && !isDirectlyCompleted) ? 'bg-purple-100 border-purple-300' : '';
    
    return {
      completedSource,
      isEffectivelyCompleted,
      isDirectlyCompleted,
      isScheduled,
      courseErrors,
      hasErrors,
      hasWarnings,
      validationBgClass
    };
  }

  /**
   * Get course status for group option
   */
  getGroupCourseStatus(courseId: string, groupCourseIds: string[]) {
    const completedSource = courseCompletionService.getCompletedCourseOfGroupSource(courseId, groupCourseIds);
    const isEffectivelyCompleted = completedSource !== null;
    const isDirectlyCompleted = get(completedCoursesStore).has(courseId);
    const isScheduled = schedulingService.getSchedule(courseId) > 0;
    
    return {
      completedSource,
      isEffectivelyCompleted,
      isDirectlyCompleted,
      isScheduled
    };
  }

  /**
   * Calculate group completion statistics
   */
  getGroupStats(requirement: MajorRequirement) {
    if (requirement.type !== 'group') {
      throw new Error('This method is only for group requirements');
    }

    const groupCourseIds = requirement.options.filter(option => option.type === 'course').map(option => option.courseId);
    
    const groupCompletedCount = requirement.options.filter(option => 
      option.type === 'course' && courseCompletionService.getCompletedCourseOfGroupSource(option.courseId, groupCourseIds) !== null
    ).length;
    
    const groupScheduledCount = requirement.options.filter(option => 
      option.type === 'course' && schedulingService.getSchedule(option.courseId) > 0 && 
      courseCompletionService.getCompletedCourseOfGroupSource(option.courseId, groupCourseIds) === null
    ).length;
    
    const groupRequiredCount = requirement.needs;
    const groupPlannedCount = Math.min(groupCompletedCount + groupScheduledCount, groupRequiredCount);
    const groupCompletedProgress = Math.min(groupCompletedCount, groupRequiredCount);
    const groupScheduledProgress = Math.min(groupScheduledCount, groupRequiredCount - groupCompletedCount);
    
    return {
      groupCourseIds,
      groupCompletedCount,
      groupScheduledCount,
      groupRequiredCount,
      groupPlannedCount,
      groupCompletedProgress,
      groupScheduledProgress
    };
  }

  /**
   * Get CSS classes for course display
   */
  getCourseDisplayClasses(courseStatus: ReturnType<typeof this.getCourseStatus>) {
    const { validationBgClass, isEffectivelyCompleted, isScheduled } = courseStatus;
    
    if (validationBgClass) {
      return validationBgClass;
    }
    
    if (isEffectivelyCompleted) {
      return 'bg-green-100 hover:bg-green-200 border-green-200';
    }
    
    if (isScheduled) {
      return 'bg-purple-100 border-purple-300 hover:bg-purple-200';
    }
    
    return 'bg-gray-50 hover:bg-gray-100 border-gray-200';
  }

  /**
   * Get CSS classes for group course display
   */
  getGroupCourseDisplayClasses(courseStatus: ReturnType<typeof this.getGroupCourseStatus>) {
    const { isEffectivelyCompleted, isScheduled } = courseStatus;
    
    if (isEffectivelyCompleted) {
      return 'bg-green-100 hover:bg-green-200 border-green-200';
    }
    
    if (isScheduled) {
      return 'bg-purple-100 border-purple-300 hover:bg-purple-200';
    }
    
    return 'bg-white hover:bg-gray-50 border-gray-200';
  }
}

// Export singleton instance
export const majorRequirementsService = new MajorRequirementsService();
