# Quarter-Based Planning System Specification

## Overview
This specification defines the implementation of a quarter-based course scheduling system that replaces the current binary completion tracking with sophisticated quarter assignment capabilities via drag-and-drop interface.

**Implementation Status**: Implemented

## 1. Data Structure Design

### Core Scheduling Service
```typescript
// File: src/lib/services/shared/schedulingService.ts
interface CourseSchedule {
  [courseId: string]: number; // Quarter code: 1 = completed, 251 = Winter 2025, etc. (0 = not scheduled)
}



interface ValidationError {
  type: 'error' | 'warning'; // 'error' shows ⚠️❌, 'warning' shows ⚠️
  courseId: string;
  quarterCode: number;
  message: string; // Displayed on hover over entire course item
  prerequisiteId?: string; // For missing prerequisite errors
}
```

### Quarter Code System
- **Encoding**: `YYQ` format where YY = year (last two digits), Q = quarter (1=Winter, 2=Spring, 3=Summer, 4=Fall)
- **Examples**: 
  - `251` = Winter 2025
  - `242` = Spring 2024
  - `273` = Summer 2027
  - `254` = Fall 2025
  - `1` = Completed (no quarter assignment)
  - `0` = Not scheduled

### localStorage Keys
```typescript
const STORAGE_KEYS = {
  courseSchedules: 'bruinplan_course_schedules',
  lastVisit: 'bruinplan_last_visit' // For auto-reassignment logic
};
```

// Smart default quarter range calculation
function getSmartQuarterRange(courseSchedules: CourseSchedule): number {
  const scheduledQuarters = Object.values(courseSchedules)
    .filter(quarterCode => quarterCode > 1) // Exclude completed courses (0 or 1)
    .sort((a, b) => a - b);
  if (scheduledQuarters.length === 0) {
    return 3; // Default range
  }
  const lastQuarter = scheduledQuarters[scheduledQuarters.length - 1];
  const currentQuarter = getCurrentQuarterCode();
  const currentYear = Math.floor(currentQuarter / 10);
  const lastYear = Math.floor(lastQuarter / 10);
  const currentSeason = currentQuarter % 10;
  const lastSeason = lastQuarter % 10;
  const yearDifference = lastYear - currentYear;
  const seasonDifference = lastSeason - currentSeason;
  return 4 * yearDifference + seasonDifference + 1; // +1 to include the last quarter
}

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
- Drag-and-drop course scheduling (using native HTML5 drag-and-drop)
- Unit count display
- Validation error indicators (orange triangles)
- Quick "mark as completed" option

### Drag-and-Drop Implementation
**Library**: Native HTML5 drag-and-drop API

The drag-and-drop system uses the native HTML5 drag-and-drop API for consistent cross-browser behavior and better performance. This provides a unified experience whether dragging from the major requirements list to quarters or between quarters.
**Scope**: List view only (not graph view initially)
**Features**:
- Touch device support for mobile accessibility
- Smooth visual feedback with opacity changes
- Consistent behavior across all drag operations
- Keyboard navigation and screen reader support

```typescript
// Course drag handlers
function handleCourseDragStart(event: DragEvent, courseId: string) {
	event.dataTransfer?.setData('text/plain', courseId);
	event.dataTransfer?.setData('application/x-bruinplan-course', courseId);
	event.dataTransfer!.effectAllowed = 'move';
}

// Quarter drop handlers
function handleDrop(event: DragEvent) {
	event.preventDefault();
	const courseId = event.dataTransfer?.getData('application/x-bruinplan-course') || 
	                 event.dataTransfer?.getData('text/plain');
	if (courseId) {
		schedulingService.scheduleCourse(courseId, quarterCode);
	}
}
```

## 3. Validation System

### Validation Rules
**Errors (⚠️❌):**
- Missing enforced prerequisite for scheduled course
- Course scheduled before its enforced prerequisites

**Warnings (⚠️):**
- Course scheduled more than 4 years in future

### Validation Display
- **⚠️❌ indicators**: Appear next to course IDs for errors everywhere they're displayed
- **⚠️ indicators**: Appear next to course IDs for warnings everywhere they're displayed
- **Error details**: Hover over the entire course item to see specific validation message

#### Message Format
- **Warning**: ⚠️ emoji only
- **Error**: ⚠️❌ emoji combination
- **Single prerequisite missing**: "Missing [Course]"
- **Multiple prerequisites missing from group**: 
  - If total remaining group options ≤ 3: "Needs X from {A}, {B}, {C}"
  - If total remaining > 3: "Needs X from {A}, {B}, {C}...(and Y more)"
- **Future quarter warning**: "Course scheduled far in the future"

#### Visual Styling
- **Warning background**: Light orange (bg-orange-100)
- **Error background**: Darker red (bg-red-200)
- **Text color**: Dark gray (text-gray-700)
- **Display**: Inline messages below course ID, not just hover tooltips



## 4. Auto-Reassignment Logic

### Past Quarter Detection
```typescript
const QUARTER_TRANSITIONS = {
  WINTER_START: { month: 0, day: 1 }, // Jan 1
  SPRING_START: { month: 2, day: 25 }, // Mar 25
  SUMMER_START: { month: 5, day: 17 }, // Jun 17
  FALL_START: { month: 8, day: 20 }   // Sep 20
};

function getCurrentQuarterCode(): number {
  const now = new Date();
  const year = now.getFullYear() % 100;
  let quarter = 4;
  if (isAfterTransition(now, QUARTER_TRANSITIONS.FALL_START)) {
    quarter = 4;
  } else if (isAfterTransition(now, QUARTER_TRANSITIONS.SUMMER_START)) {
    quarter = 3;
  } else if (isAfterTransition(now, QUARTER_TRANSITIONS.SPRING_START)) {
    quarter = 2;
  } else if (isAfterTransition(now, QUARTER_TRANSITIONS.WINTER_START)) {
    quarter = 1;
  } else {
    // Before Winter start (Jan 1), so we're in previous year's Fall
    return (year - 1) * 10 + 4;
  }
  return year * 10 + quarter;
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
2. Move them to completed status (quarter 1)
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
  isCompleted(courseId: string): boolean // quarterCode === 1
  
  // Validation
  validateSchedule(): ValidationError[]
  validateCourse(courseId: string): ValidationError[]
  
  
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
      newSchedule[courseId] = 1; // Mark as completed
    });
    
    localStorage.setItem('bruinplan_course_schedules', JSON.stringify(newSchedule));
    localStorage.removeItem('bruinplan_completed_courses'); // Clean up
  }
}
```

## 7. Implementation Phases

### Step 1: Core Infrastructure
1. Create `schedulingService.ts` with basic quarter assignment
2. Implement quarter code utilities and validation (year*10+quarter encoding)
3. Add basic quarter assignment UI to course details
4. Migration from completion service

### Step 2: Quarter Planning Interface  
1. Build `QuarterPlanningCalendar.svelte` component
2. Implement drag-and-drop scheduling

### Step 3: Quarter Planning Sidebar Component
**Goal**: Build the quarter planning sidebar for major pages
**Files to create/modify**:
  - `src/lib/components/major/QuarterPlanningCalendar.svelte` (new)
  - `src/lib/components/major/QuarterDisplay.svelte` (new)
  - `src/routes/majors/[majorId]/+page.svelte` (add sidebar)

**Clarifications and Implementation Notes**:
- Quarter range always starts from the current quarter (using new encoding). Default is 12 quarters, but expands automatically if the user schedules a course further in the future. Range resets after session ends.
- Sidebar shows "X" units per quarter with total unit count display.
- Course display in quarters shows only course ID and unit count. Tooltip on hover matches the graph tooltip. Quarter codes are displayed using the new format (e.g., "Winter 2025" for 251).
- No minimum number of quarters (other than zero). "Add a quarter" button is visible at the bottom of the sidebar (not fixed), requiring the user to scroll to see it.
- Sidebar is only shown on the major list view for now (not graph view).
- For Step 3, only static assignment is implemented. Code should be structured for easy drag-and-drop integration in Step 4. Quarter code utilities (encoding/decoding) are fully implemented and used throughout.
- Validation/error indicators will be added in Step 5, but code should be ready for future integration.

### Step 4: Drag-and-Drop Implementation and Enhanced Course Interaction
**Goal**: Enable dragging courses from major list to quarter sidebar with enhanced course interaction patterns
**Files to modify**:
- `src/lib/components/major/QuarterPlanningCalendar.svelte`
- `src/lib/components/major/MajorRequirementsList.svelte`
- `src/lib/components/major/MajorSection.svelte`
- `src/lib/components/major/QuarterDisplay.svelte`

**Enhanced Course Interaction Pattern**:
Each course in the major list has two clickable areas with different behaviors:
- **Checkbox**: Direct toggle to mark as complete (quarter code 1), providing quick completion
- **Course text**: Links to course prerequisite tree page (unchanged behavior)

**Drag-and-Drop Functions to implement**:
- Drag source setup for course items in major list
- Drop zone setup for quarter containers in sidebar
- Course scheduling on drop with conflict resolution
- Visual feedback and animations during drag operations
- Touch device support for mobile accessibility

**Success criteria**: 
- Can drag courses from major list to quarters, assignments persist
- Checkbox still provides quick completion toggle
- Course text links remain functional
- All interactions work on both individual courses and group options

### Step 5: Validation System Implementation
**Goal**: Add validation with error/warning indicators
**Files to modify**:
- `src/lib/services/shared/schedulingService.ts` (complete validation)
- `src/lib/components/shared/ValidationIndicator.svelte` (new)
- `src/lib/components/major/MajorRequirementsList.svelte`
- `src/lib/components/major/QuarterDisplay.svelte`

**Functions to implement**:
- Prerequisite validation logic
- Error/warning emoji display components

**Success criteria**: ⚠️❌/⚠️ indicators appear next to courses with validation issues

### Step 6: Auto-Reassignment and Polish
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

**Success criteria**: App automatically handles past quarters, all features work smoothly with proper validation indicators

### Additional Considerations:
- **Math Department Focus**: All course loading will use Math department data only, at least for the time being.
- **List View Priority**: Major graph view remains functional but unmodified
- **No Migration**: No need to migrate existing localStorage data
- **Incremental Testing**: Each step should maintain app functionality
- **Error Handling**: Robust error handling throughout all components