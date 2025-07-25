# Prerequisite Graph Visualization Specification

## Overview
This document defines the complete specification for interactive course prerequisite graph visualization using Cytoscape.js. 

**✅ Current Status**: All core prerequisite graph features are fully implemented with smooth animations, incremental updates, robust completion tracking, empty graph handling, course navigation with search functionality, and comprehensive state persistence.

## 1. Graph Structure

- **Nodes:**
  - **Course Node:** Represents a course (e.g., "MATH 115A").
    - Label: Course ID (e.g., "MATH 115A")
    - Shape: Rounded rectangle
    - On hover: Show tooltip with course title, unit count, and description.
    - On click: Updates sidebar with course details and triggers highlighting (see Interactivity).
    - **Completed Course:** Light green background (#dcfce7) with green border (#22c55e) when marked as completed by user.
  - **Group Node:** Represents a group of requisites (e.g., "need 1 of the following").
    - Label: "Group (need N)" where N is the remaining `needs` value after accounting for completed courses.
    - Shape: Diamond
    - Background color: light yellow for groups
    - Border: solid for groups
    - On hover: Tooltip: "Group: need N of the following courses."
    - On click: Triggers highlighting (see Interactivity).
    - **Auto-removal:** Groups are automatically removed when fully satisfied by completed courses, with completed courses linking directly to the group's targets.

- **Edges:**
  - **Prerequisites:** Orange solid line with triangle arrow
  - **From completed courses:** Light green (#22c55e) edges override other colors when the prerequisite is completed

---

## 2. Visual Styling

- **Node Shapes:**
  - Course Node: Rounded rectangle (80x40px)
  - Group Node: Diamond (60x60px)

- **Node Colors:**
  - **Regular courses:** White background with black border
  - **Completed courses:** Light green background (#dcfce7) with green border (#22c55e) and dark green text (#15803d)
  - **Selected course:** Light blue background (#dbeafe) with blue border (#3b82f6) and blue text (#1e40af)
  - **Selected completed course:** Slightly darker green background (#bbf7d0) with green border (#16a34a)
  - **Groups:** Light yellow background with orange border

- **Edge Styles:**
  - **Prerequisites:** Orange solid line with triangle arrow
  - **From completed courses:** Light green (#22c55e) with 80% opacity

- **Legend:**  
  - Collapsible legend in bottom-left corner explaining node shapes, edge colors/styles
  - Shows current toggle states for warnings and completed courses

---

## 3. Course Completion System

- **Completion Tracking:**
  - Users can mark courses as completed via toggles in the sidebar course details panel
  - Toggle switches in prerequisite lists and equivalent courses sections
  - Completed courses stored in localStorage using Svelte stores
  - Equivalent courses: if any equivalent is completed, the requirement is satisfied

- **Completion Effects:**
  - Completed courses get green styling (background, border, text)
  - Edges from completed courses are rendered in light green
  - Group requirements are reduced by the number of effectively completed courses (including equivalents)
  - Example: "Need 2 of 3" with 1 completed becomes "Need 1 of 2"
  - Fully satisfied groups are removed entirely, with direct edges from completed courses to group targets

- **Display Toggles (in collapsible legend):**
  - **Show Completed Courses:** (Appears only when user has completed courses)
    - ON: Show completed courses and traverse their prerequisite chains
    - OFF: Hide all completed courses and their prerequisites entirely

- **Equivalent Course Handling:**
  - Courses can have equivalent courses that satisfy the same requirement
  - If a prerequisite is satisfied by a completed equivalent, shows green "✓ Took equivalent: COURSE_ID" message
  - Equivalent course ID is clickable and highlights the original course in the graph
  - If the equivalent course is also present in the same prerequisite group, the equivalent message is hidden
  - Auto-enables "Show Completed Courses" if user clicks on completed course while toggle is off

- **Smart Graph Traversal:**
  ```pseudocode
  if course is effectively completed (self or equivalent):
    if showCompletedCourses is false:
      don't render this course and skip its prerequisites (return)
    else: 
      for each prerequisite (including nested groups):
        if prerequisite is effectively completed:
          render the prerequisite (recursive call)
        else:
          ignore the prerequisite (only show completed prerequisite chains)
  ```

---

## 4. Interactivity

- **Hover:**
  - Show tooltip for node (course/group) with relevant info (title, units, description)

- **Click:**
  - **On Course Node:**
    - Updates sidebar with course details (title, description, units, prerequisites, equivalent courses)
    - Shows completion toggles in sidebar for the course, its prerequisites, and equivalent courses
    - Highlights the clicked node with blue styling
  - **On Group Node:**
    - Updates sidebar to show group information
    - Highlights the clicked group node
  - **Clicking background:** Resets selection and clears sidebar

- **Sidebar Interactions:**
  - **Course Completion Toggles:** Located next to course listings in the sidebar
    - Main course toggle in course details section
    - Individual prerequisite toggles in prerequisites list
    - Individual equivalent course toggles in equivalents section
    - Immediately updates localStorage and rebuilds graph upon toggle
  - **Prerequisite Course Links:** Clickable course IDs that redirect to that course's graph
    - If clicked course is completed and "Show Completed Courses" is off, automatically enables the toggle
  - **Equivalent Course Messages:** Green "✓ Took equivalent: COURSE_ID" with clickable course ID
    - Highlights the original course node when clicked
    - Hidden if the equivalent is also present in the same prerequisite group

- **Graph Controls:**
  - **Collapsible Legend:** Bottom-left corner with toggle controls
  - **Resizable Sidebar:** Drag handle between graph and sidebar for width adjustment
  - **Course Search:** Header input for jumping to specific courses

---

## 5. Data Mapping

- **Course Node:**  
  - `id`, `title`, `units`, `description`, `equivalentCourses` from JSON
  - Completion status from localStorage via Svelte stores
  - Prerequisites parsed from `requisites` array
- **Group Node:**  
  - Created for each group in `requisites`, labeled with remaining `needs` after accounting for completed courses
  - Automatically removed when `needs` reaches 0 due to completed courses
- **Edges:**  
  - Created according to the structure in the `requisites` array
  - All prerequisite edges are orange solid lines
  - Edges from completed courses override colors with light green

---

## 6. Layout

- **Hierarchical Layout (Dagre):**  
  - Prerequisites positioned above dependent courses (top-to-bottom flow)
  - Group nodes placed between parent courses and their option courses
  - Completed courses can become isolated nodes when their prerequisites are hidden
  - Automatic edge routing to minimize crossings and improve readability

- **Responsive Design:**
  - Adjustable graph/sidebar split with drag handle
  - Graph container fills available space
  - Cytoscape.js handles zoom and pan interactions

---

## 7. Empty Graph Handling

When no prerequisite relationships exist (either no prerequisites or all completed courses are hidden):

- **Empty State Display:**
  - Medium-sized light gray text: "No prerequisites found for [courseId]"
  - Centered in graph area
  - Background: same as normal graph background (#f9fafb)

- **Conditional Show Completed Toggle:**
  - When `showCompletedCourses` is `false`, displays additional button
  - Button text: "Try showing completed courses?"
  - Button style: Light purple background (#f3e8ff), blue text, rounded corners (similar to search toggle)
  - On click: Toggles `showCompletedCourses` to `true` and rebuilds graph
  - Syncs with legend toggle and persists to localStorage

---

## 8. Course Navigation Header

The prerequisite graph page includes a comprehensive navigation header:

- **Title Section (Left):**
  - Bold text: "Prerequisites for" followed by clickable course ID
  - Course ID is styled as interactive button (purple background)
  - Clicking course ID opens search dropdown below header

- **Search Functionality:**
  - Search dropdown appears when course ID is clicked
  - Direct search input with placeholder "Type course ID or name..."
  - Real-time search results with course ID, title, and units
  - Clicking result navigates to that course's prerequisite page
  - Proper URL formatting: removes spaces/special chars for route compatibility

- **Navigation Links (Right):**
  - "Back to all courses" → `/courses`
  - "See majors" → `/majors`
  - Traditional link styling (blue, underlined on hover)

- **Page Reactivity:**
  - Graph recreates when courseId changes (using Svelte `{#key}` block)
  - Sidebar updates reactively to match new course
  - Maintains proper SvelteKit client-side navigation

---

## 9. State Persistence

All user preferences are preserved across sessions using localStorage:

- **Legend State:**
  - `showWarnings`: Display warning-related prerequisites
  - `showCompletedCourses`: Show/hide completed course nodes
  - `isExpanded`: Legend collapse/expand state

- **Synchronization:**
  - Changes in legend toggles sync with empty graph toggle button
  - Changes in empty graph toggle sync with legend
  - All changes immediately persisted to localStorage
  - State loaded on component mount with SSR safety

---

## 10. Quarterly Planning Integration

**📋 Planned Feature**: Integration with quarter-based course scheduling system.

### Course Status Types
- **Completed courses**: localStorage value `'1'`, green styling, hidden when `showCompletedCourses` is `false`
- **In-plan courses**: localStorage value as 3-digit quarterly code (e.g., `'242'` for Fall 2024), purple styling
- **Unscheduled courses**: No localStorage entry, default white styling

### In-Plan Course Behavior
- **Visual styling**: Purple background/border to distinguish from completed (green) and unscheduled (white) courses
- **Always visible**: In-plan courses remain visible even when `showCompletedCourses` is `false` (since they are not completed)
- **Current logic compatibility**: Existing graph filtering logic should work unchanged, as in-plan courses are already shown but not currently marked visually

### Quarter Selection Interface
- **Toggle enhancement**: Existing completion toggles `( o)` get additional quarter dropdown button
- **Dropdown locations**: Available in tooltips, sidebar prerequisite sections, and nested group prerequisite sections
- **Quarter options**: TBD - either fixed number (12-15 quarters) or infinite scrolling interface
- **State changes**: Changing course quarter triggers complete graph rebuild

### Prerequisite Validation
- **Warning triangles**: Yellow warning triangles appear on courses with validation issues (same logic as majors page)
- **Tooltip integration**: Warning triangle shows by default, detailed warning message appears in tooltip on hover
- **Error edge styling**: Prerequisite edges (graph connections) causing validation errors display as **bold red** instead of orange
- **Validation scope**: Checks for prerequisite timing conflicts (e.g., MATH 115B scheduled before MATH 115A)

### Technical Implementation Notes
- Graph rebuilds completely on any quarter assignment change
- Validation system needs tooltip integration for detailed error messages  
- Edge styling system needs red error state for prerequisite violations
- localStorage management for 3-digit quarterly codes vs completion flag `'1'`

---

## 11. Accessibility

- **Visual Accessibility:**
  - High contrast orange color for prerequisite edges
  - High contrast text and borders
  - Clear visual distinction between node types (shapes) and states (colors)
  - Tooltips provide additional context for all interactive elements

- **Interaction Accessibility:**
  - Toggle switches have proper ARIA labels
  - Clickable course links have hover states and proper cursor styling
  - Collapsible legend with clear expand/collapse indicators

---

## 12. Component Architecture

**SvelteKit Component Structure:**
```
Course Page ([courseId]/+page.svelte)
├── CourseNavigationHeader.svelte (header with search & navigation)
├── PrerequisiteGraph.svelte (main graph component)
│   ├── GraphContainer.svelte (Cytoscape.js graph wrapper)
│   └── GraphLegend.svelte (collapsible legend with display toggles)
├── ResizeHandle.svelte (drag handle for sidebar resize)
└── CourseDetails.svelte (sidebar with course info & completion toggle)
```

**Course Navigation Header:**
```
CourseNavigationHeader.svelte
├── Search functionality (integrated course search)
├── Title display ("Prerequisites for [courseId]")
└── Navigation links (courses index, majors index)
```

**Service Layer:**
```typescript
// services/prerequisiteGraph.ts
// Core graph building logic, Cytoscape instance management, click handling

// schedulingService.ts is now used for course completion and scheduling
// localStorage management for completed courses using Svelte stores

// services/tooltipService.ts
// Tooltip functionality for graph nodes

// services/loadCourses.ts
// JSON course data loading and parsing
```

---

## 13. Implementation Technology

**Library Choice: Cytoscape.js with Dagre layout**

### Core Setup:
```typescript
// PrerequisiteGraph.svelte
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';

// Register dagre layout
cytoscape.use(dagre);

// Initialize with custom styles and layout
const cy = cytoscape({
  container: graphContainer,
  layout: { name: 'dagre', rankDir: 'TB' },
  style: defaultGraphStyles,
  elements: [...nodes, ...edges]
});
```

### Data Flow:
```typescript
1. Load course data from JSON files
2. Build courseMap for O(1) lookups  
3. Load completion state from localStorage
4. Build graph nodes/edges with completion-aware logic
5. Create Cytoscape instance with styled nodes/edges
6. Handle user interactions (clicks, toggles)
7. Rebuild graph when completion state changes
```

---

## Summary Table

| Element         | Shape/Style           | Color/Style         | Tooltip/Label                | Interactions              |
|-----------------|----------------------|---------------------|------------------------------|---------------------------|
| Course Node     | Rounded rectangle    | White/Black border  | Title, units, description    | Click to select & show sidebar |
| Completed Course| Rounded rectangle    | Light green/Green border | Title, units, description | Click to select & show sidebar |
| Group Node      | Diamond              | Light yellow        | "Group: need N..."           | Click to select           |
| Prerequisite Edge| Solid + arrow       | Orange              | None                         | Visual connection only    |
| Completed Edge  | Solid + arrow        | Light green         | None                         | Visual connection only    |

---

## Current Feature Status

**✅ Fully Implemented and Functional:**
- Complete Cytoscape.js graph with Dagre layout and smooth animations
- Always-on smooth positional animations for better user experience
- Incremental graph updates that only modify changed nodes/edges
- Course completion tracking with localStorage persistence
- Equivalent course support with smart prerequisite satisfaction
- Group prerequisite handling with robust diamond group satisfaction logic
- Intelligent graph traversal based on completion status
- Resizable sidebar with detailed course information
- Toggle controls for completed courses with localStorage persistence
- Clickable prerequisite links with auto-enabling of completed course visibility
- Equivalent course indicators with group-aware hiding logic
- Collapsible legend with real-time toggle states
- Component-based architecture for maintainability
- Cross-category edge hiding in major graphs
- Compound node support for major graph sections
- **Empty graph handling** with conditional toggle suggestions
- **Course navigation header** with search functionality and navigation links
- **State synchronization** between legend and empty graph toggles
- **Course search with proper URL navigation** using SvelteKit routing
- **Reactive page updates** when navigating between different courses

**🔄 In Development:**
- **Quarterly planning integration** with purple in-plan course styling and quarter selection dropdowns
- **Enhanced prerequisite validation** with red error edges and detailed tooltip warnings
- Data expansion beyond Mathematics department

**📋 Planned Future Enhancements:**
- Mobile responsive design and touch interactions
- Performance optimizations for very large course graphs
- Export graph functionality
- Advanced search and filtering integration

## Development Phases

### Phase 1: MVP (Public Launch Ready) - ✅ COMPLETE
**✅ All Features Implemented:**
- Complete Cytoscape.js graph with Dagre layout and smooth animations
- Always-on smooth positional animations for enhanced user experience
- Incremental graph updates for optimal performance
- Course completion tracking with localStorage persistence
- Equivalent course support with smart prerequisite satisfaction
- Robust diamond group satisfaction logic matching major graph implementation
- Intelligent graph traversal based on completion status
- Resizable sidebar with detailed course information
- Toggle controls for completed courses
- Clickable prerequisite links with auto-enabling of completed course visibility
- Equivalent course indicators with group-aware hiding logic
- Collapsible legend with real-time toggle states
- Component-based architecture for maintainability
- None!

### Phase 2: Enhanced User Experience
- Mobile responsive design and touch interactions
- Performance optimizations for large course graphs
- Better error handling and loading states
- Export graph as image/PDF functionality
- Accessibility improvements (keyboard navigation, screen reader support)
- Advanced animation customization options

### Phase 3: Advanced Features
- Shareable links to specific course graphs
- Prerequisite path highlighting (ancestors/descendants)
- Enhanced graph animation transitions
- Bulk course completion import/export
- Advanced search and filtering integration
- Real-time course availability indicators
- Integration with quarter planning system

---
