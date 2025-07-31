<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import PrerequisiteGraph from '../../../lib/components/graph/PrerequisiteGraph.svelte';
  import CourseDetails from '../../../lib/components/course/CourseDetails.svelte';
  import CourseNavigationHeader from '../../../lib/components/course/CourseNavigationHeader.svelte';
  import ResizeHandle from '../../../lib/components/shared/ResizeHandle.svelte';

  import { 
    schedulingService, 
    courseCompletionService, 
    initializeSchedulingService,
    validationService,
    validationErrorsStore
  } from '../../../lib/services/schedulingServices.js';
  import type { Course, ValidationError } from '../../../lib/types.js';

  export let data: { 
    course: Course;
    courseId: string; 
    showWarnings: boolean; 
  };

  let course: Course = data.course;
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

  // React to changes in course data from page loader
  $: if (data.course) {
    course = data.course;
    courseMap.set(course.id, course);
    // Reset selected course when loading new course
    selectedCourse = null;
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
  <title>{course.id} - {course.title} | BruinPlan</title>
  <meta name="description" content="View prerequisites for {course.id} - {course.title} at UCLA. Interactive prerequisite graph and course planning for {course.units} unit course." />
  <meta name="keywords" content="UCLA, {course.id}, {course.title}, prerequisites, course planning, BruinPlan" />
  <link rel="canonical" href="https://bruinplan.com/courses/{course.id.replace(/[^A-Z0-9]/g, '')}" />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://bruinplan.com/courses/{course.id.replace(/[^A-Z0-9]/g, '')}" />
  <meta property="og:title" content="{course.id} - {course.title} Prerequisites" />
  <meta property="og:description" content="Interactive prerequisite visualization for {course.id} - {course.title} at UCLA" />
  <meta property="og:image" content="https://bruinplan.com/og-image.png" />
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image" />
  <meta property="twitter:url" content="https://bruinplan.com/courses/{course.id.replace(/[^A-Z0-9]/g, '')}" />
  <meta property="twitter:title" content="{course.id} - {course.title} Prerequisites" />
  <meta property="twitter:description" content="Interactive prerequisite visualization for {course.id} - {course.title} at UCLA" />
  <meta property="twitter:image" content="https://bruinplan.com/og-image.png" />
  
  <!-- JSON-LD Structured Data -->
  <script type="application/ld+json">
  {JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Course",
    "name": `${course.id} - ${course.title}`,
    "courseCode": course.id,
    "description": course.description || `${course.title} course at UCLA`,
    "provider": {
      "@type": "EducationalOrganization",
      "name": "University of California, Los Angeles",
      "alternateName": "UCLA"
    },
    "educationalCredentialAwarded": `${course.units} units`,
    "url": `https://bruinplan.com/courses/${course.id.replace(/[^A-Z0-9]/g, '')}`,
    "teaches": course.title,
    "coursePrerequisites": course.requisites?.length > 0 ? course.requisites.map(req => req.description || "See course details").join("; ") : "None listed"
  })}
  </script>
  
  <!-- BreadcrumbList for navigation -->
  <script type="application/ld+json">
  {JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://bruinplan.com/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Courses",
        "item": "https://bruinplan.com/courses"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": `${course.id} - ${course.title}`,
        "item": `https://bruinplan.com/courses/${course.id.replace(/[^A-Z0-9]/g, '')}`
      }
    ]
  })}
  </script>
</svelte:head>

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
    <!-- Course Navigation Header (only on desktop) -->
    <div class="desktop-header">
      <CourseNavigationHeader 
        courseId={data.courseId}
        on:navigate={onNavigate}
      />
    </div>
    
    <div class="sidebar-content">
      <!-- Course Navigation Header (only on mobile) -->
      <div class="mobile-header">
        <CourseNavigationHeader 
          courseId={data.courseId}
          on:navigate={onNavigate}
        />
      </div>
      
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

  .desktop-header {
    display: block;
  }

  .mobile-header {
    display: none;
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

  /* Mobile responsive design - stacked layout on small screens */
  @media (max-width: 768px) {
    .course-page-container {
      height: 100vh; /* Full viewport height - no header deduction since it's inside */
      overflow: hidden; /* Prevent overall page scrolling */
    }

    .prerequisite-layout {
      flex-direction: column; /* Stack vertically */
      height: 100%;
      overflow: hidden;
    }

    .desktop-header {
      display: none; /* Hide desktop header on mobile */
    }

    .mobile-header {
      display: block; /* Show mobile header */
      flex-shrink: 0; /* Don't shrink the header */
    }

    .sidebar-section {
      height: 50% !important; /* Course info takes top 50% */
      width: 100% !important; /* Full width - override inline style */
      min-width: unset;
      border-left: none;
      border-bottom: 1px solid #e5e7eb; /* Add border between sections */
      order: 1; /* Show first (above graph) */
    }

    .sidebar-content {
      height: 100%;
      overflow-y: auto; /* Allow scrolling in course info */
      -webkit-overflow-scrolling: touch; /* Better iOS scrolling */
      display: flex;
      flex-direction: column;
    }

    .course-details {
      overflow: visible; /* Remove overflow hidden for mobile scrolling */
      flex: 1; /* Take remaining space after header */
    }

    .graph-section {
      height: 50% !important; /* Graph takes bottom 50% */
      width: 100% !important; /* Full width - override inline style */
      min-width: unset;
      order: 2; /* Show second (below course info) */
    }
  }

  /* Hide resize handle on mobile */
  @media (max-width: 768px) {
    :global(.resize-handle) {
      display: none;
    }
  }
</style>
