// Script to check if course JSON matches types and find missing prerequisites

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CourseListSchema } from '../src/lib/courseSchemas.js';
import type { Course, CourseRequirement } from '../src/lib/types.js';

// Get __filename and __dirname equivalents for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load all course JSON files in the courses directory
const coursesDir = path.join(__dirname, '../courses');
const courseFiles = fs.readdirSync(coursesDir).filter(f => f.endsWith('.json'));

let allCourses: Course[] = [];

for (const file of courseFiles) {
  const filePath = path.join(coursesDir, file);
  const raw = fs.readFileSync(filePath, 'utf-8');
  let parsed;
  try {
    parsed = JSON.parse(raw);  } catch (e: unknown) {
    console.error(`Failed to parse ${file}:`, (e as Error).message);
    continue;
  }
  // Validate with Zod
  const result = CourseListSchema.safeParse(parsed);
  if (!result.success) {
    console.error(`Schema validation failed for ${file}:`);
    console.error(result.error.format());
    continue;
  }
  for (const course of result.data.courses) {
    allCourses.push(course as Course);
    console.log(course.title);
  }
}

// Build a set of all course IDs
const courseIdSet = new Set(allCourses.map(c => c.id));

// Recursively collect all requisite course IDs from a CourseRequirement
function collectRequisiteIds(req: CourseRequirement): string[] {
  if (req.type === 'Group') {
    return req.options.flatMap(collectRequisiteIds);
  } else if (req.type === 'Requisite' || req.type === 'Recommended') {
    return [req.course];
  }
  return [];
}

// After loading, check for missing prerequisites
for (const course of allCourses) {
  for (const req of course.requisites) {
    const ids = collectRequisiteIds(req);
    for (const id of ids) {
      if (!courseIdSet.has(id)) {
        console.warn(`WARNING: Prerequisite course '${id}' for '${course.id}' not found in loaded courses.`);
      }
    }
  }
}
