// Service to load courses using the new data layer API
// This service provides a compatibility layer for components that still expect the old interface
// Uses the new data layer API for efficient per-subject loading and caching

import { writable } from 'svelte/store';
import type { Course } from '../../types.js';
import { getCourseIndex, getSubjectCourses } from '../../data-layer/api.js';

// Cache for loaded courses to avoid repeated fetches
let coursesCache: Course[] | null = null;
let courseMapCache: Map<string, Course> | null = null;

// Svelte store for the course map - accessible globally
export const courseMapStore = writable<Map<string, Course>>(new Map());



/**
 * Clears the course cache - useful for testing or when data needs to be reloaded
 */
export function clearCoursesCache(): void {
  // Clear local cache
  coursesCache = null;
  courseMapCache = null;
  courseMapStore.set(new Map());
  
  // Also clear the data layer cache for courses
  import('../../data-layer/api.js').then(({ clearCache }) => {
    clearCache();
  });
}