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

### Phase 1: Static MVP
- [x] Course data visualization
- [x] Static routing and pages
- [x] Tailwind-based layout and UI
- [x] Visual prerequisite trees
- [ ] Course planning interface
- [x] Department and course filtering UI

### Future Enhancements (Phase 2+)
- User authentication with UCLA Single Sign-On (Google)
- Upload and parse transcripts or DARS reports
- Persistent user plans stored in a backend (MongoDB or Supabase)
- Real-time updates on course availability and capacity
- Integration with external APIs (Bruinwalk, UCLAGrades)

---
