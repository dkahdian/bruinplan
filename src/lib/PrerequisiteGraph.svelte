<script lang="ts">
  import { onMount } from 'svelte'; // Used for rendering after component is mounted
  import cytoscape from 'cytoscape'; // Main Cytoscape library
  import dagre from 'cytoscape-dagre'; // Layout for directed graphs
  import type { Course, CourseList, CourseRequirement, RequisiteGroup, EnforcedCourseRequisite } from './types.js'; // Types needed for course data

  export let courseId: string; // Course ID to visualize prerequisites for

  let container: HTMLDivElement; // Container for the Cytoscape graph
  let cy: cytoscape.Core; // Cytoscape instance, needed for rendering the graph
  let courses: Course[] = []; // Array to hold all courses loaded from JSON

  // Map to quickly look up courses by ID
  // This is used to avoid repeated lookups in the courses array
  let courseMap: Map<string, Course> = new Map();

  // Register dagre layout
  cytoscape.use(dagre);

  // Define interfaces for the graph nodes and edges
  // These interfaces help structure the data used in the Cytoscape graph
  interface GraphNode {
    data: {
      id: string;
      label: string;
      type: 'course' | 'group';
      // Type of node: either a course or a group
      // If type is 'course', we can also include the course data
      course?: Course;
    };
  }

  interface GraphEdge {
    // Represents a prerequisite edge between two courses or a course and a group
    // TODO: Add support for different edge types in the future (i.e. warning prerequisites, recommended courses)
    data: {
      id: string;
      source: string;
      target: string;
      type: 'enforced';
    };
  }

  async function loadCourses() {
    // Load course data from the JSON file
    // This function fetches the course data and populates the courses array
    // TODO: move this to a separate service file in the future
    try {
      const response = await fetch('/courses/Mathematics.json');
      // Get a list of courses from the JSON file
      const data: CourseList = await response.json();
      // Parse JSON data
      courses = data.courses.filter(course => course.id);
      // Filter out incomplete courses; should do nothing if all courses are complete
      
      // Build course lookup map
      courseMap.clear();
      // Clear the courseMap before populating it
      // This ensures we don't have stale data from previous loads
      courses.forEach(course => {
        courseMap.set(course.id, course);
      });
      // Add each course to the map for quick lookup by ID
      
      // console.log(`Loaded ${courses.length} courses`); //
      // console.log(`Looking for course: "${courseId}"`);
      // console.log(`Course found:`, courseMap.has(courseId));
      // Log the number of courses loaded and check if the target course exists
      // Used for testing only
    } catch (error) {
      console.error('Failed to load courses:', error);
    }
  }

  function buildPrerequisiteGraph(targetCourseId: string): { nodes: GraphNode[], edges: GraphEdge[] } {
    // Given course data and a target course ID, build the prerequisite graph
    // This function constructs the nodes and edges needed for the Cytoscape graph
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    // Empty arrays to hold the graph nodes and edges
    const visitedCourses = new Set<string>();
    // Holds IDs of courses that have already been processed
    // This prevents infinite loops in case of circular prerequisites
    
    const visitedGroups = new Set<string>();
    // Holds IDs of prerequisite groups that have already been processed
    // This prevents processing the same group multiple times

    let groupCounter = 0;
    // Counter to generate unique IDs for prerequisite groups


    // Function to add a course and its prerequisites to the graph
    // This function recursively processes the course and its prerequisites
    function addCourse(courseId: string): void {
      // Check if the course has already been visited to avoid cycles
      if (visitedCourses.has(courseId)) return; // Skip if already processed
      
      // Get the course from the map
      const course = courseMap.get(courseId);
      if (!course) return; // Skip missing courses
      // TODO: Handle missing courses gracefully in the future
      
      visitedCourses.add(courseId);
      // Mark the course as visited to prevent reprocessing
      
      // Add course node
      nodes.push({
        data: {
          id: courseId,
          label: courseId,
          type: 'course',
          course: course
        }
      });

      // Process prerequisites
      course.requisites.forEach(req => {
        processRequirement(req, courseId);
      });
    }

    // Function to process a course requirement
    // This function handles both individual course requisites and groups of requisites
    function processRequirement(requirement: CourseRequirement, parentCourseId: string): void {
      // If the requirement is a group, process it separately
      if (requirement.type === 'Group') {
        processGroup(requirement, parentCourseId);
      } else if (requirement.type === 'Requisite' && requirement.level === 'Enforced') {

        // Only process enforced prerequisites
        // TODO: Add support for warning prerequisites and recommended courses in the future

        // Get course from map
        const prereqCourse = courseMap.get(requirement.course);
        // If the prerequisite course exists in our course map, add it to the graph
        if (prereqCourse) {
          addCourse(requirement.course);
          // Add edge from prerequisite course to parent course
          edges.push({
            data: {
              id: `${requirement.course}-${parentCourseId}`, // Unique ID for the edge: only one edge possible per course pair
              source: requirement.course, // Source course ID: the prerequisite course
              target: parentCourseId, // Target course ID: the course that requires this prerequisite
              type: 'enforced' // TODO: Add support for different edge types in the future, for now we only have enforced prerequisites, so this is hardcoded
            }
          });
        }
      }
      // Ignore warning prerequisites and missing courses
    }

    function processGroup(group: RequisiteGroup, parentCourseId: string): void { // Process a group of requisites
      const groupId = `group-${groupCounter++}`; // Generate a unique ID for the group (i.e. group-0, group-1, etc.)

      if (visitedGroups.has(groupId)){
        console.error("Group has already been processed:", groupId); // Skip if group has already been processed (should not happen since we have a unique ID for each group)
        return;
      }
        // Prevent processing the same group multiple times to avoid infinite loops
      visitedGroups.add(groupId);

      // Check if group has any enforced options that exist in our database
      const hasValidOptions = group.options.some(option => 
        option.type === 'Requisite' && 
        option.level === 'Enforced' && 
        courseMap.has(option.course)
      );

      // Only show group if it has valid enforced options
      if (!hasValidOptions) return;

      // Add group node
      nodes.push({
        data: {
          id: groupId,
          label: `needs ${group.needs}`,
          type: 'group'
        }
      });

      // Connect parent course to group
      edges.push({
        data: {
          id: `${groupId}-${parentCourseId}`,
          source: groupId,
          target: parentCourseId,
          type: 'enforced'
        }
      });

      // Process group options (only enforced ones)
      group.options.forEach(option => {
        if (option.type === 'Requisite' && option.level === 'Enforced') {
          const optionCourse = courseMap.get(option.course);
          if (optionCourse) {
            addCourse(option.course);
            edges.push({
              data: {
                id: `${option.course}-${groupId}`,
                source: option.course,
                target: groupId,
                type: 'enforced'
              }
            });
          }
        }
      });
    }

    // Start building from the target course
    // This process will recursively add all prerequisites and groups
    addCourse(targetCourseId);
    
    // Pass nodes and edges to Cytoscape
    return { nodes, edges };
  }

  // Function to initialize the Cytoscape graph
  // This function sets up the graph container and applies styles and layout
  // TODO: move to a separate service file in the future
  // This function is called after the component mounts and whenever the courseId changes
  // It builds the prerequisite graph and initializes the Cytoscape instance
  function initializeGraph() {
    if (!container || courses.length === 0) return;

    const { nodes, edges } = buildPrerequisiteGraph(courseId);
    
    console.log(`Built graph with ${nodes.length} nodes and ${edges.length} edges`);
    
    cy = cytoscape({
      container,
      elements: [...nodes, ...edges],
      style: [
        {
          selector: 'node[type="course"]',
          style: {
            'shape': 'round-rectangle',
            'background-color': 'white',
            'border-color': 'black',
            'border-width': 2,
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'width': 80,
            'height': 40,
            'font-size': '12px'
          }
        },
        {
          selector: 'node[type="group"]',
          style: {
            'shape': 'diamond',
            'background-color': 'lightblue',
            'border-color': 'blue',
            'border-width': 2,
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'width': 60,
            'height': 60,
            'font-size': '10px'
          }
        },
        {
          selector: 'edge[type="enforced"]',
          style: {
            'line-color': 'blue',
            'target-arrow-color': 'blue',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'arrow-scale': 1.2
          }
        }
      ],
      layout: {
        name: 'dagre',
      }
    });

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
    await loadCourses();
    initializeGraph();
  });

  // Reinitialize when courseId changes
  $: if (courseId && courses.length > 0) {
    initializeGraph();
  }
</script>

<!-- PrerequisiteGraph.svelte -->
<!-- This component visualizes course prerequisites using Cytoscape.js -->
<div class="prerequisite-graph-container">
  <h2>Prerequisites for {courseId}</h2>
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
