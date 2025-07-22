// Graph building logic for prerequisite graphs
// Contains the core logic for building graph nodes and edges from course data

import type { Course, CourseRequirement, RequisiteGroup, CourseRequisite } from '../../types.js';
import type { GraphNode, GraphEdge, GraphBuildOptions, GraphBuildResult } from './types.js';
import { schedulingService, courseCompletionService } from '../schedulingServices.js';
import { getCourseById } from '../../data-layer/api.js';
import {
  createMissingCourse,
  abbreviateCourseId,
  generateGroupId,
  isCourseEffectivelyCompletedWithEquivalents,
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
      courseCompletionService.isCourseEffectivelyCompleted.bind(courseCompletionService)
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
    if (requirement.type === 'group') {
      processGroup(requirement, parentCourseId);
    } else if (requirement.type === 'requisite') {
      const isCourseEffectivelyCompleted = isEffectivelyCompleted(requirement.course);
      if (!shouldShowCourse(requirement.course, showCompletedCourses, (id) => isEffectivelyCompleted(id))) {
        return;
      }
      
      addCourse(requirement.course);
      edges.push({
        data: {
          id: `${requirement.course}-${parentCourseId}`,
          source: requirement.course,
          target: parentCourseId
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
      if (option.type === 'group') return;
      
      // All options are valid now since we removed levels
      validOptions.push(option);
      
      if (userCompletedCourses.has(option.course)) {
        actuallyCompletedCourses.push(option);
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
              addCourse(option.course);edges.push({
                data: {
                  id: `${option.course}-${parentCourseId}`,
                  source: option.course,
                  target: parentCourseId,
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

          const groupColor = determineGroupColor(incompleteCourses);

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
              target: parentCourseId
              }
          });

          // Process incomplete courses (connect to group)
          incompleteCourses.forEach(option => {
            addCourse(option.course);edges.push({
              data: {
                id: `${option.course}-${groupId}`,
                source: option.course,
                target: groupId
              }
            });
          });

          // Process completed courses (connect directly to parent) - only if showing completed
          if (showCompletedCourses) {
            actuallyCompletedCourses.forEach(option => {
              addCourse(option.course);edges.push({
                data: {
                  id: `${option.course}-${parentCourseId}`,
                  source: option.course,
                  target: parentCourseId,
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
          addCourse(option.course);edges.push({
            data: {
              id: `${option.course}-${parentCourseId}`,
              source: option.course,
              target: parentCourseId,
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

    const groupColor = determineGroupColor(incompleteCourses);

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
        target: parentCourseId
      }
    });

    // Process incomplete courses (connect to group)
    incompleteCourses.forEach(option => {
      addCourse(option.course);edges.push({
        data: {
          id: `${option.course}-${groupId}`,
          source: option.course,
          target: groupId
        }
      });
    });

    // Process completed courses (connect directly to parent, bypassing group) - only if showing completed
    if (showCompletedCourses) {
      completedCourses.forEach(option => {
        addCourse(option.course);edges.push({
          data: {
            id: `${option.course}-${parentCourseId}`,
            source: option.course,
            target: parentCourseId,
            fromCompleted: true
          }
        });
      });
    }
  }

  // Function to process requirements for completed courses
  function processRequirementForCompletedCourse(requirement: CourseRequirement, parentCourseId: string): void {
    if (requirement.type === 'group') {
      requirement.options.forEach(option => {
        processRequirementForCompletedCourse(option, parentCourseId);
      });
    } else if (requirement.type === 'requisite') {
      if (isEffectivelyCompleted(requirement.course)) {
        addCourse(requirement.course);edges.push({
          data: {
            id: `${requirement.course}-${parentCourseId}`,
            source: requirement.course,
            target: parentCourseId,
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

/**
 * Async version of buildPrerequisiteGraph that works with the data layer API
 * @param targetCourseId - The course ID to build prerequisites for
 * @param courseCache - Map to cache loaded courses (optional, will be created if not provided)
 * @param options - Configuration options for graph building
 * @returns Promise containing object with nodes and edges for the graph
 */
export async function buildPrerequisiteGraphAsync(
  targetCourseId: string,
  courseCache: Map<string, Course> = new Map(),
  options: GraphBuildOptions = {}
): Promise<GraphBuildResult> {
  console.log(`buildPrerequisiteGraphAsync called - targetCourseId: ${targetCourseId}, courseCache size: ${courseCache.size}`);
  
  const { 
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

  // Helper function to load a course and add it to cache
  async function loadCourse(courseId: string): Promise<Course | null> {
    console.log(`loadCourse called for: ${courseId}`);
    
    if (courseCache.has(courseId)) {
      console.log(`Course ${courseId} found in cache`);
      return courseCache.get(courseId)!;
    }

    console.log(`Loading course ${courseId} from API`);
    
    try {
      const course = await getCourseById(courseId);
      if (course) {
        courseCache.set(courseId, course);
        return course;
      }
      return null;
    } catch (error) {
      console.error(`Failed to load course ${courseId}:`, error);
      return null;
    }
  }

  // Helper function to check if a course is effectively completed (including equivalents)
  function isEffectivelyCompleted(courseId: string): boolean {
    return isCourseEffectivelyCompletedWithEquivalents(
      courseId,
      courseCache,
      userCompletedCourses,
      courseCompletionService.isCourseEffectivelyCompleted.bind(courseCompletionService)
    );
  }

  // Async function to add a course and its prerequisites to the graph
  async function addCourse(courseId: string): Promise<void> {
    console.log(`addCourse called for: ${courseId}`);
    
    if (visitedCourses.has(courseId)) {
      console.log(`Course ${courseId} already visited, skipping`);
      return;
    }
    
    const isCourseCompleted = userCompletedCourses.has(courseId);
    const isCourseEffectivelyCompleted = isEffectivelyCompleted(courseId);
    
    console.log(`Course ${courseId} - completed: ${isCourseCompleted}, effectivelyCompleted: ${isCourseEffectivelyCompleted}`);
    
    if (!shouldShowCourse(courseId, showCompletedCourses, (id) => isEffectivelyCompleted(id))) {
      console.log(`Course ${courseId} should not be shown, skipping`);
      return;
    }
    
    let course = await loadCourse(courseId);
    if (!course) {
      console.log(`Course ${courseId} not found, creating missing course`);
      course = createMissingCourse(courseId);
    }
    
    console.log(`Adding course ${courseId} to visited set`);
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

    if (courseCache.has(courseId) && course.requisites) {
      if (isCourseEffectivelyCompleted && showCompletedCourses) {
        for (const req of course.requisites) {
          await processRequirementForCompletedCourse(req, courseId);
        }
      } else {
        for (const req of course.requisites) {
          await processRequirement(req, courseId);
        }
      }
    }
  }

  // Async function to process a course requirement
  async function processRequirement(requirement: CourseRequirement, parentCourseId: string): Promise<void> {
    if (requirement.type === 'group') {
      await processGroup(requirement, parentCourseId);
    } else if (requirement.type === 'requisite') {
      const isCourseEffectivelyCompleted = isEffectivelyCompleted(requirement.course);
      if (!shouldShowCourse(requirement.course, showCompletedCourses, (id) => isEffectivelyCompleted(id))) {
        return;
      }
      
      await addCourse(requirement.course);
      edges.push({
        data: {
          id: `${requirement.course}-${parentCourseId}`,
          source: requirement.course,
          target: parentCourseId
        }
      });
    }
  }

  async function processGroup(group: RequisiteGroup, parentCourseId: string): Promise<void> {
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
      if (option.type === 'group') return;
      
      // All options are valid now since we removed levels
      validOptions.push(option);
      
      if (userCompletedCourses.has(option.course)) {
        actuallyCompletedCourses.push(option);
      }
    });

    // Check if we have actually completed courses and if any others in the group are equivalent
    if (actuallyCompletedCourses.length > 0) {
      let hasEquivalentCourses = false;
      for (let i = 0; i < validOptions.length && !hasEquivalentCourses; i++) {
        const courseA = courseCache.get(validOptions[i].course);
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
            for (const option of actuallyCompletedCourses) {
              await addCourse(option.course);
              edges.push({
                data: {
                  id: `${option.course}-${parentCourseId}`,
                  source: option.course,
                  target: parentCourseId,
                  fromCompleted: true
                }
              });
            }
          }
          return;
        } else {
          // Group not fully satisfied, process incomplete courses that are NOT equivalent to completed ones
          const incompleteCourses: CourseRequisite[] = [];
          
          for (const option of validOptions) {
            if (userCompletedCourses.has(option.course)) continue;
            
            let isEquivalentToCompleted = false;
            for (const completedOption of actuallyCompletedCourses) {
              const completedCourse = courseCache.get(completedOption.course);
              if (completedCourse?.equivalentCourses?.includes(option.course)) {
                isEquivalentToCompleted = true;
                break;
              }
              const optionCourse = courseCache.get(option.course);
              if (optionCourse?.equivalentCourses?.includes(completedOption.course)) {
                isEquivalentToCompleted = true;
                break;
              }
            }
            
            if (!isEquivalentToCompleted) {
              incompleteCourses.push(option);
            }
          }

          const allCoursesToShow = showCompletedCourses ? 
            [...actuallyCompletedCourses, ...incompleteCourses] : 
            incompleteCourses;
          
          if (allCoursesToShow.length === 0) {
            return;
          }

          const groupColor = determineGroupColor(incompleteCourses);

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
              target: parentCourseId
              }
          });

          // Process incomplete courses (connect to group)
          for (const option of incompleteCourses) {
            await addCourse(option.course);
            edges.push({
              data: {
                id: `${option.course}-${groupId}`,
                source: option.course,
                target: groupId
              }
            });
          }

          // Process completed courses (connect directly to parent) - only if showing completed
          if (showCompletedCourses) {
            for (const option of actuallyCompletedCourses) {
              await addCourse(option.course);
              edges.push({
                data: {
                  id: `${option.course}-${parentCourseId}`,
                  source: option.course,
                  target: parentCourseId,
                  fromCompleted: true
                }
              });
            }
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
        for (const option of completedCourses) {
          await addCourse(option.course);
          edges.push({
            data: {
              id: `${option.course}-${parentCourseId}`,
              source: option.course,
              target: parentCourseId,
              fromCompleted: true
            }
          });
        }
      }
      return;
    }

    const allCoursesToShow = showCompletedCourses ? 
      [...completedCourses, ...incompleteCourses] : 
      incompleteCourses;
    
    if (allCoursesToShow.length === 0) {
      return;
    }

    const groupColor = determineGroupColor(incompleteCourses);

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
        target: parentCourseId
      }
    });

    // Process incomplete courses (connect to group)
    for (const option of incompleteCourses) {
      await addCourse(option.course);
      edges.push({
        data: {
          id: `${option.course}-${groupId}`,
          source: option.course,
          target: groupId
        }
      });
    }

    // Process completed courses (connect directly to parent, bypassing group) - only if showing completed
    if (showCompletedCourses) {
      for (const option of completedCourses) {
        await addCourse(option.course);
        edges.push({
          data: {
            id: `${option.course}-${parentCourseId}`,
            source: option.course,
            target: parentCourseId,
            fromCompleted: true
          }
        });
      }
    }
  }

  // Async function to process requirements for completed courses
  async function processRequirementForCompletedCourse(requirement: CourseRequirement, parentCourseId: string): Promise<void> {
    if (requirement.type === 'group') {
      for (const option of requirement.options) {
        await processRequirementForCompletedCourse(option, parentCourseId);
      }
    } else if (requirement.type === 'requisite') {
      if (isEffectivelyCompleted(requirement.course)) {
        await addCourse(requirement.course);
        edges.push({
          data: {
            id: `${requirement.course}-${parentCourseId}`,
            source: requirement.course,
            target: parentCourseId,
            fromCompleted: true
          }
        });
      }
    }
  }

  // Start building from the target course
  console.log(`Starting graph build from target course: ${targetCourseId}`);
  await addCourse(targetCourseId);
  
  console.log(`Graph build complete - nodes: ${nodes.length}, edges: ${edges.length}`);
  
  return { nodes, edges };
}
