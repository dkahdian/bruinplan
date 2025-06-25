// Zod schemas for validating CourseList and related types at runtime
import { z } from 'zod';

// Allowed types for course requisites
enum CourseRequisiteType {
  Requisite = 'Requisite',
  Recommended = 'Recommended',
}
enum CourseRequisiteLevel {
  Enforced = 'Enforced',
  Warning = 'Warning',
  Unknown = 'Unknown',
}

// BaseCourseRequisite
const BaseCourseRequisiteSchema = z.object({
  type: z.enum(['Requisite', 'Recommended']),
  course: z.string(),
  minGrade: z.string().optional(),
});

// RegularCourseRequisite
const RegularCourseRequisiteSchema = BaseCourseRequisiteSchema.extend({
  type: z.literal('Requisite'),
  level: z.enum(['Enforced', 'Warning', 'Unknown']),
});

const UnknownCourseRequisiteSchema = RegularCourseRequisiteSchema.extend({
  level: z.literal('Unknown'),
});
const WarningCourseRequisiteSchema = RegularCourseRequisiteSchema.extend({
  level: z.literal('Warning'),
});
const EnforcedCourseRequisiteSchema = RegularCourseRequisiteSchema.extend({
  level: z.literal('Enforced'),
});

// RecommendedCourseRequisite
const RecommendedCourseRequisiteSchema = BaseCourseRequisiteSchema.extend({
  type: z.literal('Recommended'),
  // No level field
});

// CourseRequisite union
const CourseRequisiteSchema = z.union([
  UnknownCourseRequisiteSchema,
  WarningCourseRequisiteSchema,
  EnforcedCourseRequisiteSchema,
  RecommendedCourseRequisiteSchema,
]);

// RequisiteGroup (recursive)
const RequisiteGroupSchema: z.ZodType<any> = z.lazy(() => z.object({
  type: z.literal('Group'),
  needs: z.number(),
  options: z.array(CourseRequirementSchema),
}));

// CourseRequirement (recursive union)
const CourseRequirementSchema: z.ZodType<any> = z.lazy(() => z.union([
  CourseRequisiteSchema,
  RequisiteGroupSchema,
]));

// Course
export const CourseSchema = z.object({
  id: z.string(),
  title: z.string(),
  units: z.number(),
  description: z.string(),
  requisites: z.array(CourseRequirementSchema),
  equivalentCourses: z.array(z.string()),
});

// CourseList
export const CourseListSchema = z.object({
  courses: z.array(CourseSchema),
});
