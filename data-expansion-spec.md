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

## Phase 2: Course Requirements Expansion (TODO)

### 2.1 Challenges
- **Scale**: Thousands of courses across all departments
- **Data Source**: UCLA course catalog has different structure than major pages
- **Complexity**: Course descriptions, prerequisites, units, scheduling info
- **Maintenance**: Course data changes more frequently than major requirements

### 2.2 Proposed Approach
1. **Department-by-Department**: Expand one department at a time
2. **Automated Parsing**: Similar HTML scraping approach as majors
3. **Incremental Updates**: Support for updating existing course data
4. **Validation Pipeline**: Extensive validation for course data integrity

### 2.3 Data Structure
- Follow existing `course-spec.md` format
- Store courses by department in `static/courses/[Department].json`
- Maintain course ID consistency across all data

## Phase 3: Prerequisite Enforcement Levels (TODO)

### 3.1 Challenges
- **Enforcement Inconsistency**: Different departments have different enforcement policies
- **Data Source**: Not explicitly stated in catalogs
- **Complexity**: Enforcement can vary by semester, professor, or special circumstances
- **Maintenance**: Policies change over time

### 3.2 Proposed Approach
1. **Conservative Defaults**: Default to "Enforced" for all prerequisites
2. **Department Overrides**: Allow department-specific enforcement policies
3. **Manual Curation**: Require manual review for enforcement levels
4. **Community Input**: Allow user feedback on enforcement accuracy

### 3.3 Implementation Strategy
- Add enforcement level field to course prerequisite data
- Create override system for department-specific policies
- Implement user feedback mechanism for enforcement corrections
- Regular review and update process

## Implementation Timeline

### Phase 1: Major Requirements (Immediate Priority)
- **Week 1**: Implement URL generation and HTML fetching scripts
- **Week 2**: Build 404 detection and URL correction system
- **Week 3**: Develop HTML to JSON parsing pipeline
- **Week 4**: Create validation and quality assurance tools
- **Week 5**: Process all major requirements and validate results

### Phase 2: Course Requirements (Future)
- **Month 2-3**: Design and implement course data expansion
- **Month 4-6**: Process all UCLA departments
- **Month 7**: Validation and quality assurance

### Phase 3: Prerequisite Enforcement (Future)
- **Month 8-12**: Research and implement enforcement levels
- **Ongoing**: Community feedback and maintenance

## Quality Assurance Strategy

### Automated Testing
- Schema validation for all generated JSON files
- Course ID format validation
- Requirement logic consistency checks
- Unit count verification

### Manual Review Process
- Spot-check generated major files against UCLA catalog
- Verify complex requirement interpretations
- Test major files in BruinPlan interface
- Community feedback integration

### Continuous Monitoring
- Regular re-parsing of major pages for updates
- Automated detection of catalog changes
- Version control for all data files
- Change logging and review process

## Data Migration Strategy

### Backward Compatibility
- Maintain existing Mathematics major files
- Ensure new data format matches existing structure
- Gradual rollout with fallback mechanisms

### User Experience
- Progressive loading of major data
- Clear indication of data availability
- Graceful handling of missing data

### Performance Considerations
- Lazy loading of major requirement data
- Efficient JSON parsing and caching
- Minimal impact on app startup time

## Risk Mitigation

### Technical Risks
- **UCLA Catalog Changes**: Monitor for structural changes to catalog HTML
- **Rate Limiting**: Implement respectful scraping practices
- **Data Quality**: Extensive validation and manual review
- **Parsing Errors**: Robust error handling and fallback strategies

### Legal/Ethical Risks
- **Terms of Service**: Ensure compliance with UCLA website ToS
- **Data Usage**: Use publicly available data only
- **Attribution**: Proper attribution of data sources
- **Rate Limiting**: Respectful scraping practices

## Success Metrics

### Quantitative Metrics
- **Coverage**: Number of majors successfully processed
- **Accuracy**: Percentage of requirements correctly parsed
- **Validation Pass Rate**: Percentage of majors passing validation
- **Processing Time**: Time required for full data expansion

### Qualitative Metrics
- **User Feedback**: Quality of generated major requirement data
- **Usability**: How well parsed data works in BruinPlan interface
- **Maintainability**: Ease of updating and maintaining data
- **Extensibility**: How easily the system can be extended to new data types

## Conclusion

This data expansion will transform BruinPlan from a Mathematics-focused tool to a comprehensive UCLA course planning system. The phased approach ensures quality while allowing for iterative improvements and user feedback integration.

The major requirements expansion (Phase 1) is immediately actionable with the existing `majors-raw.txt` data and will provide the most significant user value. Course requirements and prerequisite enforcement levels can be addressed in future phases as the system matures.
