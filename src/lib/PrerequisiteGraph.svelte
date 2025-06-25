<script lang="ts">
  import { onMount } from 'svelte'; // Used for rendering after component is mounted
  import cytoscape from 'cytoscape'; // Main Cytoscape library
  import dagre from 'cytoscape-dagre'; // Layout for directed graphs
  import type { Course, CourseRequirement, RequisiteGroup, EnforcedCourseRequisite } from './types.js'; // Types needed for course data
  import { loadCourses } from './services/loadCourses.js'; // Service to load courses from JSON
  import { buildPrerequisiteGraph, createCytoscapeInstance, type GraphNode, type GraphEdge } from './services/prerequisiteGraph.js'; // Service to build graph data

  export let courseId: string; // Course ID to visualize prerequisites for
  export let showWarnings: boolean = true; // Whether to show warning-level prerequisites
  export let showRecommended: boolean = true; // Whether to show recommended prerequisites

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

  // Map to quickly look up courses by ID
  // This is used to avoid repeated lookups in the courses array
  let courseMap: Map<string, Course> = new Map();

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
    cy = createCytoscapeInstance(container, nodes, edges);
    
    setupComponentEventHandlers();
  }

  // Setup component-specific event handlers that interact with Svelte state
  function setupComponentEventHandlers() {
    if (!cy) return;
    
    // Add hover tooltips
    // For right now, a hover simply changes the background color of the course node and logs the course title and units
    cy.on('mouseover', 'node[type="course"]', (event) => {
      const node = event.target;
      const course = node.data('course');
      if (course) {
        node.style('background-color', '#f0f8ff');
        // TODO: Add proper tooltip implementation
        // See graph-spec.md for more details
        console.log(`${course.title} - ${course.units} units`);
      }
    });

    // When the mouse leaves the node, reset the background color to white
    // This is a simple hover effect to indicate the course being hovered over
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
  $: if (cy && courses.length > 0 && (showWarnings !== undefined || showRecommended !== undefined)) {
    initializeGraph();
  }
</script>

<!-- PrerequisiteGraph.svelte -->
<!-- This component visualizes course prerequisites using Cytoscape.js -->
<div class="prerequisite-graph-container">
  <h2>{title} for {courseId}</h2>
  <div 
    bind:this={container} 
    class="graph-container"
    style="width: 100%; height: 600px; border: 1px solid #ccc; background: #fafafa;"
  > <!-- TODO: implement Tailwind styling-->
  </div>
</div>

<style>
  .prerequisite-graph-container {
    width: 90%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }

  .graph-container {
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  h2 {
    margin-bottom: 20px;
    font-size: 1.5rem;
    font-weight: 600;
    color: #333;
  }
</style>
