/**
 * Course scheduling store management and persistence
 */
import { writable } from 'svelte/store';
import type { CourseSchedule } from '../../types.js';
import { STORAGE_KEYS } from '../../constants.js';

// Svelte stores for reactive state management
export const courseSchedulesStore = writable<CourseSchedule>({});

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
export function saveCourseSchedules(schedules: CourseSchedule): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEYS.courseSchedules, JSON.stringify(schedules));
  } catch (error) {
    console.error('Error saving course schedules:', error);
  }
}
