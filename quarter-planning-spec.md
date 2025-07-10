# Quarter-Based Planning System Specification

## Overview
This specification defines the implementation of a quarter-based course scheduling system that replaces the current binary completion tracking with sophisticated quarter assignment and validation capabilities.

**Implementation Status**: Not yet implemented - this is the design specification for the next major feature.

## 1. Data Structure Design

### Core Scheduling Service
```typescript
// New file: src/lib/services/shared/schedulingService.ts
interface CourseSchedule {
  [courseId: string]: number; // Quarter code: 0 = completed, 125 = Winter 2025, etc.
}

interface QuarterLimits {
  defaultSummer: number;     // User-defined, defaults to 0
  defaultNonSummer: number;  // User-defined, defaults to 18
  quarterly: {               // Quarter-specific overrides
    [quarterCode: number]: number; // e.g., 125: 20
  };
}

interface PrerequisiteOverride {
  courseId: string;
  prerequisiteId: string;
}

interface ValidationError {
  type: 'error' | 'warning';
  courseId: string;
  quarterCode: number;
  message: string;
  prerequisiteId?: string; // For missing prerequisite errors
}
```

### Quarter Code System
- **Encoding**: `SXXX` format where S = season (1=Fall, 2=Winter, 3=Spring, 4=Summer), XXX = year
- **Examples**: 
  - `125` = Winter 2025
  - `324` = Spring 2024
  - `427` = Summer 2027
  - `0` = Completed (no quarter assignment)

### localStorage Keys
```typescript
const STORAGE_KEYS = {
  courseSchedules: 'bruinplan_course_schedules',
  quarterLimits: 'bruinplan_quarter_limits', 
  prerequisiteOverrides: 'bruinplan_prerequisite_overrides',
  lastVisit: 'bruinplan_last_visit' // For auto-reassignment logic
};
```

## 2. User Interface Components

### Quarter Planning Sidebar
**Location**: Right sidebar on major pages (both graph and list modes)
**Layout**: Vertical quarter display showing future quarters only

```typescript
// New component: src/lib/components/major/QuarterPlanningCalendar.svelte
interface QuarterDisplay {
  code: number;
  season: string;
  year: number;
  courses: string[];
  totalUnits: number;
  unitLimit: number;
  hasErrors: boolean;
  hasWarnings: boolean;
}
```

**Features**:
- Drag-and-drop course scheduling
- Unit count display with limit warnings
- Validation error indicators (orange triangles)
- Quick "mark as completed" option
- Settings panel for unit limits

### Override Management
**Location**: Bottom of screen toggle/panel
**Purpose**: Remind users of active prerequisite overrides

```typescript
// Component: src/lib/components/shared/OverridePanel.svelte
// Shows list of active overrides with individual toggle switches
// Format: "MATH 115A: Missing prerequisite MATH 32B [Override Active ✓]"
```

## 3. Validation System

### Validation Rules
**Errors (Red/Orange triangles):**
- Missing enforced prerequisite for scheduled course
- Course scheduled before its enforced prerequisites

**Warnings (Orange triangles):**
- Missing warning/recommended prerequisite
- Quarter unit count exceeds personal limit
- Course scheduled more than 4 years in future

### Validation Display
- **Orange triangles**: Appear next to course IDs everywhere they're displayed
- **Error details**: Hover/click to see specific validation message
- **Override capability**: Individual toggle per validation error

### Unit Limit Hierarchy
```typescript
function getQuarterLimit(quarterCode: number, userLimits: QuarterLimits): number {
  // 1. Check quarterly-specific limit
  if (userLimits.quarterly[quarterCode]) {
    return userLimits.quarterly[quarterCode];
  }
  
  // 2. Check user-defined defaults
  const isSummer = Math.floor(quarterCode / 100) === 4;
  if (isSummer && userLimits.defaultSummer !== undefined) {
    return userLimits.defaultSummer;
  }
  if (!isSummer && userLimits.defaultNonSummer !== undefined) {
    return userLimits.defaultNonSummer;
  }
  
  // 3. App-defined defaults
  return isSummer ? 0 : 18;
}
```

### Unit Limit Exceeded UI
When user exceeds quarter limit, show buttons:
- "Increase limit for just this quarter to X units"
- "Increase default [summer/non-summer] limit to X units"

## 4. Auto-Reassignment Logic

### Past Quarter Detection
```typescript
// TODO: Implement UCLA quarter calendar logic (11-month cycle)
function getCurrentQuarterCode(): number {
  // Determine current UCLA quarter based on real-world dates
  // Return current quarter code (e.g., 225 for Winter 2025)
}

function isPastQuarter(quarterCode: number): boolean {
  return quarterCode < getCurrentQuarterCode() && quarterCode !== 0;
}
```

### Auto-Reassignment Process
**Trigger**: App load/initialization
**Logic**: 
1. Detect courses scheduled in past quarters
2. Move them to completed status (quarter 0)
3. Show notification: "3 courses from Fall 2024 have been marked as completed. Please verify these were actually completed."

## 5. Service Architecture

### New Scheduling Service
```typescript
// src/lib/services/shared/schedulingService.ts
// Replaces completionService.ts as single source of truth

export class SchedulingService {
  // Course scheduling
  scheduleCourse(courseId: string, quarterCode: number): void
  getSchedule(courseId: string): number
  isCompleted(courseId: string): boolean // quarterCode === 0
  
  // Validation
  validateSchedule(): ValidationError[]
  validateCourse(courseId: string): ValidationError[]
  
  // Overrides
  addOverride(courseId: string, prerequisiteId: string): void
  removeOverride(courseId: string, prerequisiteId: string): void
  hasOverride(courseId: string, prerequisiteId: string): boolean
  
  // Quarter limits
  setQuarterLimit(quarterCode: number, limit: number): void
  setDefaultLimit(type: 'summer' | 'nonSummer', limit: number): void
  getQuarterLimit(quarterCode: number): number
  
  // Auto-reassignment
  reassignPastQuarters(): string[] // Returns reassigned course IDs
}
```

### Integration Points
- **Graph builders**: Update to use scheduling service instead of completion service
- **Major graphs**: Show quarter information and validation errors
- **Course pages**: Update completion toggles to quarter assignment
- **Components**: All course displays get validation indicators

## 6. Migration Strategy

### Backward Compatibility
```typescript
function migrateCompletionData(): void {
  const oldCompleted = localStorage.getItem('bruinplan_completed_courses');
  if (oldCompleted) {
    const completedSet = new Set(JSON.parse(oldCompleted));
    const newSchedule: CourseSchedule = {};
    
    completedSet.forEach(courseId => {
      newSchedule[courseId] = 0; // Mark as completed
    });
    
    localStorage.setItem('bruinplan_course_schedules', JSON.stringify(newSchedule));
    localStorage.removeItem('bruinplan_completed_courses'); // Clean up
  }
}
```

## 7. Implementation Phases

### Phase 1: Core Infrastructure
1. Create `schedulingService.ts` with basic quarter assignment
2. Implement quarter code utilities and validation
3. Add basic quarter assignment UI to course details
4. Migration from completion service

### Phase 2: Quarter Planning Interface  
1. Build `QuarterPlanningCalendar.svelte` component
2. Implement drag-and-drop scheduling
3. Add unit limit settings and validation
4. Create override management panel

### Phase 3: Advanced Features
1. Auto-reassignment logic with UCLA quarter calendar
2. Enhanced validation with prerequisite checking
3. Graph integration with quarter information display
4. Export/import functionality

## 8. Technical Considerations

### UCLA Quarter Calendar
- **11-month cycle**: UCLA operates on an 11-month academic year
- **Quarter transitions**: Need to determine exact transition dates for auto-reassignment
- **Current quarter detection**: Real-world date mapping to UCLA quarters

### Performance Considerations
- **Validation caching**: Cache validation results to avoid repeated calculations
- **Incremental updates**: Only re-validate affected courses when schedules change
- **Lazy loading**: Load quarter data on-demand for large course lists

### Data Persistence
- **localStorage backup**: Automatic backup before major operations
- **Migration safety**: Graceful handling of data format changes
- **Version control**: Track data schema versions for future migrations

## 9. Future Enhancements

### Advanced Planning Features
- **Auto-scheduling optimization**: Suggest optimal quarter assignments
- **Load balancing**: Distribute courses evenly across quarters
- **Graduation timeline**: Calculate earliest graduation date
- **Alternative paths**: Show multiple valid scheduling options

### Integration Features
- **Course availability**: Factor in when courses are offered (Fall/Winter/Spring only)
- **Prerequisites chains**: Visual highlighting of optimal course sequences
- **Export/sharing**: Save and share course plans
- **Calendar integration**: Export to external calendar applications

This specification provides a complete roadmap for implementing the quarter-based planning system while maintaining the static site architecture and providing sophisticated academic planning capabilities.
