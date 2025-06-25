// Script to find all prerequisite course codes not present in the course list

import fs from 'fs';
import type { Course, CourseRequirement } from '../src/lib/types.js';

interface CourseList {
  courses: Course[];
}

const data: CourseList = JSON.parse(fs.readFileSync('courses/Mathematics.json', 'utf-8'));

// Collect all course IDs in the main list
const courseIds = new Set(data.courses.map((c: Course) => c.id));

// Helper to recursively collect all course codes from requisites
function collectRequisiteCourses(reqs: CourseRequirement[], acc: Set<string>): void {
  for (const req of reqs) {
    if (req.type === 'Group') {
      collectRequisiteCourses(req.options, acc);
    } else if ('course' in req && req.course) {
      acc.add(req.course);
    }
  }
}

const allRequisiteCourses = new Set<string>();
for (const course of data.courses) {
  if (Array.isArray(course.requisites)) {
    collectRequisiteCourses(course.requisites, allRequisiteCourses);
  }
}

// Find all requisite courses not in the course list
const missing = Array.from(allRequisiteCourses).filter((code: string) => !courseIds.has(code));

console.log('Courses listed as prerequisites but not present in the course list:');
console.log(missing.sort());
