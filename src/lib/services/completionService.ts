import { writable } from 'svelte/store';

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
