// Graph interaction handlers
// Contains functions for handling user interactions with the graph

import cytoscape from 'cytoscape';
import type { Course } from '../../types.js';
import { courseCompletionService } from '../schedulingServices.js';

/**
 * Handles clicking on a prerequisite course from the sidebar
 * Enables necessary prerequisite visibility and highlights the course in the graph
 * @param courseId - The course ID to highlight
 * @param cy - The Cytoscape instance
 * @param courseMap - Map of course ID to course data
 * @param showWarnings - Current state of warnings toggle
 * @param showCompletedCourses - Current state of completed courses toggle
 * @param userCompletedCourses - Set of completed course IDs
 * @param setShowWarnings - Function to update warnings toggle
 * @param setShowCompletedCourses - Function to update completed courses toggle
 * @param setSelectedCourse - Function to update selected course
 * @param setIsTransitioning - Function to update transition state
 */
export function handlePrerequisiteClick(
  courseId: string,
  cy: cytoscape.Core | undefined,
  courseMap: Map<string, Course>,
  showWarnings: boolean,
  showCompletedCourses: boolean,
  userCompletedCourses: Set<string>,
  setShowWarnings: (value: boolean) => void,
  setShowCompletedCourses: (value: boolean) => void,
  setSelectedCourse: (course: Course | null) => void,
  setIsTransitioning: (value: boolean) => void
): void {
  // Check if the clicked course is completed but showCompletedCourses is off
  const course = courseMap.get(courseId);
  const equivalentCourses = course?.equivalentCourses || [];
  const isCourseCompleted = courseCompletionService.isCourseEffectivelyCompleted(courseId, equivalentCourses, userCompletedCourses);
  if (isCourseCompleted && !showCompletedCourses) {
    // Enable showCompletedCourses to reveal the completed course
    setShowCompletedCourses(true);
  }
  
  // Enable warnings to show prerequisite connections
  if (!showWarnings) {
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

/**
 * Sets up standard course graph event handlers
 * @param cy - The Cytoscape instance
 * @param onCourseSelect - Function to call when a course is selected
 * @param onBackgroundClick - Function to call when background is clicked
 */
export function setupCourseGraphEventHandlers(
  cy: cytoscape.Core,
  onCourseSelect: (course: Course) => void,
  onBackgroundClick: () => void
): void {
  // Handle course selection
  cy.on('tap', 'node[type="course"]', (event) => {
    const node = event.target;
    const course = node.data('course');
    
    if (course) {
      // Select the new course
      cy.nodes().removeClass('selected');
      node.addClass('selected');
      onCourseSelect(course);
    }
  });

  // Handle background click to reset selection
  cy.on('tap', (event) => {
    if (event.target === cy) {
      cy.nodes().removeClass('selected');
      onBackgroundClick();
    }
  });
}

/**
 * Sets up basic hover effects for when tooltips are disabled
 * @param cy - The Cytoscape instance
 */
export function setupBasicHoverEffects(cy: cytoscape.Core): void {
  // Add basic hover effects
  cy.on('mouseover', 'node[type="course"]', (event) => {
    const node = event.target;
    node.style('background-color', '#f0f8ff');
  });

  // Reset background color when mouse leaves
  cy.on('mouseout', 'node[type="course"]', (event) => {
    const node = event.target;
    node.style('background-color', 'white');
  });
}

/**
 * Highlights a specific course node in the graph
 * @param cy - The Cytoscape instance
 * @param courseId - The course ID to highlight
 */
export function highlightCourseNode(cy: cytoscape.Core, courseId: string): void {
  // Clear existing selections
  cy.nodes().removeClass('selected');
  
  // Find and select the target node
  const targetNode = cy.nodes(`[id="${courseId}"]`);
  if (targetNode.length > 0) {
    targetNode.addClass('selected');
  }
}

/**
 * Clears all selections in the graph
 * @param cy - The Cytoscape instance
 */
export function clearGraphSelection(cy: cytoscape.Core): void {
  cy.nodes().removeClass('selected');
}
