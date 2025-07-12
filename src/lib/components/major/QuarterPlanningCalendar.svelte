<!--
	Quarter Planning Calendar Component
	Displays quarters with courses and provides planning interface
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { 
		courseSchedulesStore, 
		schedulingService, 
		getCurrentQuarterCode, 
		getSmartQuarterRange,
		formatQuarterCode,
		initializeSchedulingService 
	} from '../../services/shared/schedulingService.js';
	import type { Major } from '../../types.js';
	import { getAllMajorCourses } from '../../services/data/loadMajors.js';
	import { courseMapStore, loadCourses } from '../../services/data/loadCourses.js';
	import QuarterDisplay from './QuarterDisplay.svelte';
	
	export let major: Major;
		
	// Get all courses for this major
	$: allMajorCourses = getAllMajorCourses(major);
	
	// Get all available courses for searching (reactive to courseMapStore changes)
	$: availableCourses = Array.from($courseMapStore.values());
	
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
		
		// Load courses if not already loaded
		if ($courseMapStore.size === 0) {
			try {
				await loadCourses();
			} catch (error) {
				console.error('Failed to load courses on mount:', error);
			}
		}
		
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
				isLastQuarter={index === quarters.length - 1}
				canRemove={quarters.length > 1}
				availableCourses={availableCourses}
				onRemoveQuarter={handleRemoveQuarter}
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
