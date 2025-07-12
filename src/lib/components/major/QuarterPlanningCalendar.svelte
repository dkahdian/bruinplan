<!--
	Quarter Planning Calendar Component
	Displays quarters with courses and provides planning interface
-->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { get } from 'svelte/store';
	import { 
		courseSchedulesStore, 
		quarterLimitsStore, 
		schedulingService, 
		getCurrentQuarterCode, 
		getSmartQuarterRange,
		formatQuarterCode 
	} from '../../services/shared/schedulingService.js';
	import type { Major } from '../../types.js';
	import { getAllMajorCourses } from '../../services/data/loadMajors.js';
	import { courseMapStore } from '../../services/data/loadCourses.js';
	import QuarterDisplay from './QuarterDisplay.svelte';
	
	export let major: Major;
	
	const dispatch = createEventDispatcher();
	
	// Get all courses for this major
	$: allMajorCourses = getAllMajorCourses(major);
	
	// Get all available courses for searching (allow searching through all courses)
	$: availableCourses = Array.from(get(courseMapStore).values());
	
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
		const season = Math.floor(quarterCode / 100);
		const year = quarterCode % 100;
		
		switch (season) {
			case 1: return 200 + year; // Winter → Spring
			case 2: return 300 + year; // Spring → Summer
			case 3: return 400 + year; // Summer → Fall
			case 4: return 100 + (year + 1); // Fall → Winter (next year)
			default: return quarterCode + 1;
		}
	}
	
	function groupCoursesByQuarter(schedules: Record<string, number>, majorCourses: string[]): Record<number, string[]> {
		const grouped: Record<number, string[]> = {};
		
		// Initialize all quarters with empty arrays
		quarters.forEach(quarter => {
			grouped[quarter] = [];
		});
		
		// Group courses by their assigned quarters, only include courses from this major
		for (const [courseId, quarterCode] of Object.entries(schedules)) {
			if (majorCourses.includes(courseId) && quarterCode > 0 && quarterCode !== 1) {
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
	
	function handleRemoveCourse(event: CustomEvent<{ quarterCode: number, courseId: string }>) {
		const { quarterCode, courseId } = event.detail;
		// Unschedule the course (set to 0)
		schedulingService.scheduleCourse(courseId, 0);
	}
	
	function handleAddCourse(event: CustomEvent<{ quarterCode: number, courseId: string }>) {
		const { quarterCode, courseId } = event.detail;
		
		// Check if course is already scheduled for any quarter
		const currentSchedule = get(courseSchedulesStore);
		const currentQuarter = currentSchedule[courseId];
		
		if (currentQuarter && currentQuarter !== 0) {
			// Course is already scheduled, ask user if they want to move it
			const currentQuarterName = formatQuarterCode(currentQuarter);
			const newQuarterName = formatQuarterCode(quarterCode);
			
			if (confirm(`${courseId} is already scheduled for ${currentQuarterName}. Move to ${newQuarterName}?`)) {
				schedulingService.scheduleCourse(courseId, quarterCode);
			}
		} else {
			// Course is not scheduled, add it
			schedulingService.scheduleCourse(courseId, quarterCode);
		}
	}
	
	function handleNavigateToUnits() {
		// Navigate to units management page
		window.location.href = '/units';
	}
	
	function handleCourseHover(event: CustomEvent<{ courseId: string, show: boolean }>) {
		// For future tooltip implementation
		const { courseId, show } = event.detail;
		// TODO: Show/hide tooltip with course details
	}
</script>

<div class="quarter-planning-calendar overflow-y-auto h-[90vh]">
   <!-- Sticky Header -->
   <div class="sticky top-0 z-10 bg-white pb-2 mb-2 shadow-sm">
	   <h2 class="text-lg font-semibold mb-2">Quarter Planning</h2>
	   {#if showPerformanceWarning}
		   <div class="bg-yellow-50 border border-yellow-200 rounded p-2 text-sm text-yellow-800 mb-2">
			   ⚠️ Showing {quarterRange} quarters. Consider reducing the range for better performance.
		   </div>
	   {/if}
	   <!-- Slot for summary section -->
	   <slot name="summary" />
   </div>
	
	<!-- Quarters Display -->
	<div class="space-y-4">
		{#each quarters as quarterCode, index}
			<QuarterDisplay
				{quarterCode}
				courses={coursesByQuarter[quarterCode] || []}
				unitLimit={schedulingService.getQuarterLimit(quarterCode)}
				isLastQuarter={index === quarters.length - 1}
				canRemove={quarters.length > 1}
				availableCourses={availableCourses}
				on:remove-quarter={(e) => handleRemoveQuarter(e.detail)}
				on:remove-course={handleRemoveCourse}
				on:add-course={handleAddCourse}
				on:navigate-to-units={handleNavigateToUnits}
				on:course-hover={handleCourseHover}
			/>
		{/each}
	</div>
	
	<!-- Add Quarter Button -->
	<div class="mt-4">
		<button
			class="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors"
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
</style>
