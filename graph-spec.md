# Prerequisite Graph Visualization Specification

## 1. Graph Structure

- **Nodes:**
  - **Course Node:** Represents a course (e.g., "MATH 115A").
    - Label: Course ID (e.g., "MATH 115A")
    - On hover: Show tooltip with course title, unit count, and description.
    - On click: Triggers highlighting (see Interactivity).
    - **Completed Course:** Light green background with green border when marked as completed by user.
  - **Group Node:** Represents a group of requisites (e.g., "need 1 of the following").
    - Label: "Group (need N)" where N is the remaining `needs` value after accounting for completed courses.
    - On hover: Tooltip: "Group: need N of the following courses."
    - On click: Triggers highlighting (see Interactivity).
    - **Auto-removal:** Groups are automatically removed when fully satisfied by completed courses, with completed courses linking directly to the group's targets.

- **Edges:**
  - **From Course to Group:** Solid line, color depends on group type (enforced/warning).
  - **From Group to Option Course:** Dashed line, same color as group.
  - **From Course to Course (non-group requisite):** Solid line, color depends on requisite type (enforced/warning).
  - **Recommended requisites:** Dotted gray line (optional, can be toggled).
  - **Completed course edges:** Light green color for edges leaving completed courses (which also means incoming edges to completed courses are light green since only completed prerequisites are shown).

---

## 2. Visual Styling

- **Node Shapes:**
  - Course Node: Rounded rectangle.
  - Group Node: Diamond.

- **Node Colors:**
  - **Completed courses:** Light green background with green border.
  - **Warnings:** Yellow background.
  - **Recommended:** Light yellow background.
  - **Enforced:** Red background.
  - **Highlighted (see Interactivity):** Light blue background.
  - **Grayed out:** Light gray for non-highlighted nodes.

- **Edge Styles:**
  - **Completed:** Light green (edges leaving completed courses).
  - **Enforced:** Red.
  - **Warning:** Orange.
  - **Group:** Dashed, color matches group type (red/orange).
  - **Recommended:** Dotted orange.

- **Legend:**  
  - Display a legend explaining node shapes, edge colors/styles, and highlighting.

---

## 3. Course Completion System

- **Completion Tracking:**
  - Users can mark courses as completed via toggle in the sidebar.
  - Completed courses stored in localStorage as simple array of course IDs.
  - Completed courses become "root" nodes with no prerequisites shown (unless "Show completed courses" is enabled).

- **Group Logic with Completion:**
  - Group requirements are reduced by the number of completed courses in that group.
  - Example: "Need 2 of 3" with 1 completed becomes "Need 1 of 2".
  - Fully satisfied groups are removed entirely, with completed courses linking directly to the group's targets.

- **Display Toggles:**
  - **Show Warnings/Recommended:** Normal prerequisite filtering (overridden by completion status).
  - **Show Completed Courses:** (Appears only when user has completed courses)
    - ON: Show completed courses and traverse only through completed prerequisites.
    - OFF: Hide all completed courses entirely.

- **Traversal Algorithm:**
  ```pseudocode
  if course is completed:
    if showCompletedCourses is false:
      don't render this course and skip adding its prerequisites (return)
    else: 
      for course in requisites and in any depth of nested group:
        if the course is completed:
          render the course (recursive call)
        else:
          ignore the course
  ```

---

## 4. Interactivity

- **Hover:**
  - Show tooltip for node (course/group) with relevant info.

- **Click:**
  - **On Course Node:**
    - Highlight all ancestor nodes/edges (prerequisites) in one color (e.g., blue).
    - Highlight all descendant nodes/edges (courses that require this course) in another color (e.g., green).
    - All other nodes/edges are grayed out.
  - **On Group Node:**
    - Highlight all option courses in the group and their ancestors (prereqs).
    - Highlight all parent courses (courses that depend on this group).
    - All other nodes/edges are grayed out.
  - **Clicking background:** Resets all highlights.

- **Completion Toggle:**
  - Located in sidebar next to course units.
  - Immediately updates localStorage and rebuilds graph.
  - Maintains normal hover/click interactions for completed courses.

---

## 5. Data Mapping

- **Course Node:**  
  - `ID`, `Title`, `Units`, `Description` from JSON.
  - Completion status from localStorage.
- **Group Node:**  
  - Created for each group in `requisites`, labeled with remaining `needs` after completion.
  - Automatically removed when `needs` reaches 0.
- **Edges:**  
  - Created according to the structure in the `requisites` array.
  - Modified based on completion status and group satisfaction.

---

## 6. Layout

- **Hierarchical/topological layout:**  
  - Prerequisites above or to the left of dependent courses.
  - Group nodes placed between parent and option courses.
  - Completed courses can become isolated "root" nodes when prerequisites are hidden.
- **Minimize edge crossings** for clarity.

---

## 7. Accessibility

- **Colorblind-friendly palette** for edge colors.
- **Keyboard navigation** for node selection and traversal.
- **Tooltips** for all interactive elements.

---

## 8. Export/Share

- **Export as image/PDF** (optional).
- **Shareable link** to a specific course's graph (optional).

---

## 9. Implementation Technology

**Library Choice: Cytoscape.js with Dagre layout**

### SvelteKit Component Structure:
```typescript
// PrerequisiteGraph.svelte
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';

// Register dagre layout
cytoscape.use(dagre);

// Initialize with custom styles matching spec
const cy = cytoscape({
  layout: { name: 'dagre', rankDir: 'TB' },
  style: [/* Custom styles for nodes/edges */],
  elements: [/* Graph data from JSON */]
});
```

### Data Management:
```typescript
// services/completionService.js
// Manages localStorage for completed courses
// Provides functions for marking/unmarking completion
// Handles graph data transformation based on completion status
```

---

## Summary Table

| Element         | Shape/Style           | Color/Style         | Tooltip/Label                | On Click Highlight         |
|-----------------|----------------------|---------------------|------------------------------|---------------------------|
| Course Node     | Rounded rectangle    | White/Black border  | Title, units, description    | Ancestors/descendants     |
| Completed Course| Rounded rectangle    | Light green/Green border | Title, units, description | Ancestors/descendants     |
| Group Node      | Diamond              | White/Black border  | "Group: need N..."           | Options/parents           |
| Enforced Edge   | Solid                | Red                 | None                         |                           |
| Warning Edge    | Solid                | Orange              | None                         |                           |
| Completed Edge  | Solid                | Light green         | None                         |                           |
| Group Edge      | Dashed               | Red/Orange          | None                         |                           |
| Recommended     | Dotted               | Orange              | None                         |                           |

---

## Implementation Notes

- Use Cytoscape.js with Dagre layout for hierarchical prerequisite visualization
- Build a course lookup map for efficient traversal
- Recursively traverse `requisites` for ancestor/descendant highlighting, respecting completion status
- For group nodes, always show the remaining "need N" label after accounting for completed courses
- Leverage Cytoscape's built-in event system for interactivity
- Use Dagre's ranking system to properly position prerequisite chains
- Implement completion service for localStorage management and graph data transformation
- Graph rebuilds seamlessly when completion status changes
- Completed courses only show when "Show completed courses" toggle is enabled
- Only completed prerequisites are rendered when showing completed courses

---
