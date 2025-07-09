// Service to handle prerequisite graph data for visualization
// This service takes course data and constructs nodes and edges for Cytoscape.js
// Also handles Cytoscape instance creation and configuration

import cytoscape from 'cytoscape';
import type { Course, CourseRequirement, RequisiteGroup, CourseRequisite } from '../types.js';
import { addTooltipsToCytoscape, type TooltipConfig } from './shared/tooltipService.js';
import { isCourseEffectivelyCompleted } from './shared/completionService.js';

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
    // For courses, track completion status
    completed?: boolean;
    // For groups, track the color based on prerequisite types
    groupColor?: 'enforced' | 'warning' | 'recommended';
    // For groups, include the options for tooltip display
    options?: any[];
  };
}

export interface GraphEdge {
  // Represents a prerequisite edge between two courses or a course and a group
  data: {
    id: string;
    source: string;
    target: string;
    type: 'enforced' | 'warning' | 'recommended';
    fromCompleted?: boolean; // Whether this edge is from a completed course
  };
}

/**
 * Builds the prerequisite graph for a given target course
 * @param targetCourseId - The course ID to build prerequisites for
 * @param courses - Array of all available courses
 * @param courseMap - Map of course ID to course data for quick lookup
 * @param options - Configuration options for graph building
 * @param options.showWarnings - Whether to include warning-level prerequisites
 * @param options.showRecommended - Whether to include recommended prerequisites
 * @param options.userCompletedCourses - Set of completed course IDs
 * @param options.showCompletedCourses - Whether to show completed courses and their prerequisites
 * @returns Object containing nodes and edges for the graph
 */
export function buildPrerequisiteGraph(
  targetCourseId: string, 
  courses: Course[],
  courseMap: Map<string, Course>,
  options: { 
    showWarnings?: boolean; 
    showRecommended?: boolean;
    userCompletedCourses?: Set<string>;
    showCompletedCourses?: boolean;
  } = {}
): { nodes: GraphNode[], edges: GraphEdge[] } {
  const { 
    showWarnings = true, 
    showRecommended = true,
    userCompletedCourses = new Set(),
    showCompletedCourses = true
  } = options;
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

  // Helper function to check if a course is effectively completed (including equivalents)
  function isCourseEffectivelyCompletedWithEquivalents(courseId: string): boolean {
    const course = courseMap.get(courseId);
    const equivalents = course?.equivalentCourses || [];
    return isCourseEffectivelyCompleted(courseId, equivalents, userCompletedCourses);
  }

  // Function to add a course and its prerequisites to the graph
  // This function recursively processes the course and its prerequisites
  function addCourse(courseId: string): void {
    // Check if the course has already been visited to avoid cycles
    if (visitedCourses.has(courseId)) return; // Skip if already processed
    
    // Handle completion logic - use effective completion (including equivalents)
    const isCourseCompleted = userCompletedCourses.has(courseId);
    const isCourseEffectivelyCompleted = isCourseEffectivelyCompletedWithEquivalents(courseId);
    if (isCourseEffectivelyCompleted) {
      if (!showCompletedCourses) {
        // Don't render this course and skip adding its prerequisites
        return;
      }
      // If showCompletedCourses is true, we'll process this course but with special traversal logic
    }
    
    // Get the course from the map, or create a placeholder for missing courses
    let course = courseMap.get(courseId);
    if (!course) {
      // Create placeholder course for missing courses
      course = createMissingCourse(courseId);
    }
    
    visitedCourses.add(courseId);
    // Mark the course as visited to prevent reprocessing
    
    // Add course node
    const nodeData: any = {
      id: courseId,
      label: abbreviateCourseId(courseId),
      type: 'course',
      course: course
    };
    
    // Only add completed property if the course is effectively completed (for visual styling)
    if (isCourseEffectivelyCompleted) {
      nodeData.completed = true;
    }
    
    nodes.push({
      data: nodeData
    });

    // Process prerequisites (only if course exists in database)
    if (courseMap.has(courseId)) {
      if (isCourseEffectivelyCompleted && showCompletedCourses) {
        // For effectively completed courses, only traverse through completed prerequisites
        course.requisites.forEach(req => {
          processRequirementForCompletedCourse(req, courseId);
        });
      } else {
        // Normal prerequisite processing
        course.requisites.forEach(req => {
          processRequirement(req, courseId);
        });
      }
    }
    // Missing courses have no prerequisites to process
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
        // Check if this course should be skipped due to completion settings - use effective completion
        const isCourseEffectivelyCompleted = isCourseEffectivelyCompletedWithEquivalents(requirement.course);
        if (isCourseEffectivelyCompleted && !showCompletedCourses) {
          // Skip effectively completed courses when showCompletedCourses is false
          return;
        }
        
        // Always add the course to the graph, even if it's missing from our database
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
    } else if (requirement.type === 'Recommended' && showRecommended) {
      
      // Check if this course should be skipped due to completion settings - use effective completion
      const isCourseEffectivelyCompleted = isCourseEffectivelyCompletedWithEquivalents(requirement.course);
      if (isCourseEffectivelyCompleted && !showCompletedCourses) {
        // Skip effectively completed courses when showCompletedCourses is false
        return;
      }
      
      // Always add recommended courses to the graph, even if missing from database
      addCourse(requirement.course);
      // Add edge from recommended course to parent course
      edges.push({
        data: {
          id: `${requirement.course}-${parentCourseId}`,
          source: requirement.course,
          target: parentCourseId,
          type: 'recommended'
        }
      });
    }
    // Ignore other course types and missing courses
  }

  function processGroup(group: RequisiteGroup, parentCourseId: string): void { // Process a group of requisites
    const groupId = `group-${groupCounter++}`; // Generate a unique ID for the group (i.e. group-0, group-1, etc.)

    if (visitedGroups.has(groupId)){
      console.error("Group has already been processed:", groupId); // Skip if group has already been processed (should not happen since we have a unique ID for each group)
      return;
    }
      // Prevent processing the same group multiple times to avoid infinite loops
    visitedGroups.add(groupId);

    // Special handling for groups with equivalent courses
    // First, check if any course in the group is actually completed (not just effectively)
    const actuallyCompletedCourses: CourseRequisite[] = [];
    const validOptions: CourseRequisite[] = [];
    
    group.options.forEach(option => {
      // Skip if option is a nested group (we don't handle nested groups in this context)
      if (option.type === 'Group') return;
      
      const isValidOption = (option.type === 'Requisite' && 
        (option.level === 'Enforced' || (showWarnings && option.level === 'Warning'))) ||
        (showRecommended && option.type === 'Recommended');
      
      if (isValidOption) {
        validOptions.push(option);
        
        // Check for actual completion (not effective)
        if (userCompletedCourses.has(option.course)) {
          actuallyCompletedCourses.push(option);
        }
      }
    });

    // Check if we have actually completed courses and if any others in the group are equivalent
    if (actuallyCompletedCourses.length > 0) {
      // Check if any two courses in the group are equivalent
      let hasEquivalentCourses = false;
      for (let i = 0; i < validOptions.length && !hasEquivalentCourses; i++) {
        const courseA = courseMap.get(validOptions[i].course);
        if (courseA?.equivalentCourses) {
          for (let j = i + 1; j < validOptions.length; j++) {
            if (courseA.equivalentCourses.includes(validOptions[j].course)) {
              hasEquivalentCourses = true;
              break;
            }
          }
        }
      }

      // If group contains equivalent courses, only show the actually completed ones
      if (hasEquivalentCourses) {
        // Calculate remaining needs based on actually completed courses
        const remainingNeeds = Math.max(0, group.needs - actuallyCompletedCourses.length);
        
        // If satisfied by actually completed courses
        if (remainingNeeds === 0) {
          if (showCompletedCourses) {
            // Connect only the actually completed courses directly to parent
            actuallyCompletedCourses.forEach(option => {
              addCourse(option.course);
              
              const edgeType: 'enforced' | 'warning' | 'recommended' = 
                option.type === 'Recommended' ? 'recommended' :
                option.level === 'Enforced' ? 'enforced' : 'warning';
              
              edges.push({
                data: {
                  id: `${option.course}-${parentCourseId}`,
                  source: option.course,
                  target: parentCourseId,
                  type: edgeType,
                  fromCompleted: true
                }
              });
            });
          }
          return; // Finish rendering this group
        } else {
          // Group not fully satisfied, but we have equivalent courses
          // Show remaining incomplete courses that are NOT equivalent to completed ones
          const incompleteCourses: CourseRequisite[] = [];
          
          validOptions.forEach(option => {
            // Skip if this course is actually completed
            if (userCompletedCourses.has(option.course)) return;
            
            // Skip if this course is equivalent to any actually completed course
            let isEquivalentToCompleted = false;
            for (const completedOption of actuallyCompletedCourses) {
              const completedCourse = courseMap.get(completedOption.course);
              if (completedCourse?.equivalentCourses?.includes(option.course)) {
                isEquivalentToCompleted = true;
                break;
              }
              // Also check the reverse direction
              const optionCourse = courseMap.get(option.course);
              if (optionCourse?.equivalentCourses?.includes(completedOption.course)) {
                isEquivalentToCompleted = true;
                break;
              }
            }
            
            if (!isEquivalentToCompleted) {
              incompleteCourses.push(option);
            }
          });

          // Continue with normal group rendering logic for remaining courses
          const allCoursesToShow = showCompletedCourses ? 
            [...actuallyCompletedCourses, ...incompleteCourses] : 
            incompleteCourses;
          
          if (allCoursesToShow.length === 0) {
            return; // No courses to show
          }

          // Determine group color based on incomplete courses
          let groupColor: 'enforced' | 'warning' | 'recommended' = 'recommended';
          for (const option of incompleteCourses) {
            if (option.type === 'Requisite') {
              if (option.level === 'Enforced') {
                groupColor = 'enforced';
                break;
              } else if (option.level === 'Warning' && showWarnings) {
                groupColor = 'warning';
              }
            }
          }

          // Add group node
          nodes.push({
            data: {
              id: groupId,
              label: `Needs: ${remainingNeeds}`,
              type: 'group',
              groupColor: groupColor,
              options: group.options
            }
          });

          // Connect parent course to group
          edges.push({
            data: {
              id: `${groupId}-${parentCourseId}`,
              source: groupId,
              target: parentCourseId,
              type: groupColor
            }
          });

          // Process incomplete courses (connect to group)
          incompleteCourses.forEach(option => {
            addCourse(option.course);
            
            const edgeType: 'enforced' | 'warning' | 'recommended' = 
              option.type === 'Recommended' ? 'recommended' :
              option.level === 'Enforced' ? 'enforced' : 'warning';
            
            edges.push({
              data: {
                id: `${option.course}-${groupId}`,
                source: option.course,
                target: groupId,
                type: edgeType
              }
            });
          });

          // Process completed courses (connect directly to parent) - only if showing completed
          if (showCompletedCourses) {
            actuallyCompletedCourses.forEach(option => {
              addCourse(option.course);
              
              const edgeType: 'enforced' | 'warning' | 'recommended' = 
                option.type === 'Recommended' ? 'recommended' :
                option.level === 'Enforced' ? 'enforced' : 'warning';
              
              edges.push({
                data: {
                  id: `${option.course}-${parentCourseId}`,
                  source: option.course,
                  target: parentCourseId,
                  type: edgeType,
                  fromCompleted: true
                }
              });
            });
          }
          
          return; // Finished handling this equivalent course group
        }
      }
    }

    // If we reach here, it's normal group processing (no equivalent courses detected)
    // Count completed courses in this group using effective completion
    const completedCourses: CourseRequisite[] = [];
    const incompleteCourses: CourseRequisite[] = [];
    
    validOptions.forEach(option => {
      // Use effective completion (including equivalents) for group satisfaction logic
      const isCourseEffectivelyCompleted = isCourseEffectivelyCompletedWithEquivalents(option.course);
      
      if (isCourseEffectivelyCompleted) {
        completedCourses.push(option);
      } else {
        incompleteCourses.push(option);
      }
    });

    // Calculate remaining needs (always count completed courses toward fulfillment)
    const remainingNeeds = Math.max(0, group.needs - completedCourses.length);
    
    // If group requirement is fully satisfied, handle based on showCompletedCourses setting
    if (remainingNeeds === 0) {
      if (showCompletedCourses) {
        // Connect completed courses directly to parent, bypassing the group
        completedCourses.forEach(option => {
          addCourse(option.course);
          
          const edgeType: 'enforced' | 'warning' | 'recommended' = 
            option.type === 'Recommended' ? 'recommended' :
            option.level === 'Enforced' ? 'enforced' : 'warning';
          
          edges.push({
            data: {
              id: `${option.course}-${parentCourseId}`,
              source: option.course,
              target: parentCourseId,
              type: edgeType,
              fromCompleted: true
            }
          });
        });
      }
      // If showCompletedCourses is false, we simply don't show anything (group is satisfied)
      return; // Skip creating the group node
    }

    // Group is not fully satisfied, show remaining incomplete courses
    const coursesToShow = showCompletedCourses ? incompleteCourses : incompleteCourses;
    
    // Check if we have any courses to show
    if (coursesToShow.length === 0) {
      return; // No courses to show
    }

    // Determine group color based on prerequisite types in incomplete courses
    let hasEnforcedPrereq = false;
    let hasWarningPrereq = false;
    let hasRecommendedPrereq = false;
    
    incompleteCourses.forEach(option => {
      if (option.type === 'Requisite') {
        if (option.level === 'Enforced') {
          hasEnforcedPrereq = true;
        } else if (option.level === 'Warning' && showWarnings) {
          hasWarningPrereq = true;
        }
      } else if (option.type === 'Recommended' && showRecommended) {
        hasRecommendedPrereq = true;
      }
    });
    
    // Determine group color based on priority: enforced > warning > recommended
    let groupColor: 'enforced' | 'warning' | 'recommended';
    if (hasEnforcedPrereq) {
      groupColor = 'enforced';
    } else if (hasWarningPrereq) {
      groupColor = 'warning';
    } else {
      groupColor = 'recommended';
    }

    // Add group node with updated needs count
    nodes.push({
      data: {
        id: groupId,
        label: `Needs: ${remainingNeeds}`,
        type: 'group',
        groupColor: groupColor,
        options: group.options // Include all original options for tooltip display
      }
    });

    // Connect parent course to group
    edges.push({
      data: {
        id: `${groupId}-${parentCourseId}`,
        source: groupId,
        target: parentCourseId,
        type: groupColor
      }
    });

    // Process incomplete courses (connect to group)
    incompleteCourses.forEach(option => {
      addCourse(option.course);
      
      const edgeType: 'enforced' | 'warning' | 'recommended' = 
        option.type === 'Recommended' ? 'recommended' :
        option.level === 'Enforced' ? 'enforced' : 'warning';
      
      edges.push({
        data: {
          id: `${option.course}-${groupId}`,
          source: option.course,
          target: groupId,
          type: edgeType
        }
      });
    });

    // Process completed courses (connect directly to parent, bypassing group) - only if showing completed
    if (showCompletedCourses) {
      completedCourses.forEach(option => {
        addCourse(option.course);
        
        const edgeType: 'enforced' | 'warning' | 'recommended' = 
          option.type === 'Recommended' ? 'recommended' :
          option.level === 'Enforced' ? 'enforced' : 'warning';
        
        edges.push({
          data: {
            id: `${option.course}-${parentCourseId}`,
            source: option.course,
            target: parentCourseId,
            type: edgeType,
            fromCompleted: true
          }
        });
      });
    }
  }

  // Function to process requirements for completed courses
  // Only traverses through completed prerequisites using recursion
  function processRequirementForCompletedCourse(requirement: CourseRequirement, parentCourseId: string): void {
    if (requirement.type === 'Group') {
      // For groups, recursively process each option that is completed
      requirement.options.forEach(option => {
        processRequirementForCompletedCourse(option, parentCourseId);
      });
    } else if (requirement.type === 'Requisite' || requirement.type === 'Recommended') {
      // Only process if the course is effectively completed (including equivalents)
      if (isCourseEffectivelyCompletedWithEquivalents(requirement.course)) {
        addCourse(requirement.course);
        
        // Determine edge type
        const edgeType: 'enforced' | 'warning' | 'recommended' = 
          requirement.type === 'Recommended' ? 'recommended' :
          requirement.level === 'Enforced' ? 'enforced' : 'warning';
        
        // Add direct edge from completed course to parent (bypassing group structure)
        edges.push({
          data: {
            id: `${requirement.course}-${parentCourseId}`,
            source: requirement.course,
            target: parentCourseId,
            type: edgeType,
            fromCompleted: true
          }
        });
      }
      // Skip non-completed courses
    }
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
    selector: 'node[type="course"][completed]',
    style: {
      'background-color': '#dcfce7', // Light green background
      'border-color': '#22c55e',    // Green border
      'border-width': 2,
      'color': '#15803d'            // Dark green text
    }
  },
  {
    selector: 'node[type="course"].selected',
    style: {
      'background-color': '#dbeafe',
      'color': '#1e40af',
      'border-color': '#3b82f6',
      'border-width': 3,
      'font-weight': 'bold'
    }
  },
  {
    selector: 'node[type="course"][completed].selected',
    style: {
      'background-color': '#bbf7d0', // Slightly darker green when selected
      'color': '#15803d',
      'border-color': '#16a34a',
      'border-width': 3,
      'font-weight': 'bold'
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
    selector: 'node[type="group"][groupColor="recommended"]',
    style: {
      'shape': 'diamond',
      'background-color': 'lightyellow',
      'border-color': 'orange',
      'border-width': 2,
      'border-style': 'dashed',
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
  },
  {
    selector: 'edge[type="recommended"]',
    style: {
      'line-color': 'orange',
      'target-arrow-color': 'orange',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      'arrow-scale': 1.2,
      'line-style': 'dashed'
    }
  },
  {
    selector: 'edge[fromCompleted]',
    style: {
      'line-color': '#22c55e',        // Green for edges from completed courses
      'target-arrow-color': '#22c55e',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      'arrow-scale': 1.2,
      'opacity': 0.8
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
 * @param tooltipConfig - Optional tooltip configuration (enables tooltips if provided)
 * @returns Object containing the Cytoscape instance and optional TooltipManager
 */
export function createCytoscapeInstance(
  container: HTMLElement,
  nodes: GraphNode[],
  edges: GraphEdge[],
  styles: cytoscape.StylesheetStyle[] = defaultGraphStyles,
  layoutOptions = defaultLayoutOptions,
  tooltipConfig?: Partial<TooltipConfig>
): { cy: cytoscape.Core; tooltipManager?: import('./shared/tooltipService.js').TooltipManager } {
  console.log(`Built graph with ${nodes.length} nodes and ${edges.length} edges`);
  
  const cy = cytoscape({
    container,
    elements: [...nodes, ...edges],
    style: styles,
    layout: layoutOptions
  });

  // Add tooltips if configuration is provided
  let tooltipManager;
  if (tooltipConfig !== undefined) {
    tooltipManager = addTooltipsToCytoscape(cy, container, tooltipConfig);
  }
  
  return { cy, tooltipManager };
}

/**
 * Creates a placeholder course object for missing courses
 * @param courseId - The course ID
 * @returns Placeholder course object
 */
function createMissingCourse(courseId: string): Course {
  return {
    id: courseId,
    title: "Course information not available",
    units: "?" as any, // Will display as "? units"
    description: "No course information available in the database.",
    requisites: [], // Missing courses have no prerequisites
    equivalentCourses: []
  };
}

/**
 * Abbreviates course IDs for better display in graph nodes
 * @param courseId - The full course ID
 * @returns Abbreviated course ID for display
 */
function abbreviateCourseId(courseId: string): string {
  // Replace common department names with abbreviations for better display
  return courseId
    .replace(/^COMPTNG\s+/, 'PIC ')
    .replace(/^COM SCI\s+/, 'CS ');
}

/**
 * Handles clicking on a prerequisite course in the sidebar
 * Enables necessary prerequisite types and highlights the course in the graph
 * @param courseId - The course ID to highlight
 * @param requisiteLevel - The level of the prerequisite (Enforced, Warning)
 * @param requisiteType - The type of the prerequisite (Requisite, Recommended)
 * @param cy - The Cytoscape instance
 * @param courseMap - Map of course ID to course data
 * @param showWarnings - Current state of warnings toggle
 * @param showRecommended - Current state of recommended toggle
 * @param showCompletedCourses - Current state of completed courses toggle
 * @param userCompletedCourses - Set of completed course IDs
 * @param setShowWarnings - Function to update warnings toggle
 * @param setShowRecommended - Function to update recommended toggle
 * @param setShowCompletedCourses - Function to update completed courses toggle
 * @param setSelectedCourse - Function to update selected course
 * @param setIsTransitioning - Function to update transition state
 */
export function handlePrerequisiteClick(
  courseId: string,
  requisiteLevel: string | undefined,
  requisiteType: string | undefined,
  cy: cytoscape.Core | undefined,
  courseMap: Map<string, Course>,
  showWarnings: boolean,
  showRecommended: boolean,
  showCompletedCourses: boolean,
  userCompletedCourses: Set<string>,
  setShowWarnings: (value: boolean) => void,
  setShowRecommended: (value: boolean) => void,
  setShowCompletedCourses: (value: boolean) => void,
  setSelectedCourse: (course: Course | null) => void,
  setIsTransitioning: (value: boolean) => void
): void {
  // Check if the clicked course is completed but showCompletedCourses is off
  const course = courseMap.get(courseId);
  const equivalentCourses = course?.equivalentCourses || [];
  const isCourseCompleted = isCourseEffectivelyCompleted(courseId, equivalentCourses, userCompletedCourses);
  if (isCourseCompleted && !showCompletedCourses) {
    // Enable showCompletedCourses to reveal the completed course
    setShowCompletedCourses(true);
  }
  
  // First, check if we need to enable prerequisite types to show this course
  if (requisiteType === 'Recommended' && !showRecommended) {
    // Enable both warnings and recommended to show recommended prerequisites
    setShowWarnings(true);
    setShowRecommended(true);
  } else if (requisiteLevel === 'Warning' && !showWarnings) {
    // Enable warnings to show warning-level prerequisites
    setShowWarnings(true);
  }
  
  // Wait a bit for the graph to update, then highlight the course
  setTimeout(() => {
    if (cy) {
      // Find the node with this course ID
      const targetNode = cy.nodes(`[id="${courseId}"]`);
      if (targetNode.length > 0) {
        // Clear existing selections
        cy.nodes().removeClass('selected');
        // Select the target node
        targetNode.addClass('selected');
        
        // Update the selected course in the sidebar
        const course = courseMap.get(courseId);
        if (course) {
          setIsTransitioning(true);
          setTimeout(() => {
            setSelectedCourse(course);
            setIsTransitioning(false);
          }, 150);
        }
      }
    }
  }, 100); // Small delay to allow graph to re-render with new prerequisite settings
}
