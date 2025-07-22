<!--
	MajorSection Component
	Individual section container with shaded background for a major section
-->
<script lang="ts">
	import type { MajorSection as MajorSectionType, Course } from '../../types.js';
	import { calculateSectionRequiredCount } from '../../services/data/loadMajors.js';
	import { schedulingService, completedCoursesStore, courseSchedulesStore, courseCompletionService } from '../../services/schedulingServices.js';
	import MajorSectionHeader from './MajorSectionHeader.svelte';
	import MajorRequirementsList from './MajorRequirementsList.svelte';
	
	export let section: MajorSectionType;
	export let courseMap: Map<string, Course>;
	export let onToggleCompletion: (courseId: string) => void;
	export let sectionIndex: number = 0;
	
	// Subscribe to stores to ensure reactivity
	$: userCompletedCourses = $completedCoursesStore;
	$: courseSchedules = $courseSchedulesStore;
	
	// Different background colors for different sections
	const sectionBackgrounds = [
		'bg-blue-50',    // First section (usually preparation)
		'bg-green-50',   // Second section (usually the major)
		'bg-purple-50',  // Third section (if any)
		'bg-orange-50',  // Fourth section (if any)
		'bg-gray-50'     // Default fallback
	];
	
	$: sectionBg = sectionBackgrounds[sectionIndex] || sectionBackgrounds[4];
	
	// Calculate completion stats for this section
	$: {
		// Force reactivity by depending on all stores
		userCompletedCourses;
		courseMap;
		courseSchedules;
		
		// Calculate the actual required count (accounting for group selectCount)
		const totalRequired = calculateSectionRequiredCount(section.requirements);
		
		// Calculate completed and scheduled counts by checking actual courses
		let completedCount = 0;
		let scheduledCount = 0;
		
		function countCourses(requirements: any[]) {
			for (const req of requirements) {
				if (req.type === 'course') {
					// Check if course is completed
					if (courseCompletionService.getCompletedCourseSource(req.courseId) !== null) {
						completedCount++;
					} else if ((courseSchedules[req.courseId] || 0) > 0) {
						// Course is scheduled but not completed
						scheduledCount++;
					}
				} else if (req.type === 'group') {
					// For groups, count completed and scheduled courses up to the needs count
					let groupCompleted = 0;
					let groupScheduled = 0;
					
					// Get all course IDs in this group for completion checking
					const groupCourseIds = req.options.filter((opt: any) => opt.type === 'course').map((opt: any) => opt.courseId);
					
					for (const option of req.options) {
						if (option.type === 'course') {
							if (courseCompletionService.getCompletedCourseOfGroupSource(option.courseId, groupCourseIds) !== null) {
								groupCompleted++;
							} else if ((courseSchedules[option.courseId] || 0) > 0) {
								groupScheduled++;
							}
						}
					}
					
					// Only count up to the required number for this group
					const maxCompleted = Math.min(groupCompleted, req.needs);
					const maxScheduled = Math.min(groupScheduled, req.needs - maxCompleted);
					
					completedCount += maxCompleted;
					scheduledCount += maxScheduled;
				}
			}
		}
		
		countCourses(section.requirements);
		const plannedCount = Math.min(completedCount + scheduledCount, totalRequired);
		const completedProgress = Math.min(completedCount, totalRequired);
		const scheduledProgress = Math.min(scheduledCount, totalRequired - completedCount);
		
		sectionStats = { 
			total: totalRequired, 
			completed: completedCount, 
			planned: plannedCount,
			completedProgress,
			scheduledProgress
		};
	}
	
	let sectionStats: { 
		total: number; 
		completed: number; 
		planned: number;
		completedProgress: number;
		scheduledProgress: number;
	} = { total: 0, completed: 0, planned: 0, completedProgress: 0, scheduledProgress: 0 };
</script>

<section class="border border-gray-200 rounded-lg p-6 {sectionBg}">
	<div class="flex items-center justify-between mb-4">
		<MajorSectionHeader 
			title={section.title}
			description={section.description}
			sectionId={section.id}
		/>
		
		{#if sectionStats.total > 0}
			<div class="flex-shrink-0 ml-4">
				<div class="text-sm text-gray-600 text-right">
					<div class="font-medium">
						{#if sectionStats.completed > 0}
							<span class="text-green-600">{sectionStats.completed}/{sectionStats.total}</span>
						{/if}
						{#if sectionStats.completed > 0 && sectionStats.planned - sectionStats.completed > 0 && sectionStats.completed !== sectionStats.total}
							<span>|</span>
						{/if}
						{#if sectionStats.planned - sectionStats.completed > 0 && sectionStats.completed !== sectionStats.total}
							<span class="text-purple-600">{sectionStats.planned - sectionStats.completed}/{sectionStats.total - sectionStats.completed}</span>
						{/if}
						{#if sectionStats.completed === 0 && sectionStats.planned === 0}
							<span class="text-gray-500">0/{sectionStats.total}</span>
						{/if}
					</div>
					<div class="w-16 h-2 bg-gray-200 rounded-full overflow-hidden relative">
						<!-- Completed courses (green) -->
						<div 
							class="absolute left-0 top-0 h-full bg-green-500 transition-all duration-300 ease-out"
							style="width: {sectionStats.total > 0 ? (sectionStats.completedProgress / sectionStats.total) * 100 : 0}%"
						></div>
						<!-- Scheduled courses (purple) -->
						<div 
							class="absolute top-0 h-full bg-purple-400 transition-all duration-300 ease-out"
							style="left: {sectionStats.total > 0 ? (sectionStats.completedProgress / sectionStats.total) * 100 : 0}%; width: {sectionStats.total > 0 ? (sectionStats.scheduledProgress / sectionStats.total) * 100 : 0}%"
						></div>
					</div>
				</div>
			</div>
		{/if}
	</div>
	
	<MajorRequirementsList 
		requirements={section.requirements}
		{courseMap}
		{onToggleCompletion}
	/>
</section>

<style>
	/* Add any section container-specific styling here */
	section {
		/* Ensure consistent spacing and visual hierarchy */
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
	}
</style>
