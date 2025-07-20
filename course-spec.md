# Course Data Specification

## Overview
This document defines the JSON structure for individual courses. Course data includes prerequisites, descriptions, and metadata needed for the prerequisite graph visualization.

**✅ Implementation Status**: Course data specification is fully implemented with comprehensive prerequisite handling, equivalent course support, and integration with the graph visualization system.

## File Structure

### Root Object
```json
{
  "id": "MATH 115A",
  "title": "Linear Algebra",
  "description": "Techniques of proof. Abstract vector spaces. Linear transformations, matrices, and change of basis. Inner products and orthogonality. Eigenvectors, eigenvalues, and canonical forms.",
  "units": 4,
  "department": "Mathematics",
  "equivalentCourses": ["MATH 110A"],
  "requisites": [...]
}
```

## Field Definitions

### Core Fields
- `id` (string, required): Unique course identifier (e.g., "MATH 115A")
- `title` (string, required): Course title
- `description` (string, required): Course description
- `units` (number, required): Number of units/credits
- `department` (string, required): Academic department
- `equivalentCourses` (array, optional): Array of course IDs that satisfy the same requirements
- `requisites` (array, optional): Array of prerequisite requirements

### Prerequisite Types

#### Course Prerequisite
```json
{
  "type": "requisite",
  "course": "MATH 32B"
}
```

#### Group Prerequisite
```json
{
  "type": "group",
  "needs": 1,
  "options": [
    {
      "type": "requisite",
      "course": "MATH 31A"
    },
    {
      "type": "requisite",
      "course": "MATH 31L" 
    }
  ]
}
```

## Prerequisite Field Definitions

### Course Prerequisite Fields
- `type` (string): "requisite" 
- `course` (string): Course ID of the prerequisite

### Group Prerequisite Fields
- `type` (string): "group"
- `needs` (number): Number of options required from the group
- `options` (array): Array of prerequisite objects (courses or nested groups)

## Prerequisite Field Definitions

### Course Prerequisite Fields
- `type` (string): "requisite" 
- `course` (string): Course ID of the prerequisite

### Group Prerequisite Fields
- `type` (string): "group"
- `needs` (number): Number of options required from the group
- `options` (array): Array of prerequisite objects (courses or nested groups)

## Prerequisites

All prerequisites are treated equally as requirements that should be satisfied before taking the course. Prerequisites are displayed with orange warning styling (⚠️) in the graph visualization to indicate they should be completed first.

## Equivalent Courses

Courses listed in `equivalentCourses` are treated as interchangeable for prerequisite satisfaction:
- If any equivalent course is completed, the requirement is satisfied
- Used for transfer credit, course renumbering, and alternative pathways
- Displayed with special "✓ Took equivalent: COURSE_ID" indicators in UI
- **Smart Group Logic**: Equivalent courses within the same prerequisite group are handled intelligently to avoid redundant requirements
- **Cross-Reference Support**: Clickable equivalent course IDs that highlight the original course in graphs

## Data Validation Rules

1. **Course IDs**: Must be unique and follow department naming conventions
2. **Prerequisites**: All prerequisite course references must exist in the course database  
3. **Equivalent Courses**: All equivalent course references must exist
4. **Group Logic**: `needs` value must be ≤ number of options in the group
5. **Grade Format**: Minimum grades must follow standard format (A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F)
6. **Units**: Must be a positive number (can be decimal for variable unit courses)

## File Organization

### Directory Structure
```
static/courses/
├── Mathematics.json     # All Math department courses
├── Physics.json        # All Physics department courses  
├── Chemistry.json      # All Chemistry department courses
└── ...
```

### File Format
- One JSON file per department containing array of all courses
- Files named by department (e.g., "Mathematics.json")
- Each file contains array of course objects following the specification above

**Note**: Current implementation may use individual course files - this specification describes the target organization.

## Extensibility

### Future Fields
Course objects can be extended with additional metadata:
```json
{
  "id": "MATH 115A",
  "title": "Linear Algebra", 
  "description": "...",
  "units": 4,
  "department": "Mathematics",
  "instructor": "Dr. Smith",
  "quarter": ["Fall", "Winter"],
  "capacity": 150,
  "gradeDistribution": {...},
  "bruinwalkRating": 4.2
}
```

### Prerequisite Extensions
Prerequisites can include additional constraints:
```json
{
  "type": "requisite",
  "course": "MATH 32B", 
  "corequisite": true,
  "notes": "Can be taken concurrently"
}
```
