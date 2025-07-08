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

// The overall structure of a major JSON file
export interface MajorData {
  // For consistency with CourseList, though major files contain a single major
  // This allows for potential future support of multiple majors per file
  major: Major;
}

// Alternative simpler structure that matches current JSON format exactly
// (Major file contains the major object directly, not wrapped in a container)
export type MajorFile = Major;

// Utility types for major management and visualization

// For caching and managing loaded majors
export interface MajorCache {
  [majorId: string]: Major;
}

// For major list/directory functionality
export interface MajorInfo {
  name: string; // display name
  id: string; // URL-safe identifier
  college: string;
  department: string;
  degreeLevel: string;
  degreeObjective: string;
}

// For major graph visualization - extends course graph capabilities
export interface MajorGraphNode {
  id: string; // course ID or group ID
  type: 'course' | 'group' | 'section-header';
  label: string; // display name
  section?: string; // which major section this belongs to
  isRequired?: boolean; // for group nodes, whether this specific option is required
  groupInfo?: {
    needs: number;
    totalOptions: number;
    parentGroupId?: string;
  };
}

// For tracking major progress and requirements
export interface MajorProgress {
  majorId: string;
  completedCourses: Set<string>;
  totalRequiredCourses: number;
  completedRequiredCourses: number;
  sectionProgress: {
    [sectionId: string]: {
      completed: number;
      total: number;
      groupsStatus: {
        [groupTitle: string]: {
          needed: number;
          selected: number;
          options: string[];
        };
      };
    };
  };
}
