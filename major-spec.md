# Major Data Specification

## Overview
This document defines the JSON structure for major requirement data files. Major requirements are treated as "meta-courses" where all requirements are prerequisites to completing the major.

**✅ Implementation Status**: Major data specification is fully implemented with sectioned layouts, compound node support, cross-category edge handling, and sophisticated group satisfaction logic.

## File Structure

### Root Object
```json
{
  "name": "Mathematics BS",
  "overview": "Brief description of the major",
  "college": "College of Letters and Science",
  "department": "Mathematics", 
  "degreeLevel": "Undergraduate",
  "degreeObjective": "Bachelor of Science",
  "sections": [...]
}
```

### Section Object
Each major is divided into logical sections (e.g., "Preparation for the Major", "The Major", "Electives").

```json
{
  "id": "preparation",
  "title": "Preparation for the Major",
  "description": "Complete 10 courses as follows: Mathematics 31A or 31L, seven required courses, and two elective courses.",
  "requirements": [...]
}
```

### Requirement Types

#### Course Requirement
```json
{
  "type": "course",
  "courseId": "MATH 31A"
}
```

#### Group Requirement
```json
{
  "type": "group",
  "title": "Electives",
  "description": "Select two courses from:",
  "needs": 2,
  "options": [
    {"type": "course", "courseId": "CHEM 20A"},
    {"type": "course", "courseId": "CHEM 20B"}
  ]
}
```

#### Nested Groups (for optional tracks/concentrations)
```json
{
  "type": "group",
  "title": "Optional Specializations",
  "description": "Choose one specialization (optional)",
  "needs": 0,
  "options": [
    {
      "type": "group",
      "title": "Applied Mathematics Track",
      "description": "Complete all courses in this track",
      "needs": 3,
      "options": [
        {"type": "course", "courseId": "MATH 151A"},
        {"type": "course", "courseId": "MATH 151B"},
        {"type": "course", "courseId": "MATH 164"}
      ]
    }
  ]
}
```

## Field Definitions

### Root Fields
- `name` (string): Full name of the major
- `overview` (string): Brief description of the major
- `college` (string): College within the university
- `department` (string): Academic department
- `degreeLevel` (string): "Undergraduate", "Graduate", etc.
- `degreeObjective` (string): "Bachelor of Science", "Master of Arts", etc.
- `sections` (array): Array of section objects

### Section Fields
- `id` (string): Unique identifier for the section (not standardized across majors)
- `title` (string): Display name for the section
- `description` (string): Detailed description of section requirements
- `requirements` (array): Array of requirement objects

### Course Requirement Fields
- `type` (string): Always "course"
- `courseId` (string): Course identifier (foreign key to course database)

### Group Requirement Fields
- `type` (string): Always "group"
- `title` (string): Display name for the group
- `description` (string): Description of group requirements
- `needs` (number): Number of options required (0 for optional groups)
- `options` (array): Array of requirement objects (can be courses or nested groups)

## Extensibility

### Future Course Fields
Course objects can be extended with additional fields:
```json
{
  "type": "course",
  "courseId": "MATH 31A",
  "minGrade": "C-",
  "minGPA": 2.0,
  "notes": "or MATH 31L"
}
```

### Missing Prerequisites
Missing prerequisites are handled automatically by the TypeScript code and do not need to be included in the JSON data.

## Data Validation Rules

1. **Course References**: All `courseId` values must reference existing courses in the course database
2. **Section IDs**: Must be unique within a major but not standardized across majors
3. **Group Logic**: `needs` value must be ≤ number of options in the group
4. **Nesting**: Groups can contain other groups (unlimited nesting depth supported)
5. **Required Fields**: All fields marked as required must be present and non-empty

## Implementation Features

### Graph Visualization
- **Sectioned Layouts**: Major requirements organized into visual sections with compound nodes
- **Cross-Category Logic**: Intelligent edge hiding between different sections when courses are completed  
- **Auto-Prerequisites**: Automatic inclusion of missing prerequisites for major requirement courses
- **Group Satisfaction**: Robust diamond group logic matching prerequisite graph implementation
- **Smooth Animations**: Always-on positional animations for enhanced user experience

### Data Processing
- **Incremental Updates**: Efficient graph updates that only modify changed elements
- **Completion Integration**: Seamless integration with course completion tracking system
- **Recursive Handling**: Support for unlimited nesting of groups within sections
- **Section Management**: Dynamic expand/collapse functionality for major sections

## File Naming Convention
- Files should be stored in `static/majors/`
- Filename format: `{Major Name}.json` (e.g., "Mathematics BS.json")
- Use exact major name including degree type for clarity
