<script lang="ts">
  import { onMount } from 'svelte';
  import cytoscape from 'cytoscape';
  import dagre from 'cytoscape-dagre';
  import type { Course } from './types.js';
  import { loadCourses } from './services/data/loadCourses.js';
  import { buildPrerequisiteGraph, handlePrerequisiteClick } from './services/graph/index.js';
  import { completedCourses, loadCompletedCourses, toggleCourseCompletion } from './services/shared/completionService.js';
  
  // Import components
  import CourseSearchHeader from './components/shared/CourseSearchHeader.svelte';
  import GraphContainer from './components/graph/GraphContainer.svelte';
  import ResizeHandle from './components/shared/ResizeHandle.svelte';
  import CourseDetails from './components/course/CourseDetails.svelte';

  export let courseId: string;
  export let enableTooltips: boolean = true;
  export let graphWidthPercent: number = 60;

  // Internal state for controlling what prerequisites are shown
  let showWarnings: boolean = true;
  let showRecommended: boolean = true;
  let showCompletedCourses: boolean = true;

  // Course completion state - use the store directly
  $: userCompletedCourses = $completedCourses;

  // Enforce prerequisite hierarchy: Enforced → Warning → Recommended
  $: {
    if (!showWarnings && showRecommended) {
      showRecommended = false;
    }
  }

  // Compute title based on what prerequisites are being shown
  $: title = (() => {
    if (showWarnings && showRecommended) return "All prerequisites";
    if (!showWarnings && !showRecommended) return "Enforced prerequisites";
    if (showWarnings && !showRecommended) return "Required prerequisites";
    if (!showWarnings && showRecommended) return "Enforced and recommended prerequisites";
    return "Prerequisites";
  })();

  let courses: Course[] = [];
  let courseMap: Map<string, Course> = new Map();

  // Course details panel state
  let selectedCourse: Course | null = null;
  let isTransitioning = false;

  // Graph container reference to access Cytoscape instance
  let graphContainer: GraphContainer;

  // Computed course for details panel (selected course or main course)
  $: displayedCourse = selectedCourse || courseMap.get(courseId) || null;

  // Register dagre layout
  cytoscape.use(dagre);

  async function initializeCourseData() {
    try {
      ({ courses, courseMap } = await loadCourses());
    } catch (error) {
      console.error('Component failed to initialize course data');
      courses = [];
      courseMap = new Map();
    }
    
    loadCompletedCourses();
  }

  // Generate graph data
  $: ({ nodes, edges } = courses.length > 0 ? buildPrerequisiteGraph(courseId, courses, courseMap, { 
    showWarnings, 
    showRecommended,
    userCompletedCourses,
    showCompletedCourses
  }) : { nodes: [], edges: [] });

  // Handle course selection from graph
  function handleCourseSelect(course: Course) {
    isTransitioning = true;
    setTimeout(() => {
      if (selectedCourse && selectedCourse.id === course.id) {
        selectedCourse = null; // Deselect if same course
      } else {
        selectedCourse = course; // Select new course
      }
      isTransitioning = false;
    }, 150);
  }

  // Handle background click to reset to main course
  function handleBackgroundClick() {
    isTransitioning = true;
    setTimeout(() => {
      selectedCourse = null;
      isTransitioning = false;
    }, 150);
  }

  // Handle course completion toggle
  function handleCourseCompletionToggle(courseId: string) {
    toggleCourseCompletion(courseId);
  }

  // Handle prerequisite click from sidebar
  function onPrerequisiteClick(courseId: string, requisiteLevel?: string, requisiteType?: string) {
    const cy = graphContainer?.getCytoscapeInstance();
    handlePrerequisiteClick(
      courseId,
      requisiteLevel,
      requisiteType,
      cy, // Now passing the actual Cytoscape instance
      courseMap,
      showWarnings,
      showRecommended,
      showCompletedCourses,
      $completedCourses,
      (value: boolean) => showWarnings = value,
      (value: boolean) => showRecommended = value,
      (value: boolean) => showCompletedCourses = value,
      (course: Course | null) => selectedCourse = course,
      (value: boolean) => isTransitioning = value
    );
  }

  // Handle resize
  function handleResize(event: CustomEvent<{ newWidthPercent: number }>) {
    graphWidthPercent = event.detail.newWidthPercent;
  }

  let resizeContainer: HTMLDivElement;

  onMount(() => {
    (async () => {
      await initializeCourseData();
    })();
  });
</script>

<!-- PrerequisiteGraph.svelte -->
<div class="w-full max-w-7xl mx-auto p-5">
  <!-- Title with course search -->
  <CourseSearchHeader 
    {courseId} 
    {title} 
    {courses} 
  />
  
  <!-- Main layout container -->
  <div bind:this={resizeContainer} class="flex h-[80vh] relative">
    <!-- Graph section -->
    <GraphContainer 
      bind:this={graphContainer}
      {nodes}
      {edges}
      {enableTooltips}
      {graphWidthPercent}
      bind:showWarnings
      bind:showRecommended
      bind:showCompletedCourses
      userCompletedCourses={$completedCourses}
      onCourseSelect={handleCourseSelect}
      onBackgroundClick={handleBackgroundClick}
    />
    
    <!-- Resize bar -->
    <ResizeHandle 
      {resizeContainer}
      on:resize={handleResize}
    />
    
    <!-- Sidebar section -->
    <div class="border border-l-0 border-gray-300 rounded-r-lg shadow-md bg-white overflow-hidden flex-1">
      <CourseDetails 
        {displayedCourse}
        {selectedCourse}
        {isTransitioning}
        {courseMap}
        userCompletedCourses={$completedCourses}
        onCourseCompletionToggle={handleCourseCompletionToggle}
        {onPrerequisiteClick}
      />
    </div>
  </div>
</div>

<style>
  /* Prevent text selection during resize */
  :global(body.resizing) {
    user-select: none;
  }
</style>


