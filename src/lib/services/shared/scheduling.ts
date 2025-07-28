/**
 * Simplified scheduling service - focuses only on core scheduling operations
 */
import { get } from 'svelte/store';
import { courseSchedulesStore, saveCourseSchedules } from './courseScheduleStore.js';
import { isPastQuarter } from './quarterUtils.js';

/**
 * Main scheduling service class
 */
export class SchedulingService {
  /**
   * Get the schedule for a course
   */
  getSchedule(courseId: string): number {
    const schedules = get(courseSchedulesStore);
    return schedules[courseId] || 0;
  }
  
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
    const isCurrentlyCompleted = this.getSchedule(courseId) === 1;
    if (isCurrentlyCompleted) {
      this.markCourseIncomplete(courseId);
    } else {
      this.markCourseCompleted(courseId);
    }
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
  }

  /**
   * Clear all course schedules (both completed and planned)
   */
  clearAllSchedules(): void {
    courseSchedulesStore.set({});
    saveCourseSchedules({});
  }

  /**
   * Reassign courses from past quarters to completed status (quarterCode = 1)
   */
  reassignPastQuarters(): string[] {
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

    return reassignedCourses;
  }
}

// Export singleton instance
export const schedulingService = new SchedulingService();
