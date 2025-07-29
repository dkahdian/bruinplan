<!--
	Individual Major Display Page
	Shows detailed major requirements organized by sections
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import type { Major, Course } from '../../../lib/types.js';
	import { getAllMajorCourses, calculateRequiredCourseCount, loadMajorCourses } from '../../../lib/data-layer/api.js';
	import { courseMapStore } from '../../../lib/services/shared/coursesStore.js';
	import { 
		schedulingService, 
		completedCoursesStore,
		courseSchedulesStore,
		initializeSchedulingService,
		courseCompletionService,
		validationService
	} from '../../../lib/services/schedulingServices.js';
	import { MajorSection, QuarterPlanningCalendar } from '../../../lib/components/major/index.js';
	import Footer from '../../../lib/components/shared/Footer.svelte';
	
	export let data: { major: Major; majorId: string };
	
	$: major = data.major;
	$: majorId = data.majorId;
	
	// Course map for this major's courses only  
	let majorCourseMap = new Map<string, Course>();
	let coursesLoaded = false;
	
	// Get all courses for this major
	$: allCourses = getAllMajorCourses(major);
	
	// Calculate actual required course count (accounts for group needs)
	$: totalRequiredCourses = calculateRequiredCourseCount(major);
	
	// Load completion data and initialize course map for this major only
	onMount(async () => {
		initializeSchedulingService();
		
		try {
			// Load only the courses needed for this specific major
			majorCourseMap = await loadMajorCourses(major);
			
			// Also populate the global course map store for validation services
			courseMapStore.set(majorCourseMap);
			
			coursesLoaded = true;
		} catch (error) {
			console.error('Failed to load course data for major:', error);
			coursesLoaded = true; // Set to true even on error to show the UI
		}
	});

	// Helper function to check if a course is effectively completed using our local course map
	function isCourseEffectivelyCompleted(courseId: string): boolean {
		// Check if the course itself is completed
		if (courseCompletionService.isCompleted(courseId)) {
			return true;
		}
		
		// Check if any equivalent course is completed
		const course = majorCourseMap.get(courseId);
		const equivalentCourses = course?.equivalentCourses || [];
		
		return equivalentCourses.some(equivalent => courseCompletionService.isCompleted(equivalent));
	}

	// Calculate actual completion progress using the local course map
	$: actualCompletedCourses = coursesLoaded ? (() => {
		let actualCompleted = 0;
		
		function countActualCompleted(requirements: any[]) {
			for (const req of requirements) {
				if (req.type === 'course') {
					// Use our local course map for equivalent checking
					if (isCourseEffectivelyCompleted(req.courseId)) {
						actualCompleted++;
					}
				} else if (req.type === 'group') {
					// For groups, count completed courses up to the needs count
					let groupCompleted = 0;
					for (const option of req.options) {
						if (option.type === 'course') {
							if (isCourseEffectivelyCompleted(option.courseId)) {
								groupCompleted++;
							}
						}
					}
					// Only count up to the required number for this group
					actualCompleted += Math.min(groupCompleted, req.needs);
				}
			}
		}
		
		for (const section of major.sections) {
			countActualCompleted(section.requirements);
		}
		
		return actualCompleted;
	})() : 0;
	
	// Calculate total completed courses across all majors
	$: totalGlobalCompleted = $completedCoursesStore.size;
	
	// Calculate total planned courses (scheduled but not completed)
	$: totalGlobalPlanned = (() => {
		let plannedCount = 0;
		for (const [courseId, quarterCode] of Object.entries($courseSchedulesStore)) {
			if (quarterCode > 0 && !$completedCoursesStore.has(courseId)) {
				plannedCount++;
			}
		}
		return plannedCount;
	})();

	// Global drop zone for removing courses from plan
	let isGlobalDragOver = false;
	
	function handleGlobalDrop(event: DragEvent) {
		event.preventDefault();
		isGlobalDragOver = false;
		
		// Try to get course data
		const courseId = event.dataTransfer?.getData('application/x-bruinplan-course') || 
		                 event.dataTransfer?.getData('text/plain');
		
		if (courseId) {
			// Remove course from plan (set to 0 = unscheduled)
			schedulingService.scheduleCourse(courseId, 0);
		}
	}
	
	function handleGlobalDragOver(event: DragEvent) {
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
	}
	
	function handleGlobalDragEnter(event: DragEvent) {
		event.preventDefault();
		isGlobalDragOver = true;
	}
	
	function handleGlobalDragLeave(event: DragEvent) {
		event.preventDefault();
		// Only set to false if we're actually leaving the main content area
		const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
		const x = event.clientX;
		const y = event.clientY;
		
		if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
			isGlobalDragOver = false;
		}
	}
</script>

<svelte:head>
	<title>{major.name} - BruinPlan</title>
	<meta name="description" content="Requirements and prerequisites for {major.name} at UCLA" />
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<!-- Major Header -->
	<div class="mb-8">
		<nav class="text-sm breadcrumbs mb-4">
			<a href="{base}/majors" class="text-blue-600 hover:text-blue-800">← All Majors</a>
		</nav>
		
		<h1 class="text-3xl font-bold mb-4">{major.name}</h1>
		
		<div class="bg-gray-50 rounded-lg p-6 mb-6">
			<p class="text-lg mb-4">{major.overview}</p>
			
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
				<div>
					<strong>College:</strong>
					<br>{major.college}
				</div>
				<div>
					<strong>Department:</strong>
					<br>{major.department}
				</div>
				<div>
					<strong>Degree Level:</strong>
					<br>{major.degreeLevel}
				</div>
				<div>
					<strong>Degree:</strong>
					<br>{major.degreeObjective}
				</div>
			</div>
		</div>
		
		<!-- Quick Stats -->
		<div class="flex flex-wrap items-center justify-between gap-4 mb-6">
			<div class="flex flex-wrap gap-4 text-sm text-gray-600">
				<span>{allCourses.length} total course references</span>
				<span>{major.sections.length} sections</span>
				<span>{actualCompletedCourses}/{totalRequiredCourses} courses required</span>
			</div>
		</div>
	</div>
	
	<!-- Main Content - List View -->
	<div class="flex gap-6">
		<!-- Main Content with global drop zone -->
		<div 
			class="flex-1 space-y-8 relative {isGlobalDragOver ? 'global-drop-zone' : ''}"
			on:drop={handleGlobalDrop}
			on:dragover={handleGlobalDragOver}
			on:dragenter={handleGlobalDragEnter}
			on:dragleave={handleGlobalDragLeave}
			role="region"
			aria-label="Course removal drop zone"
		>
			{#if isGlobalDragOver}
				<!-- Invisible drop zone overlay that still captures events -->
				<div class="absolute inset-0 z-10 pointer-events-none">
				</div>
			{/if}
			
			{#each major.sections as section, index}
				<MajorSection 
					{section}
					courseMap={majorCourseMap}
					onToggleCompletion={schedulingService.toggleCourseCompletion.bind(schedulingService)}
					sectionIndex={index}
				/>
			{/each}
		</div>
		
		<!-- Quarter Planning Sidebar -->
		<div class="w-80 flex-shrink-0">
			<div class="sticky top-4">
				<QuarterPlanningCalendar {major} courseMap={majorCourseMap} />
			</div>
		</div>
	</div>
	

	
	<!-- Completion Data Management (for testing/admin) -->
	{#if totalGlobalCompleted > 0 || totalGlobalPlanned > 0}
		<div class="mt-6 p-3 bg-gray-50 border border-gray-200 rounded text-sm">
			<div class="flex items-center justify-between">
				<span class="text-gray-600">
					Course data saved locally: {totalGlobalCompleted} completed, {totalGlobalPlanned} planned
				</span>
				<button
					class="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs transition-colors"
					on:click={schedulingService.clearAllSchedules.bind(schedulingService)}
					title="Clear all completion and schedule data"
				>
					Reset All
				</button>
			</div>
		</div>
	{/if}
</div>

<Footer />

<style>
	.global-drop-zone {
		transition: all 0.2s ease;
	}
</style>