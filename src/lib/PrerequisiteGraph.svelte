<script lang="ts">
  import { onMount } from 'svelte';
  import cytoscape from 'cytoscape';
  import dagre from 'cytoscape-dagre';
  import type { Course } from './types.js';
  import type { GraphNode, GraphEdge } from './services/graph/types.js';
  import { loadCourses } from './services/data/loadCourses.js';
  import { buildPrerequisiteGraph, handlePrerequisiteClick } from './services/graph/index.js';
  import { completedCoursesStore, schedulingService, initializeSchedulingService } from './services/shared/schedulingService.js';
  import { loadLegendState } from './services/shared/legendStateService.js';
  
  // Import components
  import CourseSearchHeader from './components/shared/CourseSearchHeader.svelte';
  import GraphContainer from './components/graph/GraphContainer.svelte';
  import ResizeHandle from './components/shared/ResizeHandle.svelte';
  import CourseDetails from './components/course/CourseDetails.svelte';

  export let courseId: string;
  export let enableTooltips: boolean = true;
  export let graphWidthPercent: number = 60;

  // Internal state for controlling what prerequisites are shown - initialize from localStorage
  const savedLegendState = loadLegendState();
  let showWarnings: boolean = savedLegendState.showWarnings;
  let showRecommended: boolean = savedLegendState.showRecommended;
  let showCompletedCourses: boolean = savedLegendState.showCompletedCourses;

  // Course completion state - use the store directly
  $: userCompletedCourses = $completedCoursesStore;

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
  
  // Track previous state to determine update type
  let previousState = {
    showWarnings: showWarnings,
    showRecommended: showRecommended,
    showCompletedCourses: showCompletedCourses,
    userCompletedCourses: new Set<string>(),
    courseId: courseId
  };

  // Graph container reference to access Cytoscape instance
  let graphContainer: GraphContainer;

  // Track current graph data
  let currentNodes: GraphNode[] = [];
  let currentEdges: GraphEdge[] = [];

  // Computed course for details panel (selected course or main course)
  $: displayedCourse = selectedCourse || courseMap.get(courseId) || null;

  // Register dagre layout
  // @ts-ignore
  cytoscape.use(dagre);

  async function initializeCourseData() {
    try {
      ({ courses, courseMap } = await loadCourses());
    } catch (error) {
      console.error('Component failed to initialize course data');
      courses = [];
      courseMap = new Map();
    }
    
    initializeSchedulingService();
    
    // Load legend state from localStorage
    const savedState = loadLegendState();
    showWarnings = savedState.showWarnings;
    showRecommended = savedState.showRecommended;
    showCompletedCourses = savedState.showCompletedCourses;
  }

  // Smart graph update system - only rebuild when necessary
  $: {
    if (courses.length > 0) {
      const newState = {
        showWarnings,
        showRecommended,
        showCompletedCourses,
        userCompletedCourses: new Set($completedCoursesStore),
        courseId
      };

      // Check if this is just a toggle change vs a more significant change
      const isToggleOnlyChange = newState.courseId === previousState.courseId && 
        courses.length > 0 && currentNodes.length > 0;

      if (isToggleOnlyChange) {
        // Generate new graph data
        const { nodes: newNodes, edges: newEdges } = buildPrerequisiteGraph(courseId, courses, courseMap, { 
          showWarnings, 
          showRecommended,
          userCompletedCourses: $completedCoursesStore,
          showCompletedCourses
        });

        // Update incrementally if possible
        if (graphContainer && canUpdateIncrementally(newNodes, newEdges)) {
          graphContainer.updateGraphIncrementally(newNodes, newEdges);
          currentNodes = newNodes;
          currentEdges = newEdges;
        } else {
          // Fall back to full rebuild
          currentNodes = newNodes;
          currentEdges = newEdges;
        }
      } else {
        // Full rebuild for course changes or first load
        const { nodes: newNodes, edges: newEdges } = buildPrerequisiteGraph(courseId, courses, courseMap, { 
          showWarnings, 
          showRecommended,
          userCompletedCourses: $completedCoursesStore,
          showCompletedCourses
        });
        currentNodes = newNodes;
        currentEdges = newEdges;
      }

      previousState = newState;
    } else {
      currentNodes = [];
      currentEdges = [];
    }
  }

  // Helper function to determine if incremental update is possible
  function canUpdateIncrementally(newNodes: GraphNode[], newEdges: GraphEdge[]): boolean {
    // Only allow incremental updates for toggle-only changes
    const currentNodeIds = new Set(currentNodes.map(n => n.data.id));
    const newNodeIds = new Set(newNodes.map(n => n.data.id));
    
    // Check if the core structure is similar (same main nodes)
    const coreNodesSame = currentNodeIds.size > 0 && 
      Array.from(currentNodeIds).filter(id => newNodeIds.has(id)).length >= currentNodeIds.size * 0.7;
    
    return coreNodesSame;
  }

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
    schedulingService.toggleCourseCompletion(courseId);
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
      $completedCoursesStore,
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
      nodes={currentNodes}
      edges={currentEdges}
      {enableTooltips}
      {graphWidthPercent}
      bind:showWarnings
      bind:showRecommended
      bind:showCompletedCourses
      userCompletedCourses={$completedCoursesStore}
      onCourseSelect={handleCourseSelect}
      onBackgroundClick={handleBackgroundClick}
      animationConfig={{
        enabled: true,
        duration: 600,
        easing: 'ease-out',
        preserveCompletedPositions: true
      }}
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
        userCompletedCourses={$completedCoursesStore}
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


