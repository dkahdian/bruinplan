import { writable, get } from 'svelte/store';
import { courseMapStore } from '../data/loadCourses.js';

const STORAGE_KEY = 'bruinplan-completed-courses';

// Svelte store for completed courses
export const completedCourses = writable<Set<string>>(new Set());

/**
 * Load completed courses from localStorage
 */
export function loadCompletedCourses(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const courseArray = JSON.parse(stored) as string[];
      const courseSet = new Set(courseArray);
      completedCourses.set(courseSet);
      return courseSet;
    }
  } catch (error) {
    console.error('Error loading completed courses:', error);
  }
  
  return new Set();
}

/**
 * Save completed courses to localStorage
 */
function saveCompletedCourses(courses: Set<string>): void {
  if (typeof window === 'undefined') return;
  
  try {
    const courseArray = Array.from(courses);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(courseArray));
  } catch (error) {
    console.error('Error saving completed courses:', error);
  }
}

/**
 * Mark a course as completed
 */
export function markCourseCompleted(courseId: string): void {
  completedCourses.update(courses => {
    const newCourses = new Set(courses);
    newCourses.add(courseId);
    saveCompletedCourses(newCourses);
    return newCourses;
  });
}

/**
 * Mark a course as not completed
 */
export function markCourseIncomplete(courseId: string): void {
  completedCourses.update(courses => {
    const newCourses = new Set(courses);
    newCourses.delete(courseId);
    saveCompletedCourses(newCourses);
    return newCourses;
  });
}

/**
 * Check if a course is completed
 */
export function isCourseCompleted(courseId: string, completed: Set<string>): boolean {
  return completed.has(courseId);
}

/**
 * Check if a course is effectively completed (either the course itself or any of its equivalents)
 */
export function isCourseEffectivelyCompleted(courseId: string, equivalentCourses: string[] = [], completed: Set<string>): boolean {
  // Check if the main course is completed
  // Check if any equivalent course is completed
  return completed.has(courseId) || equivalentCourses.some(equivalent => completed.has(equivalent));
}

/**
 * Get the source of completion for a course (original course ID, equivalent course ID, or null)
 * Returns the course ID that is actually completed:
 * - If the course itself is completed, returns the original course ID
 * - If completed via an equivalent, returns the equivalent course ID  
 * - If not completed at all, returns null
 */
export function getCompletedCourseSource(courseId: string): string | null {
  const completed = get(completedCourses);
  
  // Check if the course itself is completed
  if (completed.has(courseId)) {
    return courseId;
  }
  
  // Get equivalent courses from the global course map
  const globalCourseMap = get(courseMapStore);
  const course = globalCourseMap.get(courseId);
  const equivalentCourses = course?.equivalentCourses || [];
  
  // Check if any equivalent course is completed
  for (const equivalent of equivalentCourses) {
    if (completed.has(equivalent)) {
      return equivalent;
    }
  }
  
  return null;
}

/**
 * Get the source of completion for a course within a group context (original course ID, equivalent course ID, or null)
 * This prevents double-counting when equivalent courses are both present in the same group.
 * Returns the course ID that is actually completed:
 * - If the course itself is completed, returns the original course ID
 * - If completed via an equivalent that is NOT in the group, returns the equivalent course ID
 * - If completed via an equivalent that IS in the group, returns null (to avoid double-counting)
 * - If not completed at all, returns null
 */
export function getCompletedCourseOfGroupSource(courseId: string, groupCourseIds: string[]): string | null {
  const completed = get(completedCourses);
  
  // Check if the course itself is completed
  if (completed.has(courseId)) {
    return courseId;
  }
  
  // Get equivalent courses from the global course map
  const globalCourseMap = get(courseMapStore);
  const course = globalCourseMap.get(courseId);
  const equivalentCourses = course?.equivalentCourses || [];
  
  // Check if any equivalent course is completed, but only if it's not in the same group
  for (const equivalent of equivalentCourses) {
    if (completed.has(equivalent) && !groupCourseIds.includes(equivalent)) {
      return equivalent;
    }
  }
  
  return null;
}

/**
 * Toggle completion status of a course
 */
export function toggleCourseCompletion(courseId: string): void {
  completedCourses.update(courses => {
    const newCourses = new Set(courses);
    if (newCourses.has(courseId)) {
      newCourses.delete(courseId);
    } else {
      newCourses.add(courseId);
    }
    saveCompletedCourses(newCourses);
    return newCourses;
  });
}

/**
 * Get all completed courses as an array
 */
export function getCompletedCoursesArray(completed: Set<string>): string[] {
  return Array.from(completed);
}

/**
 * Clear all completed courses
 */
export function clearCompletedCourses(): void {
  completedCourses.set(new Set());
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}
