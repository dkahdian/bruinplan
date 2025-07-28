// Type definitions for course and major data

export type CourseRequisite = {
  type: 'requisite';
  course: string;
}

// Represents a group of requisites (e.g., one of several options required)
export interface RequisiteGroup {
  type: 'group';
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

// Major requirement types - discriminated unions for type safety
export interface BaseMajorRequirement {
  type: 'course' | 'group';
}

// A single course requirement in a major
export interface MajorCourseRequirement extends BaseMajorRequirement {
  type: 'course';
  courseId: string;
}

// A group of course options in a major (e.g., "select 2 from these 5 courses")
export interface MajorGroupRequirement extends BaseMajorRequirement {
  type: 'group';
  title: string;
  description: string;
  needs: number; // how many courses must be selected from the options
  options: MajorRequirement[]; // recursive: groups can contain courses or other groups
}

// Union type for any major requirement
export type MajorRequirement = MajorCourseRequirement | MajorGroupRequirement;

// A section within a major (e.g., "Preparation for the Major", "The Major")
export interface MajorSection {
  id: string; // unique identifier for the section (e.g., "preparation", "major")
  title: string; // display title (e.g., "Preparation for the Major")
  description: string; // descriptive text for the section
  requirements: MajorRequirement[]; // list of course/group requirements in this section
}

// Main major interface matching the JSON structure
export interface Major {
  name: string; // full display name (e.g., "Mathematics BS")
  overview: string; // brief description of the major
  college: string; // college within UCLA (e.g., "College of Letters and Science")
  department: string; // department offering the major
  degreeLevel: string; // "Undergraduate" or "Graduate"
  degreeObjective: string; // "Bachelor of Science", "Bachelor of Arts", etc.
  sections: MajorSection[]; // ordered list of major sections
}

// ============================================================================
// MAJOR TYPES  
// ============================================================================

// For major list/directory functionality
export interface MajorInfo {
  name: string; // display name
  id: string; // URL-safe identifier
  college: string;
  department: string;
  degreeLevel: string;
  degreeObjective: string;
}

// ============================================================================
// QUARTERLY PLANNING TYPES  
// ============================================================================

// Quarter-based scheduling system types

// Course scheduling data structure
export interface CourseSchedule {
  [courseId: string]: number; // Quarter code: 0 = completed, 125 = Winter 2025, etc.
}

// Validation error/warning for courses
export interface ValidationError {
  courseId: string;
  quarterCode: number;
  message: string;
  prerequisiteId?: string; // For missing prerequisite errors
}

// Data layer index types
export interface CourseIndex {
  id: string;
  title: string;
  subject: string;
}

export interface MajorIndex {
  name: string;
  school: string;
  department?: string;
}
