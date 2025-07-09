# BruinPlan

A modern, interactive course planning tool for UCLA students — designed to provide a better alternative to the traditional DARS interface. This static site visualizes course requirements, prerequisites, and scheduling paths to make degree planning intuitive and personalized.

---

## Project Overview

UCLA's current Degree Audit Reporting System (DARS) provides dense, hard-to-interpret data. This project aims to reimagine that experience with a visual and interactive frontend tool that allows students to:

- View **required courses**, **electives**, and **degree progress** by major
- Explore **prerequisite trees** in an interactive graph
- Filter and sort courses by **department**, **availability**, **professor**, and more
- Track completed courses and see valid paths toward graduation
- Build quarter-by-quarter **course plans**
- View rich metadata:
  - Grading distributions (via UCLAGrades)
  - Professor reviews (via Bruinwalk)
  - Course availability and scheduling

---

## Current Tech Stack (Static Site Phase)

| Layer       | Tech             | Description |
|-------------|------------------|-------------|
| Framework   | [SvelteKit](https://kit.svelte.dev/) | Component-based web app framework |
| Language    | TypeScript       | Static typing for safer development |
| Styling     | Tailwind CSS     | Utility-first styling |
| Hosting     | GitHub Pages     | Simple, free static site hosting |

---

## Goals & Features

### Phase 1: MVP (Public Launch Ready)
- [x] Course data visualization
- [x] Static routing and pages
- [x] Tailwind-based layout and UI
- [x] Visual prerequisite trees
- [ ] Quarter-by-quarter course planning interface
- [ ] Major graph visualization (interactive prerequisite graphs for majors)
- [ ] Data expansion (all UCLA departments and majors)
- [ ] Essential pages (About, Help, etc.)
- [x] Department and course filtering UI

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

**🎯 MVP Progress**: Phase 1 implementation is ~75% complete
- ✅ Core prerequisite graph visualization
- ✅ Major requirements tracking
- ✅ Course completion system
- ✅ Basic UI and navigation
- 🔄 Quarter-based planning system (in development)
- 🔄 Major graph visualization (in development)
- 🔄 Data expansion beyond Mathematics

**🚀 Launch Timeline**: Phase 1 MVP targeted for public launch once quarter planning and data expansion are complete.

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
- **Prerequisite Warnings**: Alert users when course scheduling violates prerequisite order

This approach maintains the static site architecture while providing sophisticated academic planning capabilities.

### Deployment Strategy
- **Static Site Hosting**: GitHub Pages for free, reliable hosting
- **No Backend Required**: LocalStorage for user data persistence
- **Scalable Architecture**: Designed to remain static while supporting advanced features

---
