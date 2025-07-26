// Utility functions for graph processing
// Contains helper functions for course processing, abbreviation, and other utilities

import type { Course } from '../../types.js';
import { courseCompletionService } from '../shared/courseCompletionService.js';

/**
 * Creates a placeholder course object for missing courses
 * @param courseId - The course ID
 * @returns Placeholder course object
 */
export function createMissingCourse(courseId: string): Course {
  return {
    id: courseId,
    title: "Course information not available",
    units: "?" as any, // Will display as "? units"
    description: "No course information available in the database.",
    requisites: [], // Missing courses have no prerequisites
    equivalentCourses: []
  };
}

/**
 * Abbreviates course IDs for better display in graph nodes
 * @param courseId - The full course ID
 * @returns Abbreviated course ID for display
 */
export function abbreviateCourseId(courseId: string): string {
  // Replace common department names with abbreviations for better display
  return courseId
    .replace(/^COMPTNG\s+/, 'PIC ')
    .replace(/^COM SCI\s+/, 'CS ');
}

/**
 * Generates a unique ID for a group node
 * @param counter - The current group counter
 * @returns Unique group ID
 */
export function generateGroupId(counter: number): string {
  return `group-${counter}`;
}

/**
 * Checks if a course is effectively completed including equivalent courses
 * @param courseId - The course ID to check
 * @param courseMap - Map of course ID to course data
 * @param userCompletedCourses - Set of completed course IDs
 * @param isCourseEffectivelyCompleted - Function to check effective completion
 * @returns Whether the course is effectively completed
 */
export function isCourseEffectivelyCompletedWithEquivalents(
  courseId: string,
  courseMap: Map<string, Course>,
  userCompletedCourses: Set<string>,
  isCourseEffectivelyCompleted: (courseId: string, equivalents: string[], completed: Set<string>) => boolean
): boolean {
  const course = courseMap.get(courseId);
  const equivalents = course?.equivalentCourses || [];
  return isCourseEffectivelyCompleted(courseId, equivalents, userCompletedCourses);
}

/**
 * Determines group color (simplified - all groups are the same now)  
 * @param options - Array of prerequisite options
 * @returns Group color for styling
 */
export function determineGroupColor(
  options: any[]
): 'prerequisite' {
  return 'prerequisite';
}

/**
 * Checks if a course should be shown based on completion status and display options
 * @param courseId - The course ID to check
 * @param showCompletedCourses - Whether completed courses should be shown
 * @param completionCheckFn - Function to check if course is completed (can use different completion services)
 * @returns true if the course should be shown, false if it should be filtered out
 */
export function shouldShowCourse(
  courseId: string,
  showCompletedCourses: boolean,
  completionCheckFn: (courseId: string) => boolean
): boolean {
  const isCompleted = completionCheckFn(courseId);
  const isInPlan = courseCompletionService.isInPlan(courseId);
  
  // Always show in-plan courses (purple), regardless of showCompletedCourses setting
  if (isInPlan) {
    return true;
  }
  
  // If the course is completed and we're not showing completed courses, filter it out
  if (isCompleted && !showCompletedCourses) {
    return false;
  }
  
  return true;
}

/**
 * Filters a list of course IDs based on completion status and display options
 * @param courseIds - Array of course IDs to filter
 * @param showCompletedCourses - Whether completed courses should be shown
 * @param completionCheckFn - Function to check if course is completed
 * @returns Filtered array of course IDs that should be shown
 */
export function filterCoursesToShow(
  courseIds: string[],
  showCompletedCourses: boolean,
  completionCheckFn: (courseId: string) => boolean
): string[] {
  return courseIds.filter(courseId => 
    shouldShowCourse(courseId, showCompletedCourses, completionCheckFn)
  );
}
