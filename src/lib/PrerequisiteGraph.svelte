<script lang="ts">
  import { onMount } from 'svelte'; // Used for rendering after component is mounted
  import cytoscape from 'cytoscape'; // Main Cytoscape library
  import dagre from 'cytoscape-dagre'; // Layout for directed graphs
  import type { Course, CourseRequirement, RequisiteGroup, EnforcedCourseRequisite } from './types.js'; // Types needed for course data
  import { loadCourses } from './services/loadCourses.js'; // Service to load courses from JSON
  import { buildPrerequisiteGraph, createCytoscapeInstance, handlePrerequisiteClick, type GraphNode, type GraphEdge } from './services/prerequisiteGraph.js'; // Service to build graph data
  import type { TooltipConfig, TooltipManager } from './services/tooltipService.js'; // Tooltip configuration type

  export let courseId: string; // Course ID to visualize prerequisites for
  export let enableTooltips: boolean = true; // Whether to enable Tailwind-styled tooltips
  export let graphWidthPercent: number = 60; // Percentage of width the graph should take (60% = 60/40 split)

  // Internal state for controlling what prerequisites are shown (instead of URL params)
  let showWarnings: boolean = true; // Whether to show warning-level prerequisites
  let showRecommended: boolean = true; // Whether to show recommended prerequisites

  // Enforce prerequisite hierarchy: Enforced → Warning → Recommended
  // Handle the dependency in a single reactive statement to avoid conflicts
  $: {
    // If warnings are turned off, also turn off recommended
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
  onMount(() => {
    (async () => {
      await initializeCourseData();
      initializeGraph();
    })();
    
    // Add click outside listener for search dropdown
    document.addEventListener('click', handleClickOutside);
    
    // Cleanup function
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
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

  // Wrapper function for handlePrerequisiteClick from the service
  function onPrerequisiteClick(courseId: string, requisiteLevel?: string, requisiteType?: string) {
    handlePrerequisiteClick(
      courseId,
      requisiteLevel,
      requisiteType,
      cy,
      courseMap,
      showWarnings,
      showRecommended,
      (value) => showWarnings = value,
      (value) => showRecommended = value,
      (course) => selectedCourse = course,
      (value) => isTransitioning = value
    );
  }

  // Legend collapse state
  let isLegendExpanded = true;
  
  // Course search state
  let isSearchExpanded = false;
  let searchQuery = '';
  let searchResults: Course[] = [];
  let searchContainer: HTMLDivElement;
  
  // Calculate Levenshtein distance between two strings
  function levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }
  
  // Calculate similarity score for fuzzy matching
  function calculateSimilarity(query: string, course: Course): number {
    const lowerQuery = query.toLowerCase();
    const courseId = course.id.toLowerCase();
    const courseTitle = course.title.toLowerCase();
    
    // Exact matches get highest score
    if (courseId === lowerQuery || courseTitle === lowerQuery) return 1000;
    
    // Substring matches get high scores
    if (courseId.includes(lowerQuery)) return 800;
    if (courseTitle.includes(lowerQuery)) return 700;
    
    // Word-based matching for titles
    const titleWords = courseTitle.split(/\s+/);
    const queryWords = lowerQuery.split(/\s+/);
    
    let wordMatchScore = 0;
    for (const queryWord of queryWords) {
      for (const titleWord of titleWords) {
        if (titleWord.startsWith(queryWord)) {
          wordMatchScore += 300;
        } else if (titleWord.includes(queryWord)) {
          wordMatchScore += 200;
        }
      }
    }
    
    if (wordMatchScore > 0) return wordMatchScore;
    
    // Levenshtein distance for fuzzy matching
    const maxLen = Math.max(lowerQuery.length, courseId.length, courseTitle.length);
    const idDistance = levenshteinDistance(lowerQuery, courseId);
    const titleDistance = levenshteinDistance(lowerQuery, courseTitle);
    
    const idSimilarity = Math.max(0, (maxLen - idDistance) / maxLen) * 100;
    const titleSimilarity = Math.max(0, (maxLen - titleDistance) / maxLen) * 100;
    
    return Math.max(idSimilarity, titleSimilarity);
  }
  
  // Filter courses based on search query with fuzzy matching
  $: if (searchQuery.trim() && courses.length > 0) {
    const query = searchQuery.toLowerCase().trim();
    
    // First, get exact and substring matches
    const exactMatches = courses.filter(course => 
      course.id.toLowerCase().includes(query) || 
      course.title.toLowerCase().includes(query)
    );
    
    // If we have fewer than 5 exact matches, add fuzzy matches
    if (exactMatches.length < 5) {
      // Get all courses with similarity scores
      const scoredCourses = courses
        .filter(course => !exactMatches.some(exact => exact.id === course.id)) // Exclude already matched
        .map(course => ({
          course,
          similarity: calculateSimilarity(query, course)
        }))
        .filter(item => item.similarity > 20) // Only include reasonable matches
        .sort((a, b) => b.similarity - a.similarity) // Sort by similarity descending
        .slice(0, 10 - exactMatches.length) // Fill up to 10 total results
        .map(item => item.course);
      
      searchResults = [...exactMatches, ...scoredCourses].slice(0, 10);
    } else {
      searchResults = exactMatches.slice(0, 10);
    }
  } else {
    searchResults = [];
  }
  
  // Function to navigate to a selected course
  function selectCourse(selectedCourseId: string) {
    // Remove spaces from course ID for URL compatibility
    const urlSafeCourseId = selectedCourseId.replace(/\s+/g, '');
    // Navigate to the new course page
    window.location.href = `/courses/${urlSafeCourseId}`;
  }
  
  // Close search dropdown when clicking outside
  function handleClickOutside(event: MouseEvent) {
    if (searchContainer && !searchContainer.contains(event.target as Node)) {
      isSearchExpanded = false;
      searchQuery = '';
    }
  }
</script>

<!-- PrerequisiteGraph.svelte -->
<!-- This component visualizes course prerequisites using Cytoscape.js -->
<div class="w-full max-w-7xl mx-auto p-5">
  <!-- Title with course search -->
  <div class="mb-5 relative" bind:this={searchContainer}>
    <div class="flex items-center gap-3">
      <h2 class="text-2xl font-semibold text-gray-800">{title} for</h2>
      
      <!-- Collapsible course selector -->
      <div class="relative">
        <button 
          class="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 hover:bg-blue-200 transition-colors rounded-lg border border-blue-300"
          on:click={() => isSearchExpanded = !isSearchExpanded}
          type="button"
        >
          <span class="text-xl font-semibold text-blue-900">{courseId}</span>
          <svg 
            class="w-4 h-4 transform transition-transform duration-200 {isSearchExpanded ? 'rotate-180' : ''}"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        
        <!-- Search dropdown -->
        {#if isSearchExpanded}
          <div class="absolute top-full left-0 mt-2 w-96 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
            <div class="p-3">
              <input
                type="text"
                placeholder="Search for courses..."
                bind:value={searchQuery}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autocomplete="off"
              />
            </div>
            
            {#if searchResults.length > 0}
              <div class="max-h-60 overflow-y-auto border-t border-gray-200">
                {#each searchResults as course}
                  <button
                    class="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                    on:click={() => selectCourse(course.id)}
                    type="button"
                  >
                    <div class="font-medium text-gray-900">{course.id}</div>
                    <div class="text-sm text-gray-600 truncate">{course.title}</div>
                  </button>
                {/each}
              </div>
            {:else if searchQuery.trim()}
              <div class="px-3 py-4 text-gray-500 text-center border-t border-gray-200">
                No courses found matching "{searchQuery}"
              </div>
            {:else}
              <div class="px-3 py-4 text-gray-500 text-center border-t border-gray-200">
                Start typing to search for courses...
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
  
  <!-- Main layout container -->
  <div bind:this={resizeContainer} class="flex h-[80vh] relative">
    <!-- Graph section -->
    <div 
      class="border border-gray-300 rounded-l-lg shadow-md bg-gray-50 flex-shrink-0 relative"
      style={graphWidthStyle}
    >
      <div 
        bind:this={container} 
        class="w-full h-full"
      >
      </div>
      
      <!-- Legend -->
      <div class="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg text-xs max-w-xs overflow-hidden">
        <!-- Collapsible Header -->
        <button 
          class="w-full bg-blue-100 hover:bg-blue-200 transition-colors px-3 py-2 text-left flex items-center justify-between"
          on:click={() => isLegendExpanded = !isLegendExpanded}
          type="button"
        >
          <h4 class="font-semibold text-gray-800 text-sm">Legend</h4>
          <svg 
            class="w-4 h-4 transform transition-transform duration-200 {isLegendExpanded ? 'rotate-180' : ''}"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        
        <!-- Collapsible Content -->
        {#if isLegendExpanded}
          <div class="p-3">
            <!-- Node types -->
            <div class="mb-3">
              <div class="font-medium text-gray-700 mb-1">Shapes:</div>
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <div class="w-4 h-4 bg-white border border-gray-400 rounded flex-shrink-0"></div>
                  <span class="text-gray-600">Courses</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-4 h-4 bg-gray-100 border-2 border-gray-400 transform rotate-45 flex-shrink-0"></div>
                  <span class="text-gray-600">Course options</span>
                </div>
              </div>
            </div>
            
            <!-- Edge types -->
            <div>
              <div class="font-medium text-gray-700 mb-1">Prerequisite levels:</div>
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-0.5 bg-red-500 flex-shrink-0 relative">
                    <div class="absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-2 border-l-red-500 border-t border-b border-transparent"></div>
                  </div>
                  <span class="text-gray-600">Enforced</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-6 h-0.5 bg-orange-500 flex-shrink-0 relative">
                    <div class="absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-2 border-l-orange-500 border-t border-b border-transparent"></div>
                  </div>
                  <span class="text-gray-600">Warning</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-6 h-0.5 border-t border-dashed border-orange-500 flex-shrink-0 relative">
                    <div class="absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-2 border-l-orange-500 border-t border-b border-transparent"></div>
                  </div>
                  <span class="text-gray-600">Recommended</span>
                </div>
              </div>
            </div>
            
            <!-- Additional info -->
            <div class="mt-2 pt-2 border-t border-gray-200">
              <div class="text-gray-500 text-xs mb-3">
                Hover for details • Click to select
              </div>
              
              <!-- Toggle controls -->
              <div class="space-y-2">
                <div class="text-xs font-medium text-gray-700 mb-1">Show/Hide:</div>
                <div class="flex items-center justify-between">
                  <span class="text-xs text-gray-600">Warning prerequisites</span>
                  <button
                    class="relative inline-flex h-4 w-7 items-center rounded-full {showWarnings ? 'bg-orange-500' : 'bg-gray-300'} transition-colors"
                    on:click={() => showWarnings = !showWarnings}
                    type="button"
                    aria-label="Toggle warning prerequisites"
                  >
                    <span class="inline-block h-3 w-3 transform rounded-full bg-white transition-transform {showWarnings ? 'translate-x-3.5' : 'translate-x-0.5'}"></span>
                  </button>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-xs text-gray-600">Recommended prerequisites</span>
                  <button
                    class="relative inline-flex h-4 w-7 items-center rounded-full {showRecommended && showWarnings ? 'bg-orange-500' : 'bg-gray-300'} transition-colors"
                    on:click={() => {
                      if (showWarnings) {
                        showRecommended = !showRecommended;
                      } else if (!showRecommended) {
                        // If warnings are off and we're trying to enable recommended, enable both
                        showWarnings = true;
                        showRecommended = true;
                      }
                    }}
                    type="button"
                    aria-label="Toggle recommended prerequisites"
                  >
                    <span class="inline-block h-3 w-3 transform rounded-full bg-white transition-transform {showRecommended && showWarnings ? 'translate-x-3.5' : 'translate-x-0.5'}"></span>
                  </button>
                </div>
              </div>
              <div class="text-xs text-gray-500 mt-1">
                Enforced prerequisites always shown
              </div>
            </div>
          </div>
        {/if}
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
                              <button 
                                class="text-gray-800 hover:text-blue-600 hover:bg-blue-50 px-1 py-0.5 rounded transition-colors duration-200 font-medium"
                                on:click={() => onPrerequisiteClick(option.course, option.level, option.type)}
                                type="button"
                              >
                                {option.course}
                              </button>{formatMinGrade(option.minGrade)}
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
                        <button 
                          class="text-gray-800 hover:text-blue-600 hover:bg-blue-50 px-1 py-0.5 rounded transition-colors duration-200 font-medium"
                          on:click={() => onPrerequisiteClick(requisite.course, requisite.level, requisite.type)}
                          type="button"
                        >
                          {requisite.course}
                        </button>{formatMinGrade(requisite.minGrade)}
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


