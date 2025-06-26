<script lang="ts">
  import { onMount } from 'svelte'; // Used for rendering after component is mounted
  import cytoscape from 'cytoscape'; // Main Cytoscape library
  import dagre from 'cytoscape-dagre'; // Layout for directed graphs
  import type { Course, CourseRequirement, RequisiteGroup, EnforcedCourseRequisite } from './types.js'; // Types needed for course data
  import { loadCourses } from './services/loadCourses.js'; // Service to load courses from JSON
  import { buildPrerequisiteGraph, createCytoscapeInstance, type GraphNode, type GraphEdge } from './services/prerequisiteGraph.js'; // Service to build graph data
  import type { TooltipConfig, TooltipManager } from './services/tooltipService.js'; // Tooltip configuration type

  export let courseId: string; // Course ID to visualize prerequisites for
  export let showWarnings: boolean = true; // Whether to show warning-level prerequisites
  export let showRecommended: boolean = true; // Whether to show recommended prerequisites
  export let enableTooltips: boolean = true; // Whether to enable Tailwind-styled tooltips
  export let graphWidthPercent: number = 60; // Percentage of width the graph should take (60% = 60/40 split)

  // Compute title based on what prerequisites are being shown
  $: title = (() => {
    if (showWarnings && showRecommended) return "All prerequisites";
    if (!showWarnings && !showRecommended) return "Enforced prerequisites";
    if (showWarnings && !showRecommended) return "Required prerequisites";
    if (!showWarnings && showRecommended) return "Enforced and recommended prerequisites";
    return "Prerequisites";
  })();

  let container: HTMLDivElement; // Container for the Cytoscape graph
  let cy: cytoscape.Core; // Cytoscape instance, needed for rendering the graph
  let courses: Course[] = []; // Array to hold all courses loaded from JSON
  let tooltipManager: TooltipManager | undefined; // Tooltip manager instance

  // Map to quickly look up courses by ID
  // This is used to avoid repeated lookups in the courses array
  let courseMap: Map<string, Course> = new Map();

  // Course details panel state
  let selectedCourse: Course | null = null; // Currently selected course for details panel
  let isTransitioning = false; // For smooth transition effects

  // Computed course for details panel (selected course or main course)
  $: displayedCourse = selectedCourse || courseMap.get(courseId) || null;

  // Manage tooltip state based on selection
  $: if (tooltipManager) {
    if (selectedCourse) {
      tooltipManager.disable();
    } else {
      tooltipManager.enable();
    }
  }

  // Register dagre layout
  cytoscape.use(dagre);

  async function initializeCourseData() {
    // Load course data using the service
    try {
      ({ courses, courseMap } = await loadCourses());
      // Load courses and courseMap from the service
    } catch (error) {
      // Error already logged by service, but we need to handle the UI state
      console.error('Component failed to initialize course data');
      // Keep courses and courseMap as empty arrays/maps so the UI doesn't break
      courses = [];
      courseMap = new Map();
    }
  }

  // Function to initialize the Cytoscape graph
  // This function sets up the graph container and applies styles and layout
  // Uses the prerequisiteGraph service for configuration
  // This function is called after the component mounts and whenever the courseId changes
  function initializeGraph() {
    if (!container || courses.length === 0) return;

    const { nodes, edges } = buildPrerequisiteGraph(courseId, courses, courseMap, { 
      showWarnings, 
      showRecommended 
    });

    // Configure tooltips if enabled
    const tooltipConfig: Partial<TooltipConfig> | undefined = enableTooltips ? {
      showOnHover: true,
      showOnClick: false,
      hideDelay: 300,
      maxWidth: 'max-w-sm',
      position: 'top'
    } : undefined;

    const result = createCytoscapeInstance(container, nodes, edges, undefined, undefined, tooltipConfig);
    cy = result.cy;
    tooltipManager = result.tooltipManager;
    
    // Add click event handler for course selection
    setupCourseClickHandler();
    
    // Only setup basic event handlers if tooltips are disabled
    if (!enableTooltips) {
      setupBasicEventHandlers();
    }
  }

  // Setup click handler for course selection
  function setupCourseClickHandler() {
    if (!cy) return;
    
    cy.on('tap', 'node[type="course"]', (event) => {
      const node = event.target;
      const course = node.data('course');
      
      if (course) {
        // Trigger transition effect
        isTransitioning = true;
        
        // Check if this course is already selected (toggle functionality)
        if (selectedCourse && selectedCourse.id === course.id) {
          // Deselect the course
          cy.nodes().removeClass('selected');
          
          setTimeout(() => {
            selectedCourse = null;
            isTransitioning = false;
          }, 150);
        } else {
          // Select the new course
          cy.nodes().removeClass('selected');
          node.addClass('selected');
          
          setTimeout(() => {
            selectedCourse = course;
            isTransitioning = false;
          }, 150);
        }
      }
    });

    // Click on background to reset to main course
    cy.on('tap', (event) => {
      if (event.target === cy) {
        isTransitioning = true;
        cy.nodes().removeClass('selected');
        
        setTimeout(() => {
          selectedCourse = null;
          isTransitioning = false;
        }, 150);
      }
    });
  }

  // Setup basic event handlers for when tooltips are disabled
  // This provides a fallback hover effect
  function setupBasicEventHandlers() {
    if (!cy) return;
    
    // Add basic hover effects
    cy.on('mouseover', 'node[type="course"]', (event) => {
      const node = event.target;
      const course = node.data('course');
      if (course) {
        node.style('background-color', '#f0f8ff');
        console.log(`${course.title} - ${course.units} units`);
      }
    });

    // Reset background color when mouse leaves
    cy.on('mouseout', 'node[type="course"]', (event) => {
      const node = event.target;
      node.style('background-color', 'white');
    });
  }

  // On mount, load courses and initialize the graph
  // This ensures the graph is ready to display when the component is first rendered
  onMount(async () => {
    await initializeCourseData();
    initializeGraph();
  });

  // Reinitialize when courseId or display options change
  $: if (courseId && courses.length > 0) {
    initializeGraph();
  }
  
  // Reinitialize when display options change
  $: if (cy && courses.length > 0 && (showWarnings !== undefined || showRecommended !== undefined || enableTooltips !== undefined)) {
    initializeGraph();
  }

  // Resize functionality
  let isResizing = false;
  let resizeContainer: HTMLDivElement;

  function startResize(event: MouseEvent) {
    isResizing = true;
    document.body.classList.add('resizing');
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
    event.preventDefault();
  }

  function handleResize(event: MouseEvent) {
    if (!isResizing || !resizeContainer) return;
    
    const containerRect = resizeContainer.getBoundingClientRect();
    const newWidthPercent = ((event.clientX - containerRect.left) / containerRect.width) * 100;
    
    // Constrain between 20% and 80%
    graphWidthPercent = Math.max(20, Math.min(80, newWidthPercent));
  }

  function stopResize() {
    isResizing = false;
    document.body.classList.remove('resizing');
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
  }

  // Compute dynamic styles for the layout
  $: graphWidthStyle = `width: ${graphWidthPercent}%`;
  $: sidebarWidthStyle = `width: ${100 - graphWidthPercent}%`;

  // Helper function to format minimum grades for display
  function formatMinGrade(minGrade?: string): string {
    if (!minGrade || minGrade === 'D-') return '';
    return ` (min: ${minGrade})`;
  }
</script>

<!-- PrerequisiteGraph.svelte -->
<!-- This component visualizes course prerequisites using Cytoscape.js -->
<div class="w-full max-w-7xl mx-auto p-5">
  <h2 class="mb-5 text-2xl font-semibold text-gray-800">{title} for {courseId}</h2>
  
  <!-- Main layout container -->
  <div bind:this={resizeContainer} class="flex h-[80vh] relative">
    <!-- Graph section -->
    <div 
      class="border border-gray-300 rounded-l-lg shadow-md bg-gray-50 flex-shrink-0"
      style={graphWidthStyle}
    >
      <div 
        bind:this={container} 
        class="w-full h-full"
      >
      </div>
    </div>
    
    <!-- Resize bar -->
    <button 
      class="w-2 cursor-col-resize flex-shrink-0 border-0 bg-transparent p-0 m-0 outline-none focus:outline-none"
      on:mousedown={startResize}
      aria-label="Resize panels"
      type="button"
    >
    </button>
    
    <!-- Sidebar section -->
    <div 
      class="border border-l-0 border-gray-300 rounded-r-lg shadow-md bg-white overflow-hidden flex-1"
    >
      <div class="h-full relative">
        <!-- Course details content -->
        <div 
          class="absolute inset-0 p-4 transition-opacity duration-300 ease-in-out overflow-y-auto"
          class:opacity-0={isTransitioning}
          class:opacity-100={!isTransitioning}
        >
          {#if displayedCourse}
            <!-- Course header -->
            <div class="mb-6">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-xl font-bold text-gray-900">{displayedCourse.id}</h3>
                {#if selectedCourse}
                  <span class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    Selected
                  </span>
                {:else}
                  <span class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                    Main Course
                  </span>
                {/if}
              </div>
              <p class="text-lg text-gray-700 font-medium">{displayedCourse.title}</p>
              <div class="mt-3">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {displayedCourse.units} {(typeof displayedCourse.units === 'number' && displayedCourse.units === 1) ? 'unit' : 'units'}
                </span>
              </div>
            </div>

            <!-- Course description -->
            {#if displayedCourse.description}
              <div class="mb-6">
                <h4 class="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Description</h4>
                <p class="text-gray-700 leading-relaxed">{displayedCourse.description}</p>
              </div>
            {/if}

            <!-- Prerequisites -->
            {#if displayedCourse.requisites && displayedCourse.requisites.length > 0}
              <div class="mb-6">
                <h4 class="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Prerequisites</h4>
                <ul class="space-y-2">
                  {#each displayedCourse.requisites as requisite}
                    {#if requisite.type === 'Group'}
                      <li class="text-sm">
                        <span class="font-medium text-gray-800">Choose {requisite.needs} from:</span>
                        <ul class="ml-4 mt-1 space-y-1">
                          {#each requisite.options as option}
                            <li class="text-sm">
                              {#if option.type === 'Recommended'}
                                <span class="text-blue-600 font-medium">Recommended:</span>
                              {:else}
                                <span class="text-{option.level === 'Enforced' ? 'red' : 'yellow'}-600 font-medium">{option.level}:</span>
                              {/if}
                              {option.course}{formatMinGrade(option.minGrade)}
                            </li>
                          {/each}
                        </ul>
                      </li>
                    {:else}
                      <li class="text-sm">
                        {#if requisite.type === 'Recommended'}
                          <span class="text-blue-600 font-medium">Recommended:</span>
                        {:else}
                          <span class="text-{requisite.level === 'Enforced' ? 'red' : 'yellow'}-600 font-medium">{requisite.level}:</span>
                        {/if}
                        {requisite.course}{formatMinGrade(requisite.minGrade)}
                      </li>
                    {/if}
                  {/each}
                </ul>
              </div>
            {/if}

            <!-- Equivalent courses -->
            {#if displayedCourse.equivalentCourses && displayedCourse.equivalentCourses.length > 0}
              <div class="mb-6">
                <h4 class="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Equivalent Courses</h4>
                <div class="flex flex-wrap gap-2">
                  {#each displayedCourse.equivalentCourses as equivalent}
                    <span class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                      {equivalent}
                    </span>
                  {/each}
                </div>
              </div>
            {/if}

            <!-- Instructions -->
            <div class="mt-8 pt-4 border-t border-gray-200">
              <p class="text-xs text-gray-500 text-center">
                {#if selectedCourse}
                  Click on another course or the background to change selection
                {:else}
                  Click on any course to view its details
                {/if}
              </p>
            </div>
          {:else}
            <!-- Loading or error state -->
            <div class="text-gray-500 text-center mt-8">
              <p class="text-lg font-medium">Course Details</p>
              <p class="text-sm mt-2">Loading course information...</p>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  /* Prevent text selection during resize */
  :global(body.resizing) {
    user-select: none;
  }
</style>


