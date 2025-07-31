<!--
	Individual Major Display Page
	Shows detailed major requirements organized by sections
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import type { Major, Course } from '../../../lib/types.js';
	import { getAllMajorCourses, calculateRequiredCourseCount, loadMajorCourses, getCourseById } from '../../../lib/data-layer/api.js';
	import { courseMapStore } from '../../../lib/services/shared/coursesStore.js';
	import { recentlyVisitedMajorsService } from '../../../lib/services/shared/recentlyVisitedMajors.js';
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
	
	// Function to load additional scheduled courses that aren't in the major
	async function loadAdditionalScheduledCourses(schedules: Record<string, number>) {
		const scheduledCourseIds = Object.keys(schedules).filter(courseId => 
			schedules[courseId] > 0 && !majorCourseMap.has(courseId)
		);
		
		if (scheduledCourseIds.length === 0) return;
		
		const newCourseMap = new Map(majorCourseMap);
		
		for (const courseId of scheduledCourseIds) {
			try {
				const course = await getCourseById(courseId);
				if (course) {
					newCourseMap.set(courseId, course);
				}
			} catch (error) {
				console.warn(`Failed to load course ${courseId}:`, error);
			}
		}
		
		// Trigger reactivity by creating a new Map
		majorCourseMap = newCourseMap;
	}
	
	// Load completion data and initialize course map for this major only
	onMount(async () => {
		initializeSchedulingService();
		
		// Track this major as recently visited
		recentlyVisitedMajorsService.addRecentMajor({
			id: majorId,
			name: major.name,
			school: major.college,
			department: major.department
		});
		
		try {
			// Load only the courses needed for this specific major
			majorCourseMap = await loadMajorCourses(major);
			
			// Load additional scheduled courses that aren't part of this major
			await loadAdditionalScheduledCourses($courseSchedulesStore);
			
			// Also populate the global course map store for validation services
			courseMapStore.set(majorCourseMap);
			
			coursesLoaded = true;
		} catch (error) {
			console.error('Failed to load course data for major:', error);
			coursesLoaded = true; // Set to true even on error to show the UI
		}
	});
	
	// Reactively load new courses when schedules change
	$: if (coursesLoaded && $courseSchedulesStore) {
		loadAdditionalScheduledCourses($courseSchedulesStore).then(() => {
			// Update the global store with new courses (majorCourseMap is already updated in the function)
			courseMapStore.set(new Map(majorCourseMap));
		});
	}

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
	<title>{major.name} - UCLA Major Requirements | BruinPlan</title>
	<meta name="description" content="Complete requirements and course planning for {major.name} at UCLA. Track progress, view prerequisites, and plan your academic path." />
	<meta name="keywords" content="UCLA, {major.name}, major requirements, course planning, {major.college}, {major.department}, BruinPlan" />
	<link rel="canonical" href="https://bruinplan.com/majors/{majorId}" />
	
	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://bruinplan.com/majors/{majorId}" />
	<meta property="og:title" content="{major.name} - UCLA Major Requirements" />
	<meta property="og:description" content="Complete requirements and course planning for {major.name} at UCLA" />
	<meta property="og:image" content="https://bruinplan.com/og-image.png" />
	
	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content="https://bruinplan.com/majors/{majorId}" />
	<meta property="twitter:title" content="{major.name} - UCLA Major Requirements" />
	<meta property="twitter:description" content="Complete requirements and course planning for {major.name} at UCLA" />
	<meta property="twitter:image" content="https://bruinplan.com/og-image.png" />
	
	<!-- JSON-LD Structured Data -->
	<script type="application/ld+json">
	{JSON.stringify({
		"@context": "https://schema.org",
		"@type": "EducationalOccupationalProgram",
		"name": major.name,
		"description": major.overview || `${major.name} program at UCLA`,
		"provider": {
			"@type": "EducationalOrganization",
			"name": "University of California, Los Angeles",
			"alternateName": "UCLA",
			"department": {
				"@type": "EducationalOrganization",
				"name": major.department,
				"parentOrganization": {
					"@type": "EducationalOrganization",
					"name": major.college
				}
			}
		},
		"educationalCredentialAwarded": major.degreeObjective,
		"educationalProgramMode": "Full-time",
		"url": `https://bruinplan.com/majors/${majorId}`,
		"applicationDeadline": "varies by term"
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
				"name": "Majors",
				"item": "https://bruinplan.com/majors"
			},
			{
				"@type": "ListItem",
				"position": 3,
				"name": major.name,
				"item": `https://bruinplan.com/majors/${majorId}`
			}
		]
	})}
	</script>
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
	</div>
	
	<!-- Main Content - List View -->
	<div class="major-layout">
		<!-- Main Content with global drop zone -->
		<div 
			class="main-content {isGlobalDragOver ? 'global-drop-zone' : ''}"
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
					{majorId}
				/>
			{/each}
		</div>
		
		<!-- Quarter Planning Sidebar -->
		<div class="sidebar">
			<div class="sidebar-sticky">
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

<!-- Mobile spacing after footer -->
<div class="mobile-footer-spacing"></div>

<style>
	.global-drop-zone {
		transition: all 0.2s ease;
	}

	/* Desktop layout - default flex behavior */
	.major-layout {
		display: flex;
		gap: 1.5rem;
	}

	.main-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2rem;
		position: relative;
	}

	.sidebar {
		width: 20rem;
		flex-shrink: 0;
	}

	.sidebar-sticky {
		position: sticky;
		top: 1rem;
	}

	/* Mobile responsive design - stacked layout on small screens */
	@media (max-width: 768px) {
		.major-layout {
			flex-direction: column;
			gap: 0;
			min-height: 100vh; /* Use min-height instead of fixed height */
			position: relative;
		}

		.main-content {
			flex: 1;
			/* Remove overflow-y: auto to allow unified scrolling */
			padding-bottom: 0; /* Remove bottom padding - let footer come up naturally */
			-webkit-overflow-scrolling: touch; /* Better iOS scrolling */
		}

		.sidebar {
			width: 100vw; /* Full screen width */
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			height: 50vh; /* Exactly 50% of viewport height */
			z-index: 20;
			background: white;
			border-top: 2px solid #e5e7eb;
			border-left: none;
			box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1);
			display: flex;
			flex-direction: column;
		}

		.sidebar-sticky {
			position: static; /* Remove sticky positioning on mobile */
			flex: 1; /* Allow to grow and fill available space */
			min-height: 0; /* Allow shrinking */
			padding: 0.5rem; /* Reduced padding for mobile */
			overflow-y: auto; /* Add scrolling back for quarterly planner */
			-webkit-overflow-scrolling: touch; /* Better iOS scrolling */
		}

		/* Reduce container padding on mobile */
		.container {
			padding-left: 0.5rem !important;
			padding-right: 0.5rem !important;
			padding-bottom: 1rem !important; /* Add bottom padding to prevent footer from hiding behind sidebar */
		}

		/* Hide drag/drop functionality on mobile by making drop zones less prominent */
		.global-drop-zone {
			/* Keep functionality but reduce visual feedback on mobile */
			transition: none;
		}

		/* Add spacing after footer on mobile to account for fixed quarter planner */
		.mobile-footer-spacing {
			height: calc(50vh + 2rem); /* Space for quarterly planner plus extra padding */
		}
	}

	/* Hide mobile footer spacing on desktop */
	.mobile-footer-spacing {
		display: none;
	}

	@media (max-width: 768px) {
		.mobile-footer-spacing {
			display: block;
		}
	}
</style>