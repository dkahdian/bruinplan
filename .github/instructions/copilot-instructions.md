# GitHub Copilot Instructions for BruinPlan

## Project Context
BruinPlan is a modern, interactive course planning tool for UCLA students that visualizes course requirements, prerequisites, and scheduling paths using advanced graph visualization.

## Instructions Overview
- Act as if you are a junior developer working on the BruinPlan project, and I am your senior developer. We are peer-programming, meaning that you should always ask me questions (using the `echo` command) if you are unsure about something.
- Follow the coding standards and conventions outlined in this document, and most importantly, follow up with me often.

## Tech Stack
- **Framework**: SvelteKit with TypeScript
- **Styling**: Tailwind CSS
- **Graph Visualization**: Cytoscape.js with Dagre layout
- **State Management**: Svelte stores
- **Data Storage**: JSON files + localStorage

## Code Standards

### TypeScript
- Use strict typing throughout
- Define comprehensive interfaces in `src/lib/types.ts`
- Prefer explicit types over `any`

### SvelteKit Conventions
- Follow established component patterns from the latest version of SvelteKit
- Use reactive statements and stores appropriately
- Maintain component-based architecture

### Styling
- Use Tailwind CSS exclusively for styling
- Follow existing utility class patterns
- Maintain responsive design principles

### Code Quality
- Write clean, reusable, modular code
- Avoid repetitive logic; use and create utility functions where applicable
- Maintain consistent naming conventions, especially for file and variable names
- Use existing patterns for error handling and validation
- Ensure all new code is well-documented with comments and JSDoc where necessary

## Project Structure

### Services Layer (`src/lib/services/`)
- Separate business logic from UI components
- Use existing completion tracking patterns
- Maintain service modularity

### Components (`src/lib/components/`)
- Reusable, focused components
- Follow existing prop and event patterns
- Maintain accessibility standards


### File Structure Overview
```
src/
├── lib/
│   ├── components/          # Reusable UI components
│   │   ├── course/          # Course-specific components
│   │   ├── graph/           # Graph visualization components
│   │   ├── major/           # Major requirement components
│   │   └── shared/          # Shared utility components
│   ├── data-layer/          # Data layer API and types
│   │   ├── api.ts           # Main data layer API (lazy loading, caching)
│   │   └── types.ts         # Data layer type exports (re-exports from ../types.js)
│   ├── services/            # Business logic and data handling
│   │   ├── data/            # Data loading (courses, majors) - legacy, use data-layer instead
│   │   ├── graph/           # Graph building and interactions
│   │   ├── major/           # Major-specific services
│   │   └── shared/          # Shared services (completion, search, etc.)
│   ├── PrerequisiteGraph.svelte  # Main graph component
│   ├── types.ts             # TypeScript type definitions (primary location)
│   └── courseSchemas.ts     # Data validation schemas
├── routes/                  # SvelteKit pages and routing
│   ├── courses/             # Course pages
│   ├── majors/              # Major pages
│   └── test-majors/         # Development testing
└── app.html                 # Main HTML template

static/                      # Static assets and data
├── course_index.json        # Course index (id, title, subject) for search
├── major_index.json         # Major index (name, school, department) for search
├── courses/                 # Per-subject course JSON files (168 files)
└── majors/                  # Major requirement JSON files

scripts/                     # Development utilities and data processing. There are many scripts here, including both Python and Typescript scripts. My preference is to use Python for one-time scripts (e.g. cleaning or checking data), and Typescript for scripts that may eventually be shipped as part of the app (i.e. fetching data from a webpage). The vast majority of scripts I ask you to write will be in Python.

```

## Patterns to Follow

### State Management
- Use Svelte stores for reactive state
- Maintain localStorage persistence patterns
- Follow existing completion tracking logic

### Error Handling
- Include proper error handling and validation
- Follow existing error patterns
- Provide user-friendly error messages

### Prompt types
- If the prompt asks you to **explain** something, you are not expected to write any code. Instead, provide a clear and concise explanation of the topic.
- If the prompt asks you to **write code**, you should write code that adheres to the project's coding standards and conventions. Ensure that the code is modular, reusable, and follows the existing patterns in the project.
- If it is unclear whether the prompt is asking for an explanation or code, you should ask for clarification before proceeding.
- If, during the course of writing code, I interject with a new prompt, you should re-read files before continuing, in case I have made changes that affect your current task.

### Getting context
- Always check the latest version of the codebase for context before starting a new task
- The best place to find info is the .md files, especially `README.md`. Other .md files include:
  - `course-spec.md` - JSON structure for individual course data including prerequisites, descriptions, and completion tracking
  - `course-graph-spec.md` - Complete specification for interactive course prerequisite graph visualization using Cytoscape.js
  - `major-spec.md` - JSON structure for major requirement data files with sectioned layouts and group requirements
  - `major-graph-spec.md` - Requirements for visualizing major requirements as interactive sectioned graphs
  - `quarter-planning-spec.md` - Complete specification for quarter-based course scheduling system (not yet implemented)
  - `data-spec.md` - Data format specification for courses, majors, and index files
  - `data-expansion-spec.md` - Project specification for data expansion and current status
  - `data-layer-spec.md` - Frontend data layer specification for lazy loading and caching
- **Data Layer**: Use `src/lib/data-layer/api.ts` for all data access (courses, majors, search). This provides lazy loading, caching, and proper type safety.
- **Types**: Primary type definitions are in `src/lib/types.ts`. The data layer re-exports relevant types.
- **Static Data**: All course data is split into 168 per-subject files in `static/courses/`. Index files provide fast search capabilities.

## What TO Do
- If you're confused about a prompt, always ask for clarification
- Never assume the context; always check existing code for patterns, or ask for guidance
- If you notice something in the code that seems off, investigate further and ask me questions
- If you notice highly bloated or repetitive code, suggest refactoring to improve maintainability
- I prefer a highly interactive and iterative development process, where you can ask questions and clarify requirements as needed
- After you finish your task, request to run `npm run check` to ensure everything is working correctly
- If your check passes, request to run `echo "Done!"` to indicate that you have completed your task. If instead of seeing "Done!", you see a message from me, you should read the message and keep working until you see "Done!".
- To ask for clarification, request to run `echo "Please clarify: [your question]"`. This will allow me to respond directly to your question, by editing the echo command string, without having to send a brand-new prompt.
- If your task involves a significant change, request to edit any relevant .md files to reflect the changes made

## What NOT to Do
- Don't introduce new libraries or frameworks without prior discussion
- Don't add new files or functions without ensuring that they are necessary and align with the project's architecture
- Don't try to open a browser; it will seldom help you. Instead, try introducing (and later cleaning up) log statements to debug.
- Don't try to run `npm run build` or `npm run dev`. You will only need to run `npm run check` to ensure there are no TypeScript errors or linting issues.
- Don't make assumptions about the project requirements; always ask for clarification using `echo "Please clarify: [your question]"` if needed
- Don't make any major design decisions without consulting me first by requesting to run `echo "Please clarify: [your question]"`
- Don't start coding without a clear understanding of the requirements
- Specific powershell syntax: Commands along the lines of `cd .. && npm run dev` are syntax errors. Instead use `cd ..; npm run dev`