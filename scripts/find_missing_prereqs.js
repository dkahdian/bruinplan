// Script to find all prerequisite course codes not present in the course list

import fs from 'fs';
const data = JSON.parse(fs.readFileSync('courses/Mathematics.json', 'utf-8'));

// Collect all course IDs in the main list
const courseIds = new Set(data.courses.map(c => c.id));

// Helper to recursively collect all course codes from requisites
function collectRequisiteCourses(reqs, acc) {
  for (const req of reqs) {
    if (req.type === 'Group') {
      collectRequisiteCourses(req.options, acc);
    } else if (req.course) {
      acc.add(req.course);
    }
  }
}

const allRequisiteCourses = new Set();
for (const course of data.courses) {
  if (Array.isArray(course.requisites)) {
    collectRequisiteCourses(course.requisites, allRequisiteCourses);
  }
}

// Find all requisite courses not in the course list
const missing = Array.from(allRequisiteCourses).filter(code => !courseIds.has(code));

console.log('Courses listed as prerequisites but not present in the course list:');
console.log(missing.sort());
