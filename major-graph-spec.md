# Major Graph Visualization Specification

## Overview
This document defines the requirements and approach for visualizing major requirements as interactive graphs. Major requirements are treated as "meta-courses" where all requirements are prerequisites to completing the major.

## Core Concept

### Major as Meta-Course
- The major itself is conceptually treated as a target course
- All major requirements are prerequisites to "completing the major" 
- Individual courses within major requirements may have their own prerequisites
- Shares most graph visualization logic with individual course prerequisite graphs

## Layout Design

### Sectioned Canvas Layout
- **Desktop**: Horizontal sections (swim lanes)
  - "Preparation for the Major" section on the left
  - "The Major" section on the right  
  - Additional sections as needed (flexible)
- **Mobile**: Vertical sections (stacked) - future consideration
- **Section Boundaries**: Clear visual divisions between requirement sections
- **Section Labels**: Prominent section titles and descriptions

### Course Placement
- Courses are placed within their designated section boxes
- Courses maintain prerequisite arrows to other courses
- **Cross-section arrows**: Prerequisites can point across section boundaries (e.g., MATH 33A in prep → MATH 115A in major)

## Visualization Modes

### Graph View (Default)
- **Prerequisites shown**: Display arrows between courses showing prerequisite relationships
- **Cross-section connections**: Show arrows between courses in different sections
- **Missing prerequisites**: Automatically add missing prerequisites to the same section as the course requiring them
- **Group handling**: Display group nodes using existing group visualization logic

### List View (Toggle)
- **No arrows**: Hide all prerequisite connections
- **Section-based layout**: Courses organized in clean lists within section boxes
- **Simplified view**: Easier course browsing without graph complexity
- **Toggle control**: Easy switch between graph and list modes

## Section Rendering

### Section Structure
```
┌─────────────────────────────────┐
│ Section Title                    │
│ Section Description             │
├─────────────────────────────────┤
│                                 │
│  [Course] → [Course] → [Group]  │
│     ↓           ↓         ↓     │
│  [Course]   [Course]  [Options] │
│                                 │
└─────────────────────────────────┘
```

### Flexible Sectioning
- **Non-standardized sections**: Section IDs and titles vary by major
- **Nested requirements**: Support unlimited nesting of groups within sections
- **Optional sections**: Handle sections with `needs: 0` (truly optional)
- **Dynamic sizing**: Sections resize based on content

## Course Integration

### Prerequisite Resolution
- **Course-level prerequisites**: Use existing course prerequisite data
- **Missing prerequisites**: If a major requirement course has prerequisites not listed in major requirements:
  - Automatically include the missing prerequisite in the same section
  - Render the prerequisite with appropriate connections
  - Mark as auto-added for potential visual distinction

### Completion Tracking
- **Shared completion state**: Use same completion tracking as individual course graphs
- **Section progress**: Calculate completion progress per section
- **Major progress**: Overall major completion percentage
- **Group satisfaction**: Handle group completion using existing group logic

## Graph Features

### Shared Functionality
- **Node styling**: Same visual styling as course prerequisite graphs
- **Completion indicators**: Green styling for completed courses
- **Group nodes**: Diamond shapes for "choose N from M" requirements
- **Equivalent courses**: Same equivalent course handling and indicators
- **Toggle controls**: Warning/recommended/completed course visibility toggles

### Major-Specific Features
- **Section boundaries**: Visual containers for requirement sections
- **Cross-section arrows**: Prerequisites spanning multiple sections
- **Progress indicators**: Per-section and overall completion tracking
- **Section collapse/expand**: Optional hiding of completed sections

## Data Processing

### Major Data Loading
1. **Load major JSON**: Parse major requirement structure
2. **Resolve course references**: Look up full course data for each courseId
3. **Process prerequisites**: For each major requirement course:
   - Load its individual prerequisites from course database
   - Add missing prerequisites to appropriate sections
   - Build prerequisite graph including cross-section connections

### Graph Building Algorithm
```typescript
1. Create section containers
2. For each section:
   a. Process requirements (courses and groups)
   b. For each course requirement:
      - Add course node to section
      - Load course prerequisites from database
      - Add missing prerequisites to same section
      - Create prerequisite edges (including cross-section)
   c. For each group requirement:
      - Create group node
      - Process group options recursively
3. Apply completion logic and filtering
4. Render in sectioned layout
```

## User Interactions

### Graph Controls
- **View toggle**: Switch between graph view and list view
- **Section controls**: Expand/collapse individual sections
- **Standard toggles**: Show/hide warnings, recommended, completed courses
- **Completion tracking**: Toggle course completion within sections

### Navigation
- **Course clicks**: Navigate to individual course prerequisite graphs
- **Cross-references**: Click on prerequisites to explore their requirements
- **Major overview**: Return to major view from individual course graphs

## Technical Challenges

### Layout Complexity
- **Section boundaries**: Maintaining clean section divisions while allowing cross-section arrows
- **Dynamic sizing**: Sections that resize based on content and completion state
- **Nested groups**: Rendering deeply nested group structures within sections

### Graph Rendering
- **Cross-section edges**: Drawing arrows between courses in different sections
- **Auto-added prerequisites**: Integrating missing prerequisites seamlessly
- **Performance**: Handling large majors with many requirements efficiently

## Future Enhancements

### Advanced Features
- **Quarter planning**: Drag courses to quarters for scheduling
- **Prerequisite paths**: Highlight optimal course sequences
- **What-if analysis**: Show impact of different course selections
- **Export functionality**: Save major progress and plans

### Responsive Design
- **Mobile optimization**: Vertical section layout for small screens
- **Touch interactions**: Mobile-friendly graph manipulation
- **Progressive disclosure**: Hide complexity on smaller screens

## Implementation Priority

### Phase 1: Core Functionality
1. Basic sectioned layout with horizontal sections
2. Course and group rendering within sections
3. Cross-section prerequisite arrows
4. Completion tracking integration
5. Graph/list view toggle

### Phase 2: Enhanced Features
1. Missing prerequisite auto-addition
2. Section progress indicators
3. Advanced completion analytics
4. Mobile responsive design

### Phase 3: Advanced Features
1. Quarter planning integration
2. Prerequisite path optimization
3. Export/import functionality
4. Performance optimizations for large majors
