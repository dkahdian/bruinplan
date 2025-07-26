/**
 * Course completion tracking service
 */
import { get } from 'svelte/store';
import { courseMapStore } from './coursesStore.js';
import { courseSchedulesStore } from './courseScheduleStore.js';
import type { Course } from '../../types.js';

/**
 * Course completion service class
 */
export class CourseCompletionService {
  /**
   * Check if a course is completed (quarterCode === 1)
   */
  isCompleted(courseId: string): boolean {
    const schedules = get(courseSchedulesStore);
    return schedules[courseId] === 1;
  }

  /**
   * Check if a course is in-plan (has a quarter assignment, quarterCode > 1)
   */
  isInPlan(courseId: string): boolean {
    const schedules = get(courseSchedulesStore);
    const quarterCode = schedules[courseId];
    return quarterCode !== undefined && quarterCode > 1;
  }

  /**
   * Check if a course is scheduled (either completed or in-plan)
   */
  isScheduled(courseId: string): boolean {
    const schedules = get(courseSchedulesStore);
    const quarterCode = schedules[courseId];
    return quarterCode !== undefined && quarterCode >= 1;
  }

  /**
   * Get the quarter code for a course (1 = completed, >1 = specific quarter, undefined = not scheduled)
   */
  getQuarterCode(courseId: string): number | undefined {
    const schedules = get(courseSchedulesStore);
    return schedules[courseId];
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
    const globalCourseMap = get(courseMapStore) as Map<string, Course>;
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
    const globalCourseMap = get(courseMapStore) as Map<string, Course>;
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
}

// Export singleton instance
export const courseCompletionService = new CourseCompletionService();
