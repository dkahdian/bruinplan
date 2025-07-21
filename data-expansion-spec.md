# Data Expansion Specification

## Overview
This specification outlines the process for expanding BruinPlan's data coverage from the current Mathematics department to all UCLA undergraduate majors. The expansion will be implemented in phases to ensure data quality and system stability.

**Current Status**: Mathematics department only (~20 majors)
**Target Status**: All UCLA undergraduate majors (~130+ majors)

## Phase 1: Major Requirements Expansion

### 1.1 Input Data Source
- **File**: `static/majors-raw.txt`
- **Content**: Complete list of all undergraduate majors offered at UCLA
- **Format**: Raw text format requiring parsing and URL generation

### 1.2 URL Generation Process
**Target URL Pattern**: 
```
https://catalog.registrar.ucla.edu/major/2025/[major]
```

**URL Transformation Rules**:
- Convert to lowercase
- Remove all spaces
- Remove periods around degree types (B.S., B.A.)
- Remove parentheses around degree types
- Preserve hyphens and other special characters

**Examples**:
- `Applied Mathematics B.S.` → `appliedmathematicsbs`
- `Art History B.A.` → `arthistoryba`
- `Computer Science B.S.` → `computersciencebs`
- `Aerospace Engineering B.S.` → `aerospaceengineeringbs`

### 1.3 HTML Fetching Script
**Script**: `scripts/fetch_major_pages.ts`

**Input**: `static/majors-raw.txt`
**Output**: `data/raw-major-pages/[major].html`

**Process**:
1. Parse `majors-raw.txt` to extract major names
2. Transform each major name to URL format using transformation rules
3. Fetch HTML content from UCLA catalog
4. Save each page as `[major].html` in `data/raw-major-pages/`
5. Implement rate limiting (4-6 seconds between requests) to be respectful and account for slow page loads
6. Log successful fetches and errors
7. Retry failed requests up to 3 times with exponential backoff
8. Process sequentially (no multithreading) to avoid overwhelming the server

**Error Handling**:
- Network timeouts: Retry with exponential backoff
- Rate limiting: Respect server responses and adjust delays
- Invalid URLs: Log and continue processing

**Example Implementation Structure**:
```typescript
interface MajorFetchResult {
  major: string;
  url: string;
  success: boolean;
  htmlContent?: string;
  errorMessage?: string;
  statusCode?: number;
}

async function fetchMajorPages(inputFile: string): Promise<MajorFetchResult[]> {
  // Implementation details
}
```

### 1.4 404 Detection Script
**Script**: `scripts/detect_404_pages.ts`

**Input**: `data/raw-major-pages/[major].html`
**Output**: `data/404-majors.json`

**Detection Keywords**:
- "Sorry, that page doesn't exist"
- "404 Not Found"
- "Page not found"
- "The requested page could not be found"
- Empty or minimal HTML content

**Process**:
1. Read all HTML files from `data/raw-major-pages/`
2. Check each file for 404 indicators
3. Generate report of missing/invalid pages
4. Create corrected URL suggestions where possible
5. Output results to `data/404-majors.json`

**Output Format**:
```json
{
  "404Pages": [
    {
      "major": "Applied Mathematics B.S.",
      "generatedUrl": "appliedmathematics",
      "actualUrl": "appliedmathematicsbs",
      "suggestedFix": "Add 'bs' suffix"
    }
  ],
  "validPages": 127,
  "invalidPages": 8,
  "totalPages": 135
}
```

### 1.5 HTML to JSON Conversion
**Script**: `scripts/parse_major_requirements.ts`

**Input**: `data/raw-major-pages/[major].html` (valid pages only)
**Output**: `static/majors/[Major Name].json`

**Parsing Strategy**:
This is the most complex step. Three potential approaches:

#### Option A: Pattern-Based Parsing (Recommended)
- Use regex and DOM parsing to identify requirement sections
- Look for common patterns in UCLA catalog HTML structure
- Extract course IDs, unit requirements, and section titles
- Handle common requirement formats (individual courses, groups, electives)

#### Option B: AI-Assisted Parsing
- Use AI models to convert HTML to structured JSON
- Provide examples of existing major files as training data
- Validate AI output against known patterns
- More flexible but requires API costs and validation

#### Option C: Manual Template Mapping
- Create templates for common requirement patterns
- Map HTML sections to JSON structure manually
- Most accurate but time-intensive

**Recommended Approach**: Start with Option A (pattern-based parsing). Focus on getting data fetching working first, then develop robust parsing logic.

**Target JSON Structure** (per `major-spec.md`):
```json
{
  "name": "Computer Science B.S.",
  "sections": [
    {
      "title": "Preparation",
      "requirements": [
        {
          "type": "course",
          "courseId": "MATH 31A",
          "title": "Differential and Integral Calculus"
        },
        {
          "type": "group",
          "title": "Programming Fundamentals",
          "needs": 1,
          "options": [
            {
              "type": "course",
              "courseId": "COM SCI 31",
              "title": "Introduction to Computer Science I"
            }
          ]
        }
      ]
    }
  ]
}
```

**Parsing Challenges**:
1. **Inconsistent HTML Structure**: Different majors may use different formatting
2. **Complex Prerequisites**: Nested requirements and conditional logic
3. **Unit Requirements**: Extracting minimum unit counts
4. **Elective Categories**: Handling broad elective requirements
5. **Cross-References**: Links between sections and external requirements

**Quality Assurance**:
- Validate all course IDs against known course patterns
- Check for required sections (Preparation, Major, etc.)
- Verify unit counts and requirements add up correctly
- Test against existing Mathematics major files

### 1.6 Validation Script
**Script**: `scripts/validate_major_files.ts`

**Input**: `static/majors/[Major Name].json`
**Output**: `data/validation-report.json`

**Validation Checks**:
1. **Schema Validation**: Ensure JSON matches `major-spec.md` format exactly
2. **Course ID Format**: Verify all course IDs follow UCLA format patterns
3. **Section Completeness**: Check for required sections (Preparation, Major requirements)
4. **Unit Count Validation**: Verify minimum unit requirements are specified
5. **Reference Integrity**: Ensure all referenced courses exist or are properly formatted
6. **Duplicate Detection**: Check for duplicate course requirements
7. **Logical Consistency**: Verify requirement groups make sense
8. **Zero Tolerance**: Any validation failures result in rejected major files that must be manually corrected

**Output Format**:
```json
{
  "validMajors": 125,
  "invalidMajors": 8,
  "totalMajors": 133,
  "errors": [
    {
      "major": "Computer Science B.S.",
      "type": "invalid_course_id",
      "message": "Course ID 'COMPSCI 31' should be 'COM SCI 31'",
      "section": "Preparation",
      "severity": "error"
    }
  ],
  "warnings": [
    {
      "major": "Art History B.A.",
      "type": "missing_units",
      "message": "No unit requirement specified for elective group",
      "section": "Major Requirements",
      "severity": "warning"
    }
  ]
}
```

### 1.7 Script Directory Structure
```
scripts/
├── data-expansion/
│   ├── fetch_major_pages.ts      # Fetch HTML from UCLA catalog
│   ├── detect_404_pages.ts       # Find invalid/missing pages
│   ├── parse_major_requirements.ts # Convert HTML to JSON
│   ├── validate_major_files.ts   # Validate final JSON files
│   └── utils/
│       ├── url_generator.ts      # URL transformation utilities
│       ├── html_parser.ts        # HTML parsing utilities
│       └── validation_utils.ts   # Validation helper functions

data/                             # Temporary processing data
├── raw-major-pages/             # Raw HTML files
├── 404-majors.json             # 404 detection results
└── validation-report.json      # Final validation results
```

## Phase 2: Course Requirements Expansion (Finished)

### 2.1 Status
- **Status (July 2025)**: All courses are now split into 168 subject files in `static/courses/[SUBJECT].json`.
- **Format**: Each file is a JSON array of course objects, matching the previous `courses.json` format.
- **equivalentCourses**: This field is always an empty array for every course (intentional; not yet supported in production).
- **Scale**: Thousands of courses across all departments
- **Data Source**: UCLA course catalog has different structure than major pages
- **Complexity**: Course descriptions, prerequisites, units, scheduling info
- **Maintenance**: Course data changes more frequently than major requirements

### 2.2 Current Approach: heavily manual
1. **Getting subject codes and lists**: a list of subjects is available on the UCLA website (obtained with Puppeteer) 
2. **Getting course links**: A list of courses by subject is also available on the UCLA website (obtained with Puppeteer)
3. **Data cleaning**: After all data is obtained, the raw test needs to be cleaned (remove duplicate lines, common header/footer, for example)
4. **AI parse to JSON**: An AI agent works course-by-course, converting each course to a JSON format. At this point, requisites are still empty
5. **Requisites parsing**: Another AI agent works course-by-course, extracting the requisite structure from the course information
6. **Data validation**: Done extensively by hand and using python scripts.

### 2.3 Data Structure
- Each file in `static/courses/[SUBJECT].json` is a JSON array of course objects.
- Each course object includes: `id`, `title`, `units`, `description`, `requisites`, and `equivalentCourses` (always empty for now).
- Course objects are sorted by course ID within each file.
- Each course references a number of prerequisites, possibly nested in groups:
  - All subject areas for prerequisites are valid (i.e. every prerequisite can point to a file in static/courses/)
  - Some prerequiste courses may be missing (for courses that no longer exist, data is unavailable)

## Phase 3: Prerequisite Enforcement Levels and other finer details (TODO - Future plan)

### 3.1 Data
- **Enforcement Inconsistency**: Different departments have different enforcement policies, which may change over time. This feature will require continuous fetching with a backend.
- **Data Source**: Detailed course schedules are located at https://sa.ucla.edu/ro/public/soc. This site shows:
  - Prerequisites enforcement levels
  - List of courses offered per quarter
  - Number of seats available in the current quarter
  - Course times, locations, and instructors
- **Complexity**: Writing an integrated script that can handle the format of this website is a challenge in itself. This script would have to clean, parse, format, and store data without help from AI agents (which would precipitously raise costs and runtime).
- **Integration**: Consider integrating grades information from UCLAGrades and professor ratings from BruinWalk here.

### 3.2 Current Status
1. **Static data**: JSON files are treated as static, and are not updated regularly.
2. **No enforcement levels**: All prerequisites give a standard warning, regardless of whether or not they are enforced.

### 3.3 Implementation Strategy
- Write a comprehensive script that:
  - Extracts all course offerings and information for the quarter in real time
  - Extracts all prerequisites (with levels) in real time
  - Extracts enrollment restrictions in real time
  - Note that this script will be slow (to prevent being rate-limited) and will run only seldom (maybe once per week? month? quarter?)
- Write a simpler script that:
  - Extracts seat counts on demand for an individual course (checking every x minutes) to notify users when courses open up
  - Students can set up notifications on their phones (similar to ClassRabbit)