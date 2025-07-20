# Prerequisite Graph Visualization Specification

## Overview
This document defines the complete specification for interactive course prerequisite graph visualization using Cytoscape.js. 

**✅ Current Status**: All core prerequisite graph features are fully implemented with smooth animations, incremental updates, and robust completion tracking.

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

## 7. Accessibility

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

## 8. Component Architecture

**SvelteKit Component Structure:**
```
PrerequisiteGraph.svelte (main component)
├── CourseSearchHeader.svelte (course search input)
├── GraphContainer.svelte (Cytoscape.js graph wrapper)
├── ResizeHandle.svelte (drag handle for sidebar resize)
└── Sidebar components:
    ├── CourseDetails.svelte (selected course info & completion toggle)
    ├── PrerequisiteList.svelte (prerequisites with toggles & equivalent messages)
    ├── EquivalentCourses.svelte (equivalent courses with toggles)
    └── GraphLegend.svelte (collapsible legend with display toggles)
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

## 9. Implementation Technology

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
- Toggle controls for completed courses
- Clickable prerequisite links with auto-enabling of completed course visibility
- Equivalent course indicators with group-aware hiding logic
- Collapsible legend with real-time toggle states
- Component-based architecture for maintainability
- Cross-category edge hiding in major graphs
- Compound node support for major graph sections

**🔄 In Development:**
- Quarter-based planning system integration
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
