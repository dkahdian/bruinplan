<script lang="ts">
  import { onMount } from 'svelte';
  import PrerequisiteGraph from '../../../lib/PrerequisiteGraph.svelte';
  import CourseDetails from '../../../lib/components/course/CourseDetails.svelte';
  import ValidationIndicator from '../../../lib/components/shared/ValidationIndicator.svelte';
  import ResizeHandle from '../../../lib/components/shared/ResizeHandle.svelte';
  import { getCourseById } from '../../../lib/data-layer/api.js';
  import { 
    schedulingService, 
    courseCompletionService, 
    initializeSchedulingService,
    validationService,
    validationErrorsStore
  } from '../../../lib/services/schedulingServices.js';
  import type { Course, ValidationError } from '../../../lib/types.js';

  export let data: { 
    courseId: string; 
    showWarnings: boolean; 
  };

  let course: Course | null = null;
  let courseMap = new Map<string, Course>();
  let graphWidthPercent = 65; // Default: 65% for graph, 35% for sidebar
  let resizeContainer: HTMLDivElement;
  let userCompletedCourses = new Set<string>();
  let validationErrors: ValidationError[] = [];

  // Subscribe to validation errors
  $: validationErrors = $validationErrorsStore;

  // Load course and initialize services
  onMount(async () => {
    initializeSchedulingService();
    
    try {
      const loadedCourse = await getCourseById(data.courseId);
      if (loadedCourse) {
        course = loadedCourse;
        courseMap.set(loadedCourse.id, loadedCourse);
      }
    } catch (error) {
      console.error('Failed to load course:', error);
    }

    // Get user's completed courses
    userCompletedCourses = courseCompletionService.getCompletedCoursesSet();
    
    // Update validation to show warnings
    validationService.updateValidation();
  });

  // Handle resize events
  function handleResize(event: CustomEvent<{ newWidthPercent: number }>) {
    graphWidthPercent = event.detail.newWidthPercent;
  }

  // Handle course completion toggle
  function onCourseCompletionToggle(courseId: string) {
    if (courseCompletionService.isCompleted(courseId)) {
      schedulingService.markCourseIncomplete(courseId);
    } else {
      schedulingService.markCourseCompleted(courseId);
    }
    userCompletedCourses = courseCompletionService.getCompletedCoursesSet();
    
    // Update validation to show warnings
    validationService.updateValidation();
  }

  // Handle prerequisite click
  function onPrerequisiteClick(courseId: string) {
    // Navigate to the clicked course's prerequisite page
    window.location.href = `/courses/${courseId}`;
  }
</script>

<svelte:head>
  <title>Prerequisites for {data.courseId}</title>
</svelte:head>

<div class="prerequisite-layout" bind:this={resizeContainer}>
  <!-- Main graph area -->
  <div class="graph-section" style="width: {graphWidthPercent}%;">
    <PrerequisiteGraph courseId={data.courseId} />
  </div>

  <!-- Resize handle -->
  <ResizeHandle {resizeContainer} on:resize={handleResize} />

  <!-- Sidebar with course details -->
  <div class="sidebar-section" style="width: {100 - graphWidthPercent}%;">
    <div class="sidebar-content">
      {#if course}
        <!-- Course header with validation -->
        <div class="course-header p-4 border-b border-gray-200">
          <h2 class="text-xl font-bold mb-2">{course.id}</h2>
          <ValidationIndicator errors={validationErrors} courseId={course.id} />
        </div>
        
        <!-- Course details -->
        <div class="course-details flex-1">
          <CourseDetails
            displayedCourse={course}
            selectedCourse={course}
            isTransitioning={false}
            {userCompletedCourses}
            {courseMap}
            {onCourseCompletionToggle}
            {onPrerequisiteClick}
          />
        </div>
      {:else}
        <div class="loading-message">Loading course details...</div>
      {/if}
    </div>
  </div>
</div>

<style>
  .prerequisite-layout {
    display: flex;
    height: 100vh;
    width: 100%;
    background: #f9fafb;
  }

  .graph-section {
    position: relative;
    height: 100%;
    min-width: 300px;
  }

  .sidebar-section {
    height: 100%;
    min-width: 250px;
    background: white;
    border-left: 1px solid #e5e7eb;
    display: flex;
    flex-direction: column;
  }

  .sidebar-content {
    flex: 1;
    overflow: hidden;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .course-header {
    flex-shrink: 0;
  }

  .course-details {
    flex: 1;
    overflow: hidden;
  }

  .loading-message {
    padding: 2rem;
    text-align: center;
    color: #6b7280;
  }
</style>
