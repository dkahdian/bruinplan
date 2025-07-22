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
 * Loads all courses from all subjects using the new data layer API
 * Uses caching to avoid repeated network requests
 * @returns Promise containing courses array and courseMap
 */
export async function loadCourses(): Promise<{ courses: Course[], courseMap: Map<string, Course> }> {
  // Return cached data if available
  if (coursesCache && courseMapCache) {
    return { courses: coursesCache, courseMap: courseMapCache };
  }

  try {
    // Get the course index to know all available subjects
    const courseIndex = await getCourseIndex();
    
    // Get unique subjects from the index
    const subjects = Array.from(new Set(courseIndex.map(course => course.subject)));
    
    // Load courses from all subjects
    const allCourses: Course[] = [];
    const courseMap = new Map<string, Course>();
    
    // Load courses for each subject
    for (const subject of subjects) {
      const subjectCourses = await getSubjectCourses(subject);
      allCourses.push(...subjectCourses);
      
      // Add to course map for quick lookup
      subjectCourses.forEach(course => {
        courseMap.set(course.id, course);
      });
    }
    
    // Cache the results
    coursesCache = allCourses;
    courseMapCache = courseMap;
    
    // Update the store
    courseMapStore.set(courseMapCache);
    
    return { courses: allCourses, courseMap };
  } catch (error) {
    console.error('Failed to load courses:', error);
    throw error; // Re-throw to allow caller to handle the error
  }
}

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