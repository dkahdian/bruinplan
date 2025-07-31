<!--
	Quarter Planning Calendar Component
	Displays quarters with courses and provides planning interface
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { mobileSelectedCourseStore, scheduleCourseMobile } from '../../services/mobileSchedulingStore.js';
	import { 
		courseSchedulesStore, 
		schedulingService, 
		getCurrentQuarterCode, 
		getSmartQuarterRange,
		formatQuarterCode,
		initializeSchedulingService 
	} from '../../services/schedulingServices.js';
	import type { Major, Course } from '../../types.js';
	import { getAllMajorCourses } from '../../data-layer/api.js';
	import QuarterDisplay from './QuarterDisplay.svelte';
	
	export let major: Major;
	export let courseMap: Map<string, Course>;
	
	// Mobile detection
	let isMobile = false;
	onMount(() => {
		// Primarily use screen width to determine mobile vs desktop
		// Only fall back to touch detection if the screen width is ambiguous
		const screenWidth = window.matchMedia('(max-width: 768px)').matches;
		const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
		
		// Consider mobile only if screen is small OR if it's a medium screen with touch AND no mouse
		isMobile = screenWidth || (window.matchMedia('(max-width: 1024px)').matches && hasTouch && !window.matchMedia('(pointer: fine)').matches);
	});
	
	// Subscribe to the mobile selected course
	$: selectedCourseForMobile = $mobileSelectedCourseStore;
	
	// Function to check if a course is already in a specific quarter
	function isCourseInQuarter(courseId: string | null, quarterCode: number): boolean {
		if (!courseId) return false;
		const coursesInQuarter = coursesByQuarter[quarterCode] || [];
		return coursesInQuarter.includes(courseId);
	}
	
	// Function to handle quarter click on mobile
	function handleQuarterClick(quarterCode: number) {
		if (isMobile && selectedCourseForMobile) {
			scheduleCourseMobile(selectedCourseForMobile, quarterCode, schedulingService);
		}
	}
		
	// Get all courses for this major
	$: allMajorCourses = getAllMajorCourses(major);
	
	// Calculate quarter range - always start from current quarter
	$: currentQuarter = getCurrentQuarterCode();
	let quarterRange = 3; // Default to 3 quarters
	$: showPerformanceWarning = quarterRange > 12;
	
	// Update quarter range when schedules change
	$: {
		const newRange = getSmartQuarterRange($courseSchedulesStore);
		if (newRange > quarterRange) {
			quarterRange = newRange;
		}
	}

	onMount(async () => {
		// Initialize scheduling service to load localStorage data
		initializeSchedulingService();
		
		// Update quarter range based on existing schedules
		const newRange = getSmartQuarterRange(get(courseSchedulesStore));
		if (newRange > quarterRange) {
			quarterRange = newRange;
		}
	});
	
	// Generate quarters to display
	$: quarters = generateQuarters(currentQuarter, quarterRange);
	
	// Group courses by quarter
	$: coursesByQuarter = groupCoursesByQuarter($courseSchedulesStore, allMajorCourses);
	
	function generateQuarters(startQuarter: number, count: number): number[] {
		const quarters: number[] = [];
		let currentCode = startQuarter;
		
		for (let i = 0; i < count; i++) {
			quarters.push(currentCode);
			currentCode = getNextQuarterCode(currentCode);
		}
		
		return quarters;
	}
	
	function getNextQuarterCode(quarterCode: number): number {
		const year = Math.floor(quarterCode / 10);
		const season = quarterCode % 10;

		switch (season) {
			case 1: return year * 10 + 2; // Winter → Spring
			case 2: return year * 10 + 3; // Spring → Summer
			case 3: return year * 10 + 4; // Summer → Fall
			case 4: return (year + 1) * 10 + 1; // Fall → Winter (next year)
			default: return quarterCode + 1;
		}
	}
	
	function groupCoursesByQuarter(schedules: Record<string, number>, majorCourses: string[]): Record<number, string[]> {
		const grouped: Record<number, string[]> = {};
		
		// Initialize all quarters with empty arrays
		quarters.forEach(quarter => {
			grouped[quarter] = [];
		});
		
		// Group courses by their assigned quarters
		for (const [courseId, quarterCode] of Object.entries(schedules)) {
			if (quarterCode > 0 && quarterCode !== 1) {
				// Only include courses that are scheduled (not completed=1 or unscheduled=0)
				if (!grouped[quarterCode]) {
					grouped[quarterCode] = [];
				}
				grouped[quarterCode].push(courseId);
			}
		}
		
		return grouped;
	}
		function handleRemoveQuarter(quarterCode: number) {
		// Remove the quarter from our range (only if it's the last one)
		if (quarterCode === quarters[quarters.length - 1]) {
			quarterRange = Math.max(1, quarterRange - 1);
		}
	}

	function handleAddQuarter() {
		quarterRange = quarterRange + 1;
	}
</script>

<div class="quarter-planning-calendar {isMobile ? 'overflow-visible h-auto' : 'overflow-y-auto h-[90vh]'}">
   <!-- Sticky Header -->
   <div class="{isMobile ? 'bg-white pb-1 mb-1' : 'sticky top-0 z-10 bg-white pb-2 mb-2 shadow-sm'}">
	   <h2 class="{isMobile ? 'text-base font-semibold mb-1' : 'text-lg font-semibold mb-2'}">Quarter Planning</h2>
	   {#if showPerformanceWarning}
		   <div class="bg-yellow-50 border border-yellow-200 rounded text-yellow-800 {isMobile ? 'p-1 text-xs mb-1' : 'p-2 text-sm mb-2'}">
			   ⚠️ Showing {quarterRange} quarters. Consider reducing the range for better performance.
		   </div>
	   {/if}
	   <!-- Slot for summary section -->
	   <slot name="summary" />
   </div>
	
	<!-- Quarters Display -->
	<div class="{isMobile ? 'space-y-2' : 'space-y-4'}">
		{#each quarters as quarterCode, index}
			<QuarterDisplay
				{quarterCode}
				{courseMap}
				courses={coursesByQuarter[quarterCode] || []}
				isLastQuarter={index === quarters.length - 1}
				canRemove={quarters.length > 1}
				onRemoveQuarter={handleRemoveQuarter}
				onMobileQuarterClick={isMobile ? handleQuarterClick : undefined}
				isMobileSelected={isMobile && selectedCourseForMobile !== null && !isCourseInQuarter(selectedCourseForMobile, quarterCode)}
				{isMobile}
			/>
		{/each}
	</div>
	
	<!-- Add Quarter Button -->
	<div class="{isMobile ? 'mt-2' : 'mt-4'}">
		<button
			class="w-full border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors
				   {isMobile ? 'py-1 px-2 text-sm' : 'py-2 px-4'}"
			on:click={handleAddQuarter}
		>
			+ Add a quarter
		</button>
	</div>
</div>

<style>
	.quarter-planning-calendar {
		width: 100%;
		max-width: 320px;
	}
	
	/* Mobile optimizations */
	@media (max-width: 768px) {
		.quarter-planning-calendar {
			max-width: 100%; /* Take full width on mobile */
			height: auto; /* Remove fixed height on mobile */
		}
	}
</style>
