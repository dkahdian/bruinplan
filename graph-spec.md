# Prerequisite Graph Visualization Specification

## 1. Graph Structure

- **Nodes:**
  - **Course Node:** Represents a course (e.g., "MATH 115A").
    - Label: Course ID (e.g., "MATH 115A")
    - On hover: Show tooltip with course title, unit count, and description.
    - On click: Triggers highlighting (see Interactivity).
  - **Group Node:** Represents a group of requisites (e.g., "need 1 of the following").
    - Label: "Group (need N)" where N is the `needs` value from the group.
    - On hover: Tooltip: "Group: need N of the following courses."
    - On click: Triggers highlighting (see Interactivity).

- **Edges:**
  - **From Course to Group:** Solid line, color depends on group type (enforced/warning).
  - **From Group to Option Course:** Dashed line, same color as group.
  - **From Course to Course (non-group requisite):** Solid line, color depends on requisite type (enforced/warning).
  - **Recommended requisites:** Dotted gray line (optional, can be toggled).

---

## 2. Visual Styling

- **Node Shapes:**
  - Course Node: Rounded rectangle.
  - Group Node: Circle or diamond.

- **Node Colors:**
  - Default: White background, black border.
  - Highlighted (see Interactivity): Blue (ancestors), Green (descendants), or as appropriate.
  - Grayed out: Light gray for non-highlighted nodes.

- **Edge Styles:**
  - **Enforced:** Solid blue.
  - **Warning:** Solid orange.
  - **Group:** Dashed, color matches group type (blue/orange).
  - **Recommended:** Dotted gray.

- **Legend:**  
  - Display a legend explaining node shapes, edge colors/styles, and highlighting.

---

## 3. Interactivity

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

- **Expand/Collapse:**  
  - For large graphs, allow collapsing/expanding subtrees (optional).

---

## 4. Data Mapping

- **Course Node:**  
  - `ID`, `Title`, `Units`, `Description` from JSON.
- **Group Node:**  
  - Created for each group in `requisites`, labeled with `needs`.
- **Edges:**  
  - Created according to the structure in the `requisites` array.

---

## 5. Layout

- **Hierarchical/topological layout:**  
  - Prerequisites above or to the left of dependent courses.
  - Group nodes placed between parent and option courses.
- **Minimize edge crossings** for clarity.

---

## 6. Accessibility

- **Colorblind-friendly palette** for edge colors.
- **Keyboard navigation** for node selection and traversal.
- **Tooltips** for all interactive elements.

---

## 7. Export/Share

- **Export as image/PDF** (optional).
- **Shareable link** to a specific course's graph (optional).

---

## 8. Performance

- **Efficient rendering** for large graphs (virtualization, lazy loading, etc.).
- **Cycle detection** (should not occur, but warn if found).

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

---

## Example Node/Edge Structure

```
[Course: MATH 156]
   |
   |--(solid blue)--> [Group (need 1)]
   |                      |
   |                      |--(dashed blue)--> [Course: MATH 170A]
   |                      |--(dashed blue)--> [Course: MATH 170E]
   |                      |--(dashed blue)--> [Course: STATS 100A]
   |
   |--(solid orange)--> [Course: PIC 10A]
```

---

## Summary Table

| Element         | Shape/Style           | Color/Style         | Tooltip/Label                | On Click Highlight         |
|-----------------|----------------------|---------------------|------------------------------|---------------------------|
| Course Node     | Rounded rectangle    | White/Black border  | Title, units, description    | Ancestors/descendants     |
| Group Node      | Circle/Diamond       | White/Black border  | "Group: need N..."           | Options/parents           |
| Enforced Edge   | Solid                | Blue                | None                         |                           |
| Warning Edge    | Solid                | Orange              | None                         |                           |
| Group Edge      | Dashed               | Blue/Orange         | None                         |                           |
| Recommended     | Dotted               | Gray                | None                         |                           |

---

## Implementation Notes

- Use Cytoscape.js with Dagre layout for hierarchical prerequisite visualization
- Build a course lookup map for efficient traversal
- Recursively traverse `requisites` for ancestor/descendant highlighting
- For group nodes, always show the "need N" label
- Leverage Cytoscape's built-in event system for interactivity
- Use Dagre's ranking system to properly position prerequisite chains

---

**This spec provides a clear, interactive, and visually distinct prerequisite graph using Cytoscape.js for your course catalog.**
