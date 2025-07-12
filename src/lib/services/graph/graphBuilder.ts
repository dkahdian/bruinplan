// Graph building logic for prerequisite graphs
// Contains the core logic for building graph nodes and edges from course data

import type { Course, CourseRequirement, RequisiteGroup, CourseRequisite } from '../../types.js';
import type { GraphNode, GraphEdge, GraphBuildOptions, GraphBuildResult } from './types.js';
import { schedulingService } from '../shared/schedulingService.js';
import {
  createMissingCourse,
  abbreviateCourseId,
  generateGroupId,
  isCourseEffectivelyCompletedWithEquivalents,
  getEdgeType,
  determineGroupColor,
  shouldShowCourse,
  filterCoursesToShow
} from './utils.js';

/**
 * Builds the prerequisite graph for a given target course
 * @param targetCourseId - The course ID to build prerequisites for
 * @param courses - Array of all available courses
 * @param courseMap - Map of course ID to course data for quick lookup
 * @param options - Configuration options for graph building
 * @returns Object containing nodes and edges for the graph
 */
export function buildPrerequisiteGraph(
  targetCourseId: string, 
  courses: Course[],
  courseMap: Map<string, Course>,
  options: GraphBuildOptions = {}
): GraphBuildResult {
  const { 
    showWarnings = true, 
    showRecommended = true,
    userCompletedCourses = new Set(),
    showCompletedCourses = true,
    enableAnimations = true,
    animationDuration = 600,
    animationEasing = 'ease-out'
  } = options;

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const visitedCourses = new Set<string>();
  const visitedGroups = new Set<string>();
  let groupCounter = 0;

  // Helper function to check if a course is effectively completed (including equivalents)
  function isEffectivelyCompleted(courseId: string): boolean {
    return isCourseEffectivelyCompletedWithEquivalents(
      courseId,
      courseMap,
      userCompletedCourses,
      schedulingService.isCourseEffectivelyCompleted.bind(schedulingService)
    );
  }

  // Function to add a course and its prerequisites to the graph
  function addCourse(courseId: string): void {
    if (visitedCourses.has(courseId)) return;
    
    const isCourseCompleted = userCompletedCourses.has(courseId);
    const isCourseEffectivelyCompleted = isEffectivelyCompleted(courseId);
    
    if (!shouldShowCourse(courseId, showCompletedCourses, (id) => isEffectivelyCompleted(id))) {
      return;
    }
    
    let course = courseMap.get(courseId);
    if (!course) {
      course = createMissingCourse(courseId);
    }
    
    visitedCourses.add(courseId);
    
    const nodeData: any = {
      id: courseId,
      label: abbreviateCourseId(courseId),
      type: 'course',
      course: course
    };
    
    if (isCourseEffectivelyCompleted) {
      nodeData.completed = true;
    }
    
    nodes.push({ data: nodeData });

    if (courseMap.has(courseId)) {
      if (isCourseEffectivelyCompleted && showCompletedCourses) {
        course.requisites.forEach(req => {
          processRequirementForCompletedCourse(req, courseId);
        });
      } else {
        course.requisites.forEach(req => {
          processRequirement(req, courseId);
        });
      }
    }
  }

  // Function to process a course requirement
  function processRequirement(requirement: CourseRequirement, parentCourseId: string): void {
    if (requirement.type === 'Group') {
      processGroup(requirement, parentCourseId);
    } else if (requirement.type === 'Requisite') {
      const shouldProcess = requirement.level === 'Enforced' || (showWarnings && requirement.level === 'Warning');
      
      if (shouldProcess) {
        const isCourseEffectivelyCompleted = isEffectivelyCompleted(requirement.course);
        if (!shouldShowCourse(requirement.course, showCompletedCourses, (id) => isEffectivelyCompleted(id))) {
          return;
        }
        
        addCourse(requirement.course);
        const edgeType = requirement.level === 'Enforced' ? 'enforced' : 'warning';
        edges.push({
          data: {
            id: `${requirement.course}-${parentCourseId}`,
            source: requirement.course,
            target: parentCourseId,
            type: edgeType
          }
        });
      }
    } else if (requirement.type === 'Recommended' && showRecommended) {
      const isCourseEffectivelyCompleted = isEffectivelyCompleted(requirement.course);
      if (!shouldShowCourse(requirement.course, showCompletedCourses, (id) => isEffectivelyCompleted(id))) {
        return;
      }
      
      addCourse(requirement.course);
      edges.push({
        data: {
          id: `${requirement.course}-${parentCourseId}`,
          source: requirement.course,
          target: parentCourseId,
          type: 'recommended'
        }
      });
    }
  }

  function processGroup(group: RequisiteGroup, parentCourseId: string): void {
    const groupId = generateGroupId(groupCounter++);

    if (visitedGroups.has(groupId)) {
      console.error("Group has already been processed:", groupId);
      return;
    }
    visitedGroups.add(groupId);

    // Special handling for groups with equivalent courses
    const actuallyCompletedCourses: CourseRequisite[] = [];
    const validOptions: CourseRequisite[] = [];
    
    group.options.forEach(option => {
      if (option.type === 'Group') return;
      
      const isValidOption = (option.type === 'Requisite' && 
        (option.level === 'Enforced' || (showWarnings && option.level === 'Warning'))) ||
        (showRecommended && option.type === 'Recommended');
      
      if (isValidOption) {
        validOptions.push(option);
        
        if (userCompletedCourses.has(option.course)) {
          actuallyCompletedCourses.push(option);
        }
      }
    });

    // Check if we have actually completed courses and if any others in the group are equivalent
    if (actuallyCompletedCourses.length > 0) {
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
        const remainingNeeds = Math.max(0, group.needs - actuallyCompletedCourses.length);
        
        if (remainingNeeds === 0) {
          if (showCompletedCourses) {
            actuallyCompletedCourses.forEach(option => {
              addCourse(option.course);
              
              const edgeType = getEdgeType(option);
              
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
          return;
        } else {
          // Group not fully satisfied, process incomplete courses that are NOT equivalent to completed ones
          const incompleteCourses: CourseRequisite[] = [];
          
          validOptions.forEach(option => {
            if (userCompletedCourses.has(option.course)) return;
            
            let isEquivalentToCompleted = false;
            for (const completedOption of actuallyCompletedCourses) {
              const completedCourse = courseMap.get(completedOption.course);
              if (completedCourse?.equivalentCourses?.includes(option.course)) {
                isEquivalentToCompleted = true;
                break;
              }
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

          const allCoursesToShow = showCompletedCourses ? 
            [...actuallyCompletedCourses, ...incompleteCourses] : 
            incompleteCourses;
          
          if (allCoursesToShow.length === 0) {
            return;
          }

          const groupColor = determineGroupColor(incompleteCourses, showWarnings);

          nodes.push({
            data: {
              id: groupId,
              label: `Needs: ${remainingNeeds}`,
              type: 'group',
              groupColor: groupColor,
              options: group.options
            }
          });

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
            
            const edgeType = getEdgeType(option);
            
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
              
              const edgeType = getEdgeType(option);
              
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
          
          return;
        }
      }
    }

    // Normal group processing (no equivalent courses)
    const completedCourses: CourseRequisite[] = [];
    const incompleteCourses: CourseRequisite[] = [];
    
    validOptions.forEach(option => {
      if (isEffectivelyCompleted(option.course)) {
        completedCourses.push(option);
      } else {
        incompleteCourses.push(option);
      }
    });

    const remainingNeeds = Math.max(0, group.needs - completedCourses.length);
    
    if (remainingNeeds === 0) {
      if (showCompletedCourses) {
        completedCourses.forEach(option => {
          addCourse(option.course);
          
          const edgeType = getEdgeType(option);
          
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
      return;
    }

    const allCoursesToShow = showCompletedCourses ? 
      [...completedCourses, ...incompleteCourses] : 
      incompleteCourses;
    
    if (allCoursesToShow.length === 0) {
      return;
    }

    const groupColor = determineGroupColor(incompleteCourses, showWarnings);

    nodes.push({
      data: {
        id: groupId,
        label: `Needs: ${remainingNeeds}`,
        type: 'group',
        groupColor: groupColor,
        options: group.options
      }
    });

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
      
      const edgeType = getEdgeType(option);
      
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
        
        const edgeType = getEdgeType(option);
        
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
  function processRequirementForCompletedCourse(requirement: CourseRequirement, parentCourseId: string): void {
    if (requirement.type === 'Group') {
      requirement.options.forEach(option => {
        processRequirementForCompletedCourse(option, parentCourseId);
      });
    } else if (requirement.type === 'Requisite' || requirement.type === 'Recommended') {
      if (isEffectivelyCompleted(requirement.course)) {
        addCourse(requirement.course);
        
        const edgeType = getEdgeType(requirement);
        
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
    }
  }

  // Start building from the target course
  addCourse(targetCourseId);
  
  return { nodes, edges };
}
