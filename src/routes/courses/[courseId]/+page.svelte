<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import PrerequisiteGraph from '../../../lib/components/graph/PrerequisiteGraph.svelte';
  import CourseDetails from '../../../lib/components/course/CourseDetails.svelte';
  import CourseNavigationHeader from '../../../lib/components/course/CourseNavigationHeader.svelte';
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
  let selectedCourse: Course | null = null; // Track the selected course from graph
  let courseMap = new Map<string, Course>();
  let graphWidthPercent = 65; // Default: 65% for graph, 35% for sidebar
  let resizeContainer: HTMLDivElement;
  let userCompletedCourses = new Set<string>();
  let validationErrors: ValidationError[] = [];
  let showWarnings = data.showWarnings || false;
  let showCompletedCourses = true;

  // Subscribe to validation errors
  $: validationErrors = $validationErrorsStore;

  // React to changes in courseId - this makes the page load new course data when navigating
  $: if (data.courseId) {
    loadCourse(data.courseId);
  }

  // Load course data
  async function loadCourse(courseId: string) {
    try {
      const loadedCourse = await getCourseById(courseId);
      if (loadedCourse) {
        course = loadedCourse;
        courseMap.set(loadedCourse.id, loadedCourse);
        // Reset selected course when loading new course
        selectedCourse = null;
      }
    } catch (error) {
      console.error('Failed to load course:', error);
    }
  }

  // Load course and initialize services
  onMount(async () => {
    initializeSchedulingService();
    
    // Get user's completed courses
    userCompletedCourses = courseCompletionService.getCompletedCoursesSet();
    
    // Update validation to show warnings
    validationService.updateValidation();
  });

  // Handle resize events
  function handleResize(event: { newWidthPercent: number }) {
    graphWidthPercent = event.newWidthPercent;
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

  // Handle quarter change
  function onQuarterChange(courseId: string, quarterCode: number) {
    schedulingService.scheduleCourse(courseId, quarterCode);
    
    // Update validation to show warnings
    validationService.updateValidation();
  }

  // Handle prerequisite click
  function onPrerequisiteClick(courseId: string) {
    // Navigate to the clicked course's prerequisite page using proper URL format
    const urlCourseId = courseId.replace(/[^A-Z0-9]/g, '');
    goto(`${base}/courses/${urlCourseId}`);
  }

  // Handle course selection from graph
  function onCourseSelect(course: Course) {
    selectedCourse = course;
    courseMap.set(selectedCourse.id, selectedCourse);
  }

  // Handle background click to reset selection
  function onBackgroundClick() {
    selectedCourse = null;
  }

  // Handle navigation from the header search (no longer needed since navigation is handled internally)
  function onNavigate(event: CustomEvent<string>) {
    // This is no longer used since CourseNavigationHeader handles navigation internally
  }
</script>

<svelte:head>
  <title>Prerequisites for {data.courseId}</title>
</svelte:head>

<!-- Course Navigation Header -->
<CourseNavigationHeader 
  courseId={data.courseId}
  on:navigate={onNavigate}
/>

<div class="course-page-container">
  <div class="prerequisite-layout" bind:this={resizeContainer}>
  <!-- Main graph area -->
  <div class="graph-section" style="width: {graphWidthPercent}%;">
    {#key data.courseId}
      <PrerequisiteGraph 
        courseId={data.courseId}
        {showWarnings}
        {showCompletedCourses}
        {userCompletedCourses}
        oncourseselect={onCourseSelect}
        onbackgroundclick={onBackgroundClick}
      />
    {/key}
  </div>

  <!-- Resize handle -->
  <ResizeHandle {resizeContainer} onresize={handleResize} />

  <!-- Sidebar with course details -->
  <div class="sidebar-section" style="width: {100 - graphWidthPercent}%;">
    <div class="sidebar-content">
      {#if course}
        <!-- Course details -->
        <div class="course-details flex-1">
          <CourseDetails
            displayedCourse={selectedCourse || course}
            {selectedCourse}
            isTransitioning={false}
            {userCompletedCourses}
            {courseMap}
            {onCourseCompletionToggle}
            {onQuarterChange}
            {onPrerequisiteClick}
          />
        </div>
      {:else}
        <div class="loading-message">Loading course details...</div>
      {/if}
    </div>
  </div>
</div>
</div>

<style>
  .course-page-container {
    height: calc(100vh - 65px); /* Account for navigation header */
    overflow: hidden; /* Prevent scrollbars for this specific page layout */
  }

  .prerequisite-layout {
    display: flex;
    height: 100%;
    width: 100%;
    background: #f9fafb;
    overflow: hidden; /* Prevent any overflow that might cause scrollbars */
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
