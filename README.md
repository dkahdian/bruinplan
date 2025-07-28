# BruinPlan

A modern, interactive course planning tool for UCLA students — designed to provide a better alternative to the traditional DARS interface. This static site visualizes course requirements, prerequisites, and scheduling paths to make degree planning intuitive and personalized.

---

## Project Overview

UCLA's current Degree Audit Reporting System (DARS) provides dense, hard-to-interpret data. This project reimagines that experience with a modern, visual, and interactive frontend tool that allows students to:

- **Visualize course prerequisites** in interactive graphs with smooth animations
- **Explore major requirements** through organized sectioned layouts
- **Track degree progress** with intelligent completion tracking
- **Navigate complex dependencies** between courses and requirements
- **Plan course sequences** with prerequisite validation and drag-and-drop scheduling
- **Filter and explore** courses by department and completion status
- **Experience smooth interactions** with always-on animations and incremental updates

**Key Innovation**: Advanced graph visualization using Cytoscape.js with sophisticated prerequisite logic, equivalent course handling, and dynamic group satisfaction algorithms combined with intuitive drag-and-drop quarter planning.

---

## Current Tech Stack (Static Site Phase)

| Layer       | Tech             | Description |
|-------------|------------------|-------------|
| Framework   | [SvelteKit](https://kit.svelte.dev/) | Component-based web app framework |
| Language    | TypeScript       | Static typing for safer development |
| Styling     | Tailwind CSS     | Utility-first styling |
| Graph Visualization | [Cytoscape.js](https://js.cytoscape.org/) | Interactive graph library with Dagre layout |
| Hosting     | GitHub Pages     | Simple, free static site hosting |

---

## Goals & Features

### Phase 1: MVP (Public Launch Ready)
- [x] **Interactive graph visualization** with Cytoscape.js and Dagre layout
- [x] **Course prerequisite graphs** with smooth always-on animations
- [x] **Major requirement lists** with sectioned layouts and cross-category logic
- [x] **Advanced completion tracking** with equivalent course support
- [x] **Incremental graph updates** for optimal performance
- [x] **Robust group satisfaction logic** for diamond prerequisite groups
- [x] **Static routing and pages** with SvelteKit
- [x] **Tailwind-based UI** with resizable sidebars and collapsible legend
- [x] **Component-based architecture** for maintainability
- [x] **Department and course filtering** UI
- [x] **Quarter-by-quarter planning interface** with drag-and-drop scheduling
- [x] **Data expansion**: All UCLA departments and subjects now included (168 subject files in `static/courses/`)
- [x] **Essential pages** (About, Help, Report Bug)

### Phase 2: Enhanced User Experience
- [ ] Mobile responsiveness and improved UI/UX
- [ ] Better error handling and loading states
- [ ] Performance optimizations for large datasets
- [ ] Export/import functionality for course plans
- [ ] Accessibility improvements

### Phase 3: Advanced Features
- [ ] Advanced search and filtering (by professor, availability, grading distribution)
- [ ] Integration with external APIs (Bruinwalk, UCLAGrades)
- [ ] Real-time course availability and capacity updates
- [ ] Prerequisite path optimization and course sequencing suggestions

---

## Current Status

**🎯 MVP Progress**: Phase 1 implementation is ~98% complete
- ✅ **Advanced graph visualization** with Cytoscape.js, smooth animations, and incremental updates
- ✅ **Complete prerequisite system** with equivalent courses and diamond group satisfaction
- ✅ **Major requirement lists** with sectioned layouts and completion tracking
- ✅ **Sophisticated completion tracking** with localStorage persistence and intelligent traversal
- ✅ **Modern UI architecture** with SvelteKit, TypeScript, and Tailwind CSS
- ✅ **Component-based design** for maintainability and extensibility
- ✅ **Quarter-based planning system** with drag-and-drop scheduling
- ✅ **Data expansion**: All departments and subjects now included (168 subject files in `static/courses/`, each a JSON array of courses)
- 🔄 **Basic pages**: about, home, report bug, etc

**🚀 Launch Timeline**: Core functionality and data expansion are complete. Targeting full MVP launch after essential pages are finished.

---

## Technical Architecture

### Graph Visualization System
- **Cytoscape.js**: Core graph rendering with Dagre layout algorithm
- **Smooth Animations**: Always-on positional animations for enhanced user experience
- **Incremental Updates**: Efficient graph updates that only modify changed nodes/edges
- **Compound Nodes**: Support for sectioned layouts in major graphs
- **Advanced Styling**: Dynamic node/edge styling based on completion status and prerequisite types

### Prerequisite Logic Engine
- **Diamond Group Satisfaction**: Sophisticated "choose N from M" requirement handling
- **Equivalent Course Support**: Smart prerequisite satisfaction with alternative courses
- **Recursive Prerequisite Resolution**: Automatic inclusion of missing prerequisites
- **Completion-Aware Traversal**: Dynamic graph building based on user completion status

### Quarter Planning System
- **Drag-and-Drop Scheduling**: Intuitive course assignment to quarters
- **Prerequisite Validation**: Smart checking to ensure logical course sequences
- **Progress Tracking**: Dual-colored progress bars showing completed and planned courses
- **Quarter Management**: Flexible quarter range with add/remove functionality

### Data Management
- **JSON-Based Course Database**: Structured course and major requirement data
  - Courses are now split into 168 per-subject files: `static/courses/[SUBJECT].json`
  - Each file is a JSON array of course objects (not an object with a `courses` array)
  - `equivalentCourses` is always an empty array for now (future support planned)
- **localStorage Persistence**: Client-side completion tracking without backend
- **Svelte Stores**: Reactive state management for completion status
- **TypeScript Type Safety**: Comprehensive type definitions for all data structures

### Component Architecture
- **Modular Design**: Reusable components for graphs, sidebars, and controls
- **Service Layer**: Separate business logic from UI components
- **Event-Driven**: Reactive updates throughout the application
- **Accessibility-First**: Proper ARIA labels and keyboard navigation support

---

## Contributing

This project is designed to be a comprehensive solution for UCLA course planning. If you're interested in contributing:

1. **Data Collection**: Help expand course and major data beyond Mathematics
2. **UI/UX**: Improve mobile responsiveness and accessibility
3. **Testing**: Validate prerequisite logic and course planning features
4. **Documentation**: Enhance user guides and technical documentation

---

## License

This project is open source and available under the MIT License. See the LICENSE file for more details.

---

## Data Sourcing & Technical Approach

### Course & Major Data Collection
- **Data Source**: UCLA course catalog and degree requirements (publicly available online)
- **Collection Method**: 
  - Selenium scripts to extract raw data from UCLA systems
  - AI-assisted parsing to convert raw data into structured JSON format
  - Automated testing to ensure format consistency and data integrity
- **Update Strategy**: Quarterly update scripts to maintain current course information

### Course Planning System
- **Planning Logic**: Enhanced completion tracking with quarter assignments
  - Current: Binary completed/not completed status
  - Planned: Quarter-specific assignments (e.g., 125 → Winter 2025, 327 → Summer 2027, 0 → completed)
- **Prerequisite Validation**: Smart checking to ensure prerequisites are planned in logical order
- **Interface**: Quarter-by-quarter calendar sidebar on major pages

### Quarter-Based Planning System

The planning interface will evolve from the current binary completion tracking to a sophisticated quarter assignment system:

**Current System:**
- Binary status: completed vs. not completed
- Stored in localStorage as a simple Set

**Planned System:**
- Quarter-specific assignments with numeric codes:
  - `125` → Winter 2025
  - `327` → Summer 2027  
  - `0` → Completed (already taken)
- **Smart Validation**: Automatic checking to ensure prerequisites are scheduled before dependent courses
- **Visual Calendar**: Quarter-by-quarter sidebar on major pages showing planned course sequence
- **Drag-and-Drop Interface**: Intuitive course scheduling by dragging from requirements to quarters
- **Prerequisite Warnings**: Alert users when course scheduling violates prerequisite order

This approach maintains the static site architecture while providing sophisticated academic planning capabilities.

**📋 Detailed Specification**: See `quarter-planning-spec.md` for complete implementation details including data structures, validation rules, and UI components.

### Deployment Strategy
- **Static Site Hosting**: GitHub Pages for free, reliable hosting
- **No Backend Required**: LocalStorage for user data persistence
- **Scalable Architecture**: Designed to remain static while supporting advanced features

---
