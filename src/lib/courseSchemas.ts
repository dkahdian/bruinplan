// Zod schemas for validating CourseList and related types at runtime
import { z } from 'zod';

// BaseCourseRequisite
const CourseRequisiteSchema = z.object({
  type: z.literal('requisite'),
  course: z.string(),
});


// RequisiteGroup (recursive)
const RequisiteGroupSchema: z.ZodType<any> = z.lazy(() => z.object({
  type: z.literal('group'),
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
  description: z.string(),
  units: z.number(),
  subject: z.string(),
  catalogNumber: z.string(),
  courseNumber: z.string(),
  level: z.string(),
  grading: z.string(),
  termsOffered: z.array(z.string()),
  prerequisiteString: z.string(),
  corerequisiteString: z.string(),
  requirements: z.array(z.object({
    id: z.string(),
    parentId: z.string().optional(),
    type: z.enum(['single', 'group']),
    operator: z.string().optional(),
    courses: z.array(z.string()).optional(),
    groups: z.array(z.string()).optional(),
    grade: z.string().optional(),
    allowsSubstitution: z.boolean().optional()
  })).optional(),
  equivalents: z.array(z.string()).optional(),
  url: z.string().optional()
});

export const CourseListSchema = z.array(CourseSchema);
