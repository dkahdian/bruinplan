# Data Specification: BruinPlan

This document describes the structure and expected contents of the core data files used in BruinPlan.

---

## 1. `subjects.json`

- **Location:** `static/subjects.json`
- **Format:** JSON object with a `schools` array.
- **Purpose:** Lists all schools and their subject areas (departments/subjects).

```json
{
  "schools": [
    {
      "name": "School Name",
      "code": "SCHOOL_CODE",
      "subjectAreas": [
        { "name": "Subject Name", "code": "SUBJECT_CODE" },
        // ...
      ]
    },
    // ...
  ]
}
```

---

## 2. `majors.json`

- **Location:** `static/majors.json`
- **Format:** Array of major objects.
- **Purpose:** Lists all majors and their subject dependencies.

```json
[
  {
    "name": "Major Name",
    "department": "Department Name",
    "Dependencies": ["SUBJECT_CODE_1", "SUBJECT_CODE_2" ...]
  },
  // ...
]
```

---

## 3. `courses/[subject].json`

- **Location:** `static/courses/[SUBJECT].json`
- **Format:** JSON array of course objects (not an object with a `courses` array).
- **Purpose:** All courses offered by a specific subject/department, with full details. There are currently 168 such files (as of July 2025).

```json
[
  {
    "id": "COURSE_CODE",
    "title": "Course Title",
    "units": NUMBER,
    "description": "...",
    "requisites": [ /* see below */ ],
    "equivalentCourses": [] // always empty for now
  },
  // ...
]
```
- **Requisites** can be objects describing course requirements or grouped requirements (see subject files for examples).
- **equivalentCourses** is always an empty array for every course (intentional; not yet supported in production).

----

## 4. `majors/[major].json`

- **Location:** `static/majors/[Major Name].json`
- **Format:** Object describing a single major's requirements and structure.
- **Purpose:** Detailed requirements, sections, and rules for a specific major.

```json
{
  "name": "Major Name",
  "overview": "...",
  "college": "...",
  "department": "...",
  "degreeLevel": "...",
  "degreeObjective": "...",
  "sections": [
    {
      "id": "section-id",
      "title": "Section Title",
      "description": "...",
      "requirements": [ /* see below */ ]
    },
    // ...
  ]
}
```
- **Requirements** can be nested groups, courses, or other rules (see existing files for examples).

---

## 5. `courses/[subject].json`

- **Location:** `static/courses/[Subject Name].json`
- **Format:** Object with a `courses` array.
- **Purpose:** All courses offered by a specific subject/department, with full details.

```json
{
  "courses": [
    {
      "id": "COURSE_CODE",
      "title": "Course Title",
      "units": NUMBER,
      "description": "...",
      "requisites": [ /* see below */ ],
      "equivalentCourses": ["COURSE_CODE", ...]
    },
    // ...
  ]
}
```
- **Requisites** can be objects describing course requirements or grouped requirements (see ./static/courses/ for examples).

---

## Notes

---

## Data Integrity Guarantees

- Every `SUBJECT_CODE` referenced in any file (such as in `majors.json` Dependencies) **must** exist in `subjects.json` under some school/subjectArea.
- Every major listed in `majors.json` **must** have a corresponding file in `majors/[Major Name].json` (with the same name and capitalization, spaces preserved).
- Every `SUBJECT_CODE` in `subjects.json` **must** have a corresponding file in `static/courses/[SUBJECT_CODE].json` (with the subject name matching the `name` field in `subjects.json`).
- Every course in `courses.json` **must** have a unique `id` and `title`.
- All files are UTF-8 encoded JSON.
- All codes (subject, course, school) are strings and should match across files.
- For detailed examples, see the actual data files in the repository.
