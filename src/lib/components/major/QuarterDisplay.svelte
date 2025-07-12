<!--
	Quarter Display Component
	Shows a single quarter with its courses and unit information
-->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { formatQuarterCode } from '../../services/shared/schedulingService.js';
	import { get } from 'svelte/store';
	import { courseMapStore } from '../../services/data/loadCourses.js';
	
	export let quarterCode: number;
	export let courses: string[] = [];
	export let unitLimit: number = 18;
	export let isLastQuarter: boolean = false;
	export let canRemove: boolean = true;
	
	const dispatch = createEventDispatcher();
	
	// Calculate total units for this quarter
	$: totalUnits = courses.reduce((sum, courseId) => {
		const courseMap = get(courseMapStore);
		const course = courseMap.get(courseId);
		return sum + (course?.units || 0);
	}, 0);
	
	// Format quarter display
	$: quarterName = formatQuarterCode(quarterCode);
	
	// Determine if we're exceeding the unit limit
	$: exceedsLimit = totalUnits > unitLimit;
	
	function handleRemoveQuarter() {
		if (canRemove) {
			dispatch('remove-quarter', quarterCode);
		}
	}
	
	function handleUnitLimitClick() {
		// Redirect to units management page
		dispatch('navigate-to-units');
	}
	
	function handleCourseClick(courseId: string) {
		// For future tooltip implementation
		dispatch('course-hover', { courseId, show: true });
	}
	
	function handleCourseRemove(courseId: string) {
		dispatch('remove-course', { quarterCode, courseId });
	}
</script>

<div class="quarter-display border rounded-lg p-4 bg-white shadow-sm">
	<!-- Quarter Header -->
	<div class="flex items-center justify-between mb-3">
		<div class="flex items-center gap-2">
			<h3 class="font-semibold text-gray-900">{quarterName}</h3>
			{#if canRemove && isLastQuarter}
				<button
					class="text-gray-400 hover:text-red-500 transition-colors"
					on:click={handleRemoveQuarter}
					title="Remove this quarter"
					aria-label="Remove this quarter"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
					</svg>
				</button>
			{/if}
		</div>
		
		<!-- Unit Count Display -->
		<button
			class="text-sm px-2 py-1 rounded transition-colors
				{exceedsLimit ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
			on:click={handleUnitLimitClick}
			title="Click to manage unit limits"
		>
			{totalUnits}/{unitLimit}
		</button>
	</div>
	
	<!-- Course List -->
	<div class="space-y-2">
		{#each courses as courseId}
			{@const courseMap = get(courseMapStore)}
			{@const course = courseMap.get(courseId)}
			<div 
				class="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors cursor-pointer"
				on:click={() => handleCourseClick(courseId)}
				on:keydown={(e) => e.key === 'Enter' && handleCourseClick(courseId)}
				tabindex="0"
				role="button"
			>
				<div class="flex items-center gap-2">
					<span class="font-medium text-sm">{courseId}</span>
					{#if course}
						<span class="text-xs text-gray-600">({course.units} units)</span>
					{/if}
				</div>
				<button
					class="text-gray-400 hover:text-red-500 transition-colors"
					on:click|stopPropagation={() => handleCourseRemove(courseId)}
					title="Remove from this quarter"
					aria-label="Remove {courseId} from this quarter"
				>
					<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
					</svg>
				</button>
			</div>
		{/each}
		
		{#if courses.length === 0}
			<div class="text-center py-4 text-gray-500 text-sm">
				No courses scheduled
			</div>
		{/if}
	</div>
</div>

<style>
	.quarter-display {
		min-height: 120px;
	}
</style>
