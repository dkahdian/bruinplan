# Quarter-Based Planning System Specification

## Overview
This specification defines the implementation of a quarter-based course scheduling system that replaces the current binary completion tracking with sophisticated quarter assignment and validation capabilities.

**Implementation Status**: Not yet implemented - this is the design specification for the next major feature.

## 1. Data Structure Design

### Core Scheduling Service
```typescript
// New file: src/lib/services/shared/schedulingService.ts
interface CourseSchedule {
  [courseId: string]: number; // Quarter code: 1 = completed, 125 = Winter 2025, etc. (0 = not scheduled)
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
- **Encoding**: `SXXX` format where S = season (1=Winter, 2=Spring, 3=Summer, 4=Fall), XXX = year
- **Examples**: 
  - `125` = Winter 2025
  - `224` = Spring 2024
  - `327` = Summer 2027
  - `425` = Fall 2025
  - `1` = Completed (no quarter assignment)
  - `0` = Not scheduled

### localStorage Keys
```typescript
const STORAGE_KEYS = {
  courseSchedules: 'bruinplan_course_schedules',
  quarterLimits: 'bruinplan_quarter_limits', 
  prerequisiteOverrides: 'bruinplan_prerequisite_overrides',
  lastVisit: 'bruinplan_last_visit' // For auto-reassignment logic
};

// Smart default quarter range calculation
function getSmartQuarterRange(courseSchedules: CourseSchedule): number {
  const scheduledQuarters = Object.values(courseSchedules)
    .filter(quarterCode => quarterCode > 0) // Exclude completed courses (0)
    .sort((a, b) => a - b);
  
  if (scheduledQuarters.length === 0) {
    return 12; // Default range
  }
  
  const lastQuarter = scheduledQuarters[scheduledQuarters.length - 1];
  const currentQuarter = getCurrentQuarterCode();
  const quartersFromNow = Math.max(12, lastQuarter - currentQuarter + 1);
  
  return Math.min(quartersFromNow, 24); // Cap at reasonable maximum
}
```

## 2. User Interface Components

### Quarter Planning Sidebar
**Location**: Right sidebar on major pages (both graph and list modes)
**Layout**: Vertical quarter display showing current and future quarters
**Quarter Range**: 
- **Default**: 12 quarters (including current)
- **Smart Default**: If planned courses exist in localStorage, show until last quarter with planned courses
- **No Persistence**: Range preference resets to default on each session
**Current Quarter**: Always included, even if nearly complete

**Interactive Controls**:
- **Remove Quarter**: "X" button on bottom-most quarter to remove it (no minimum limit)
- **Add Quarter**: "Add a quarter" button below all quarters to extend the range (no maximum limit)
- **Performance Warning**: Show warning if range exceeds 12 quarters

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

interface QuarterRangeSettings {
  displayCount: number; // Default: 12, or smart default based on planned courses
  startFromCurrent: boolean; // Always true - include current quarter
  showPerformanceWarning: boolean; // True if displayCount > 12
}
```

**Course Data Source**:
- **Source**: All courses from current major requirements
- **Implementation**: Course boxes in major list-view page can be dragged into sidebar quarters
- **Scope**: Only courses relevant to the currently viewed major

**Features**:
- Drag-and-drop course scheduling (using svelte-dnd-action)
- Unit count display with limit warnings
- Validation error indicators (orange triangles)
- Quick "mark as completed" option
- Settings panel for unit limits

### Drag-and-Drop Implementation
**Library**: svelte-dnd-action v0.9.63+
**Scope**: List view only (not graph view initially)
**Features**:
- Touch device support for mobile accessibility
- Smooth animations with flip transitions
- Type-based restrictions for valid drop zones
- Keyboard navigation and screen reader support

```typescript
// Example implementation in QuarterPlanningCalendar.svelte
import { dndzone } from "svelte-dnd-action";
import { flip } from "svelte/animate";

let quarterCourses = [
  { id: "MATH 31A", name: "Differential and Integral Calculus", units: 4 },
  { id: "MATH 31B", name: "Integration and Infinite Series", units: 4 }
];

function handleSort(e) {
  quarterCourses = e.detail.items;
  // Update quarter assignments in schedulingService
}

// In template:
// <section use:dndzone="{{ items: quarterCourses, type: 'course-scheduling', flipDurationMs: 300 }}"
//          on:consider={handleSort} 
//          on:finalize={handleSort}>
//   {#each quarterCourses as course (course.id)}
//     <CourseCard {course} />
//   {/each}
// </section>
```

### Override Management
**Location**: Bottom of screen toggle/panel
**Purpose**: Remind users of active prerequisite overrides
**Scope**: Global application across all majors and contexts
**Persistence**: Stored in localStorage across sessions
**Limits**: No limit on number of active overrides
**Bulk Management**: General "Reset" button to clear all localStorage data

```typescript
// Component: src/lib/components/shared/OverridePanel.svelte
// Shows list of active overrides with individual toggle switches
// Format: "MATH 115A: Missing prerequisite MATH 32B [Override Active ✓]"
```

## 3. Validation System

### Validation Rules
**Errors (Red triangles):**
- Missing enforced prerequisite for scheduled course
- Course scheduled before its enforced prerequisites

**Warnings (Orange triangles):**
- Missing warning/recommended prerequisite
- Quarter unit count exceeds personal limit
- Course scheduled more than 4 years in future

### Validation Display
- **Red triangles**: Appear next to course IDs for errors everywhere they're displayed
- **Orange triangles**: Appear next to course IDs for warnings everywhere they're displayed
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
  const isSummer = Math.floor(quarterCode / 100) === 3;
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
// UCLA Quarter Calendar Implementation
// Simple date-based boundaries for auto-reassignment of past quarters

const QUARTER_TRANSITIONS = {
  // January 1st: Fall → Winter
  WINTER_START: { month: 0, day: 1 }, // Jan 1
  
  // March 25th: Winter → Spring  
  SPRING_START: { month: 2, day: 25 }, // Mar 25
  
  // June 17th: Spring → Summer
  SUMMER_START: { month: 5, day: 17 }, // Jun 17
  
  // September 20th: Summer → Fall
  FALL_START: { month: 8, day: 20 }   // Sep 20
};

function getCurrentQuarterCode(): number {
  const now = new Date();
  const year = now.getFullYear();
  const yearSuffix = year % 100; // 2025 → 25
  
  // Check which quarter we're currently in
  if (isAfterTransition(now, QUARTER_TRANSITIONS.FALL_START)) {
    return 400 + yearSuffix; // Fall: 4XX (e.g., Fall 2025 = 425)
  } else if (isAfterTransition(now, QUARTER_TRANSITIONS.SUMMER_START)) {
    return 300 + yearSuffix; // Summer: 3XX (e.g., Summer 2025 = 325)
  } else if (isAfterTransition(now, QUARTER_TRANSITIONS.SPRING_START)) {
    return 200 + yearSuffix; // Spring: 2XX (e.g., Spring 2025 = 225)
  } else if (isAfterTransition(now, QUARTER_TRANSITIONS.WINTER_START)) {
    return 100 + yearSuffix; // Winter: 1XX (e.g., Winter 2025 = 125)
  } else {
    // Before Winter start (Jan 1), so we're in previous year's Fall
    const prevYear = year - 1;
    return 400 + (prevYear % 100);
  }
}

function isAfterTransition(date: Date, transition: { month: number, day: number }): boolean {
  const transitionDate = new Date(date.getFullYear(), transition.month, transition.day);
  return date >= transitionDate;
}

function isPastQuarter(quarterCode: number): boolean {
  return quarterCode < getCurrentQuarterCode() && quarterCode !== 0;
}
```

### Auto-Reassignment Process
**Trigger**: App load/initialization
**Quarter Eligibility Rules**:
- **Current quarter and later**: Can be used for planning (computed from date + transition dates)
- **Past quarters**: Cannot be used for planning, must be auto-reassigned to completed
**Logic**: 
1. Detect courses scheduled in past quarters
2. Move them to completed status (quarter 0)
3. Show notification with user acknowledgment required: "3 courses from Fall 2024 have been marked as completed. Please verify these were actually completed." [Okay button]
4. User must click "Okay" to dismiss notification

## 5. Service Architecture

### New Scheduling Service
```typescript
// src/lib/services/shared/schedulingService.ts
// schedulingService.ts is now the single source of truth for course completion and scheduling
// Data migration from completionService is no longer needed; all user data is assumed migrated

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
// NOTE: As all user data has already been migrated, this function has been removed from the codebase.
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
- **Quarter transitions**: Defined using simple date boundaries for auto-reassignment
- **Current quarter detection**: Real-world date mapping to UCLA quarters using fixed transition dates
- **Unit information**: All courses have a `units` property; variable unit courses (e.g., "2-4 units") are stored as single representative values (e.g., 3)

### Performance Considerations
- **Validation caching**: Cache validation results to avoid repeated calculations
- **Incremental updates**: Only re-validate affected courses when schedules change
- **Validation debouncing**: Debounce validation by ~1 second after drag operations for performance
- **Fast validation**: Validation algorithms must be optimized for quick execution

### Data Persistence
- **localStorage backup**: Automatic backup before major operations
- **Migration safety**: Graceful handling of data format changes
- **Version control**: Track data schema versions for future migrations
- **Global settings**: All settings stored globally (no user authentication system)
- **Unit limits**: Quarter-specific limits stored as global app preferences

### Dependencies
- **svelte-dnd-action**: Drag-and-drop functionality for quarter planning interface
  - Installation: `npm install svelte-dnd-action`
  - Features: Touch support, accessibility, animations, nested containers
  - Alternative considered: SortableJS (rejected due to integration complexity)

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

---

## Implementation Plan

### Step 1: Core Scheduling Service Infrastructure
**Goal**: Create the foundation scheduling service and quarter utilities
**Files to create/modify**:
- `src/lib/services/shared/schedulingService.ts` (new)
- `src/lib/types.ts` (update with new interfaces)
- Install `svelte-dnd-action` dependency

**Functions to implement**:
- `SchedulingService` class with core methods
- Quarter code utilities (`getCurrentQuarterCode`, `formatQuarterCode`, etc.)
- localStorage persistence for course schedules
- Basic validation framework (structure only)

**Success criteria**: Service can store/retrieve course quarter assignments, app remains functional

### Step 2: Replace Completion Service Integration
**Goal**: Use schedulingService as the single source of truth for course completion and scheduling across the app
**Files to modify**:
- `src/lib/services/graph/graphBuilder.ts`
- `src/lib/components/course/CourseDetails.svelte`
- `src/lib/components/major/MajorRequirementsList.svelte`
// All files now use schedulingService; completionService has been removed

**Functions to implement**:
- Update all `isCompleted()` calls to use `schedulingService.isCompleted()`
- Replace completion toggles with quarter assignment dropdowns
- Maintain all existing functionality

**Success criteria**: App works exactly as before, but uses new scheduling service backend

### Step 3: Quarter Planning Sidebar Component
**Goal**: Build the quarter planning sidebar for major pages
**Files to create/modify**:
  - `src/lib/components/major/QuarterPlanningCalendar.svelte` (new)
  - `src/lib/components/major/QuarterDisplay.svelte` (new)
  - `src/routes/majors/[majorId]/+page.svelte` (add sidebar)

**Clarifications and Implementation Notes**:
- Quarter range always starts from the current quarter. Default is 12 quarters, but expands automatically if the user schedules a course further in the future. Range resets after session ends.
- Sidebar shows "X/Y" units per quarter. Clicking this redirects to a unit management page (to be implemented) for adjusting unit limits (defaults and per-quarter).
- Course display in quarters shows only course ID and unit count. Tooltip on hover matches the graph tooltip.
- No minimum number of quarters (other than zero). "Add a quarter" button is visible at the bottom of the sidebar (not fixed), requiring the user to scroll to see it.
- Sidebar is only shown on the major list view for now (not graph view).
- For Step 3, only static assignment is implemented. Code should be structured for easy drag-and-drop integration in Step 4.
- Validation/error indicators will be added in Step 5, but code should be ready for future integration.

### Step 4: Drag-and-Drop Implementation
**Goal**: Enable dragging courses from major list to quarter sidebar
**Files to modify**:
- `src/lib/components/major/QuarterPlanningCalendar.svelte`
- `src/lib/components/major/MajorRequirementsList.svelte`
- `src/lib/components/major/MajorSection.svelte`

**Functions to implement**:
- Drag source setup for course items in major list
- Drop zone setup for quarter containers
- Course scheduling on drop
- Visual feedback and animations

**Success criteria**: Can drag courses from major list to quarters, assignments persist

### Step 5: Validation System Implementation
**Goal**: Add validation with error/warning indicators
**Files to modify**:
- `src/lib/services/shared/schedulingService.ts` (complete validation)
- `src/lib/components/shared/ValidationIndicator.svelte` (new)
- `src/lib/components/major/MajorRequirementsList.svelte`
- `src/lib/components/major/QuarterDisplay.svelte`

**Functions to implement**:
- Prerequisite validation logic
- Unit limit validation
- Error/warning triangle display components
- Validation caching and performance optimization

**Success criteria**: Red/orange triangles appear next to courses with validation issues

### Step 6: Override Management Panel

**Goal**: Build the collapsible override panel for the bottom of screen and implement the units management page
**Files to create/modify**:
  - `src/lib/components/shared/OverridePanel.svelte` (new)
  - `src/lib/components/shared/UnitsManagementPage.svelte` (new)
  - `src/routes/+layout.svelte` (add panel)
  - `src/routes/units/+page.svelte` (new units management route)
  - `src/lib/services/shared/schedulingService.ts` (override and unit limit methods)

**Functions to implement**:
  - Override panel toggle and display
  - Individual override controls
  - Auto-open when validation state changes
  - Bulk reset functionality
  - Units management page for adjusting unit limits (defaults and per-quarter), with reset and save controls

**Success criteria**: Override panel shows active overrides and allows management. Units management page allows users to view and adjust unit limits for quarters and defaults. Note that errors regarding units can also be corrected from the Override panel without needing to visit the Units management page directly.

### Step 7: Auto-Reassignment and Polish
**Goal**: Implement past quarter auto-reassignment and final polish
**Files to modify**:
- `src/lib/services/shared/schedulingService.ts` (auto-reassignment)
- `src/app.html` or `src/routes/+layout.svelte` (initialization)
- Various components (final UI polish)

**Functions to implement**:
- Past quarter detection and reassignment
- User notification system for reassigned courses
- Final validation and error handling
- Performance optimizations

**Success criteria**: App automatically handles past quarters, all features work smoothly

### Additional Considerations:
- **Math Department Focus**: All course loading will use Math department data only
- **List View Priority**: Major graph view remains functional but unmodified
- **No Migration**: No need to migrate existing localStorage data
- **Incremental Testing**: Each step should maintain app functionality
- **Error Handling**: Robust error handling throughout all components
