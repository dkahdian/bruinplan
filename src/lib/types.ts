// Type definitions for course and major data

// Allowed types for course requisites
export type CourseRequisiteType = 'Requisite' | 'Recommended';
export type CourseRequisiteLevel = 'Enforced' | 'Warning' | 'Unknown';

// Discriminated union for course requisites
export interface BaseCourseRequisite {
  type: CourseRequisiteType;
  course: string;
  minGrade?: string;
}

// Represents a regular course requisite with a level
export interface RegularCourseRequisite extends BaseCourseRequisite {
  type: 'Requisite';
  level: CourseRequisiteLevel;
}

// Specific types of course requisites with different levels
export interface UnknownCourseRequisite extends RegularCourseRequisite {
  level: 'Unknown';
}
export interface WarningCourseRequisite extends RegularCourseRequisite {
  level: 'Warning';
}
export interface EnforcedCourseRequisite extends RegularCourseRequisite {
  level: 'Enforced';
}


// Represents a recommended course requisite without a level
// This is a simplified version of the regular course requisite
// This does not affect the graph structure, but may be used for display purposes
// As far as the school is concerned, a recommended course is not truly a requisite
export interface RecommendedCourseRequisite extends BaseCourseRequisite {
  type: 'Recommended';
  // No level field
}

export type CourseRequisite = UnknownCourseRequisite | WarningCourseRequisite | EnforcedCourseRequisite | RecommendedCourseRequisite;

// Represents a group of requisites (e.g., one of several options required)
export interface RequisiteGroup {
  type: 'Group';
  needs: number; // how many options are required
  options: CourseRequirement[];
}

// A course requirement can be a single requisite or a group
export type CourseRequirement = CourseRequisite | RequisiteGroup;

// Main course interface matching the JSON structure
export interface Course {
  id: string;
  title: string;
  units: number;
  description: string;
  requisites: CourseRequirement[];
  equivalentCourses: string[];
}

// The overall structure of the course JSON file
export interface CourseList {
  courses: Course[];
}

// Placeholder for Major type (to be expanded when major JSON structure is known)
export interface Major {
  // TODO: define fields based on majors/Mathematics BS.json
}
