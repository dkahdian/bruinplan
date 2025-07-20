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
  units: z.number(),
  description: z.string(),
  requisites: z.array(CourseRequirementSchema),
  equivalentCourses: z.array(z.string()),
});

// CourseList
export const CourseListSchema = z.object({
  courses: z.array(CourseSchema),
});
