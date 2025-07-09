// Utility functions for graph processing
// Contains helper functions for course processing, abbreviation, and other utilities

import type { Course } from '../../types.js';

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
 * Determines the edge type based on course requirement
 * @param requirement - The course requirement
 * @returns Edge type for styling
 */
export function getEdgeType(requirement: any): 'enforced' | 'warning' | 'recommended' {
  if (requirement.type === 'Recommended') {
    return 'recommended';
  }
  return requirement.level === 'Enforced' ? 'enforced' : 'warning';
}

/**
 * Determines group color based on the strictest prerequisite type in the group
 * @param options - Array of prerequisite options
 * @param showWarnings - Whether warnings are being shown
 * @returns Group color for styling
 */
export function determineGroupColor(
  options: any[],
  showWarnings: boolean
): 'enforced' | 'warning' | 'recommended' {
  let groupColor: 'enforced' | 'warning' | 'recommended' = 'recommended';
  
  for (const option of options) {
    if (option.type === 'Requisite') {
      if (option.level === 'Enforced') {
        groupColor = 'enforced';
        break;
      } else if (option.level === 'Warning' && showWarnings) {
        groupColor = 'warning';
      }
    }
  }
  
  return groupColor;
}
