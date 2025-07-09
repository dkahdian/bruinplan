// Service to load courses from static JSON file
// This service is used by PrerequisiteGraph.svelte to load courses data
// The service fetches the courses data from a static JSON file
// This should run as little as possible since it requires fetching a file
// If the courses are already loaded, it should not fetch again

import { writable } from 'svelte/store';
import type { Course, CourseList } from '../types.js';

// Cache for loaded courses to avoid repeated fetches
let coursesCache: Course[] | null = null;
let courseMapCache: Map<string, Course> | null = null;

// Svelte store for the course map - accessible globally
export const courseMapStore = writable<Map<string, Course>>(new Map());

/**
 * Loads courses from the JSON file and returns both the courses array and a map for quick lookup
 * Uses caching to avoid repeated network requests
 * @returns Promise containing courses array and courseMap
 */
export async function loadCourses(): Promise<{ courses: Course[], courseMap: Map<string, Course> }> {
  // Return cached data if available
  if (coursesCache && courseMapCache) {
    return { courses: coursesCache, courseMap: courseMapCache };
  }

  try {
    const response = await fetch('/courses/Mathematics.json');
    // Get a list of courses from the JSON file
    const data: CourseList = await response.json();
    // Parse JSON data
    const courses = data.courses.filter(course => course.id);
    // Filter out incomplete courses; should do nothing if all courses are complete
    
    // Build course lookup map
    const courseMap = new Map<string, Course>();
    // Clear the courseMap before populating it
    // This ensures we don't have stale data from previous loads
    courses.forEach(course => {
      courseMap.set(course.id, course);
    });
    // Add each course to the map for quick lookup by ID
    
    // Cache the results
    coursesCache = courses;
    courseMapCache = courseMap;
    
    // Update the store
    courseMapStore.set(courseMapCache);
    
    return { courses, courseMap };
  } catch (error) {
    console.error('Failed to load courses:', error);
    throw error; // Re-throw to allow caller to handle the error
  }
}

/**
 * Clears the course cache - useful for testing or when data needs to be reloaded
 */
export function clearCoursesCache(): void {
  coursesCache = null;
  courseMapCache = null;
  courseMapStore.set(new Map());
}