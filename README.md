# BruinPlan

A modern, interactive course planning tool for UCLA students — designed to provide a better alternative to the traditional DARS interface. This SvelteKit application visualizes course prerequisites with an interactive graph, allowing students to track completed courses and plan their academic path.

---

## Project Overview

UCLA's current Degree Audit Reporting System (DARS) provides dense, hard-to-interpret data. This project reimagines that experience with a visual and interactive frontend tool that allows students to:

- **Interactive Prerequisite Visualization**: Explore course prerequisites as an interactive graph with smart completion tracking
- **Course Completion Tracking**: Mark courses as completed with persistent localStorage storage
- **Equivalent Course Support**: Automatically handle equivalent courses that satisfy the same requirements
- **Smart Prerequisite Filtering**: Toggle visibility of enforced, warning, and recommended prerequisites
- **Group Requirement Handling**: Intelligently process "choose N from M" prerequisite groups
- **Detailed Course Information**: View course descriptions, units, prerequisites, and equivalents in a responsive sidebar
- **Completion-Aware Graph Traversal**: Only show relevant prerequisite chains based on what you've completed

---

## Current Features

### Implemented
- **Interactive Graph Visualization** using Cytoscape.js with Dagre layout
- **Course Completion System** with localStorage persistence and Svelte stores
- **Equivalent Course Support** with smart prerequisite satisfaction logic
- **Group Prerequisites** with dynamic "needs" calculation and auto-removal when satisfied
- **Intelligent Graph Traversal** that shows only completed prerequisite chains when toggled
- **Responsive Sidebar** with detailed course information and completion toggles
- **Visual Controls** for showing/hiding warnings, recommended prerequisites, and completed courses
- **Clickable Course Links** that navigate between courses and auto-enable visibility toggles
- **Equivalent Course Indicators** with group-aware hiding logic
- **Component Architecture** with 7 modular Svelte components for maintainability

### Key Technical Achievements
- **Smart Group Logic**: Groups automatically adjust their "need N" count based on completed courses
- **Effective Completion**: Courses are considered complete if the student took them OR any equivalent
- **Graph Optimization**: Only renders relevant nodes/edges based on completion status and toggle settings
- **Auto-Toggle Logic**: Automatically enables "Show Completed Courses" when clicking on completed course links
- **localStorage Integration**: Seamless persistence of completion state across browser sessions

---

## Tech Stack

| Layer       | Technology       | Purpose |
|-------------|-----------------|---------|
| Framework   | SvelteKit       | Component-based web app with SSR/SSG |
| Language    | TypeScript      | Type-safe development |
| Styling     | Tailwind CSS    | Utility-first responsive design |
| Graph       | Cytoscape.js    | Interactive graph visualization |
| Layout      | Dagre           | Hierarchical graph layout algorithm |
| State       | Svelte Stores   | Reactive state management |
| Storage     | localStorage    | Client-side persistence |

---

## Component Architecture

```
src/lib/
├── PrerequisiteGraph.svelte (main component)
├── components/
│   ├── CourseSearchHeader.svelte
│   ├── GraphContainer.svelte  
│   ├── ResizeHandle.svelte
│   ├── CourseDetails.svelte
│   ├── PrerequisiteList.svelte
│   ├── EquivalentCourses.svelte
│   └── GraphLegend.svelte
├── services/
│   ├── prerequisiteGraph.ts (core graph logic)
│   ├── completionService.ts (localStorage & stores)
│   ├── tooltipService.ts (graph tooltips)
│   └── loadCourses.ts (data loading)
└── types.ts (TypeScript definitions)
```

---

## Development Roadmap

### Next Priority Features
1. **Major Visualization Pages** - Create pages to view complete major requirements with prerequisite trees
2. **Course Search & Discovery** - Enhanced search functionality across all departments
3. **Academic Path Planning** - Quarter-by-quarter course planning with prerequisite validation
4. **Bulk Completion Import** - Import transcripts or completed courses from file/text

### Future Enhancements  
- **User Authentication** with UCLA Single Sign-On
- **Persistent Cloud Storage** for course plans and completion data
- **Real-time Course Data** integration with UCLA's APIs
- **Grade Distribution Integration** via UCLAGrades
- **Professor Reviews** via Bruinwalk API
- **Course Availability Tracking** with enrollment alerts
- **Mobile Optimization** and PWA features
- **Collaborative Features** for study groups and advisors

---

## Getting Started

```bash
# Clone the repository
git clone <repository-url>
cd bruinplan

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Sample Usage
1. Navigate to `/courses/MATH 115A` to see prerequisites for Linear Algebra
2. Click on prerequisite courses to explore their requirements
3. Use the sidebar toggles to mark courses as completed
4. Toggle visibility of different prerequisite types using the legend
5. Watch the graph intelligently update based on your completion status

---

## Data Sources

- **Course Data**: UCLA course catalog and prerequisite information
- **Major Requirements**: Official degree requirement documents
- **Equivalent Courses**: UCLA transfer credit and course equivalency data

Course data is stored in structured JSON files in the `courses/` and `majors/` directories, with TypeScript interfaces ensuring data consistency and type safety.

---
