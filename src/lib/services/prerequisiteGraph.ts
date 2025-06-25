// Service to handle prerequisite graph data for visualization
// This service takes course data and constructs nodes and edges for Cytoscape.js
// Also handles Cytoscape instance creation and configuration

import cytoscape from 'cytoscape';
import type { Course, CourseRequirement, RequisiteGroup } from '../types.js';

// Define interfaces for the graph nodes and edges
// These interfaces help structure the data used in the Cytoscape graph
export interface GraphNode {
  data: {
    id: string;
    label: string;
    type: 'course' | 'group';
    // Type of node: either a course or a group
    // If type is 'course', we can also include the course data
    course?: Course;
    // For groups, track the color based on prerequisite types
    groupColor?: 'enforced' | 'warning';
  };
}

export interface GraphEdge {
  // Represents a prerequisite edge between two courses or a course and a group
  data: {
    id: string;
    source: string;
    target: string;
    type: 'enforced' | 'warning';
  };
}

// Configuration for what types of prerequisites to show
// TODO: Make this configurable via function parameters in the future
const showWarnings = true;

/**
 * Builds the prerequisite graph for a given target course
 * @param targetCourseId - The course ID to build prerequisites for
 * @param courses - Array of all available courses
 * @param courseMap - Map of course ID to course data for quick lookup
 * @returns Object containing nodes and edges for the graph
 */
export function buildPrerequisiteGraph(
  targetCourseId: string, 
  courses: Course[],
  courseMap: Map<string, Course>
): { nodes: GraphNode[], edges: GraphEdge[] } {
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
    } else if (requirement.type === 'Requisite') {
      
      // Process enforced prerequisites and optionally warning prerequisites
      const shouldProcess = requirement.level === 'Enforced' || (showWarnings && requirement.level === 'Warning');
      
      if (shouldProcess) {
        // Get course from map
        const prereqCourse = courseMap.get(requirement.course);
        // If the prerequisite course exists in our course map, add it to the graph
        if (prereqCourse) {
          addCourse(requirement.course);
          // Add edge from prerequisite course to parent course
          const edgeType = requirement.level === 'Enforced' ? 'enforced' : 'warning';
          edges.push({
            data: {
              id: `${requirement.course}-${parentCourseId}`, // Unique ID for the edge: only one edge possible per course pair
              source: requirement.course, // Source course ID: the prerequisite course
              target: parentCourseId, // Target course ID: the course that requires this prerequisite
              type: edgeType
            }
          });
        }
      }
    }
    // Ignore recommended courses and missing courses
  }

  function processGroup(group: RequisiteGroup, parentCourseId: string): void { // Process a group of requisites
    const groupId = `group-${groupCounter++}`; // Generate a unique ID for the group (i.e. group-0, group-1, etc.)

    if (visitedGroups.has(groupId)){
      console.error("Group has already been processed:", groupId); // Skip if group has already been processed (should not happen since we have a unique ID for each group)
      return;
    }
      // Prevent processing the same group multiple times to avoid infinite loops
    visitedGroups.add(groupId);

    // Check if group has any valid options that exist in our database
    const hasValidOptions = group.options.some(option => 
      option.type === 'Requisite' && 
      (option.level === 'Enforced' || (showWarnings && option.level === 'Warning')) &&
      courseMap.has(option.course)
    );

    // Only show group if it has valid options
    if (!hasValidOptions) return;

    // Determine group color based on prerequisite types
    // If any prerequisite is a warning, the group should be yellow; otherwise red
    let hasWarningPrereq = false;
    group.options.forEach(option => {
      if (option.type === 'Requisite' && 
          (option.level === 'Enforced' || (showWarnings && option.level === 'Warning')) &&
          courseMap.has(option.course)) {
        if (option.level === 'Warning') {
          hasWarningPrereq = true;
        }
      }
    });
    
    const groupColor = hasWarningPrereq ? 'warning' : 'enforced';

    // Add group node
    nodes.push({
      data: {
        id: groupId,
        label: `needs ${group.needs}`,
        type: 'group',
        groupColor: groupColor
      }
    });

    // Connect parent course to group with the same type as the group color
    edges.push({
      data: {
        id: `${groupId}-${parentCourseId}`,
        source: groupId,
        target: parentCourseId,
        type: groupColor
      }
    });

    // Process group options (enforced and optionally warning ones)
    group.options.forEach(option => {
      if (option.type === 'Requisite') {
        const shouldProcess = option.level === 'Enforced' || (showWarnings && option.level === 'Warning');
        
        if (shouldProcess) {
          const optionCourse = courseMap.get(option.course);
          if (optionCourse) {
            addCourse(option.course);
            const edgeType = option.level === 'Enforced' ? 'enforced' : 'warning';
            edges.push({
              data: {
                id: `${option.course}-${groupId}`,
                source: option.course,
                target: groupId,
                type: edgeType
              }
            });
          }
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

// Default styles for the graph visualization
export const defaultGraphStyles: cytoscape.StylesheetStyle[] = [
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
    selector: 'node[type="group"][groupColor="enforced"]',
    style: {
      'shape': 'diamond',
      'background-color': 'pink',
      'border-color': 'red',
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
    selector: 'node[type="group"][groupColor="warning"]',
    style: {
      'shape': 'diamond',
      'background-color': 'lightyellow',
      'border-color': 'orange',
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
      'line-color': 'red',
      'target-arrow-color': 'red',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      'arrow-scale': 1.2
    }
  },
  {
    selector: 'edge[type="warning"]',
    style: {
      'line-color': 'orange',
      'target-arrow-color': 'orange',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      'arrow-scale': 1.2
    }
  }
];

// Default layout options for the graph
export const defaultLayoutOptions = {
  name: 'dagre',
};

/**
 * Creates and configures a Cytoscape instance with the provided data
 * @param container - The HTML element to render the graph in
 * @param nodes - Array of graph nodes
 * @param edges - Array of graph edges
 * @param styles - Optional custom styles (uses defaultGraphStyles if not provided)
 * @param layoutOptions - Optional custom layout (uses defaultLayoutOptions if not provided)
 * @returns Configured Cytoscape instance
 */
export function createCytoscapeInstance(
  container: HTMLElement,
  nodes: GraphNode[],
  edges: GraphEdge[],
  styles: cytoscape.StylesheetStyle[] = defaultGraphStyles,
  layoutOptions = defaultLayoutOptions
): cytoscape.Core {
  console.log(`Built graph with ${nodes.length} nodes and ${edges.length} edges`);
  
  return cytoscape({
    container,
    elements: [...nodes, ...edges],
    style: styles,
    layout: layoutOptions
  });
}
