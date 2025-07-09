<!--
	MajorSection Component
	Individual section container with shaded background for a major section
-->
<script lang="ts">
	import type { MajorSection as MajorSectionType } from '../../types.js';
	import { calculateSectionRequiredCount } from '../../services/loadMajors.js';
	import { isCourseEffectivelyCompleted } from '../../services/completionService.js';
	import { courseMapStore } from '../../services/loadCourses.js';
	import MajorSectionHeader from './MajorSectionHeader.svelte';
	import MajorRequirementsList from './MajorRequirementsList.svelte';
	
	export let section: MajorSectionType;
	export let completedCourses: Set<string>;
	export let onToggleCompletion: (courseId: string) => void;
	export let sectionIndex: number = 0;
	
	// Use the global course map store for reactive updates
	$: globalCourseMap = $courseMapStore;
	
	// Helper function to get equivalent courses for a given course ID
	function getEquivalentCourses(courseId: string): string[] {
		const course = globalCourseMap.get(courseId);
		return course?.equivalentCourses || [];
	}
	
	// Different background colors for different sections
	const sectionBackgrounds = [
		'bg-blue-50',    // First section (usually preparation)
		'bg-red-50',   // Second section (usually the major)
		'bg-purple-50',  // Third section (if any)
		'bg-orange-50',  // Fourth section (if any)
		'bg-gray-50'     // Default fallback
	];
	
	$: sectionBg = sectionBackgrounds[sectionIndex] || sectionBackgrounds[4];
	
	// Calculate completion stats for this section
	// This will automatically update when courseMap, completedCourses, or section changes
	$: {
		// Only calculate if we have a course map with data
		if (globalCourseMap.size > 0) {
			// Calculate the actual required count (accounting for group selectCount)
			const totalRequired = calculateSectionRequiredCount(section.requirements);
			
			// Calculate completed count by checking actual completed courses
			let completedCount = 0;
			
			function countCompletedCourses(requirements: any[]) {
				for (const req of requirements) {
					if (req.type === 'course') {
						// Use the completion service to check if course is effectively completed with equivalents
						const equivalents = getEquivalentCourses(req.courseId);
						if (isCourseEffectivelyCompleted(req.courseId, equivalents, completedCourses)) {
							completedCount++;
						}
					} else if (req.type === 'group') {
						// For groups, count completed courses up to the needs count
						let groupCompleted = 0;
						for (const option of req.options) {
							if (option.type === 'course') {
								const equivalents = getEquivalentCourses(option.courseId);
								if (isCourseEffectivelyCompleted(option.courseId, equivalents, completedCourses)) {
									groupCompleted++;
								}
							}
						}
						// Only count up to the required number for this group
						completedCount += Math.min(groupCompleted, req.needs);
					}
				}
			}
			
			countCompletedCourses(section.requirements);
			sectionStats = { total: totalRequired, completed: completedCount };
		} else {
			// If no course map is available yet, show 0 progress
			sectionStats = { total: calculateSectionRequiredCount(section.requirements), completed: 0 };
		}
	}
	
	let sectionStats: { total: number; completed: number } = { total: 0, completed: 0 };
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
						{sectionStats.completed}/{sectionStats.total} completed
					</div>
					<div class="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
						<div 
							class="h-full bg-green-500 transition-all duration-300 ease-out"
							style="width: {sectionStats.total > 0 ? (sectionStats.completed / sectionStats.total) * 100 : 0}%"
						></div>
					</div>
				</div>
			</div>
		{/if}
	</div>
	
	<MajorRequirementsList 
		requirements={section.requirements}
		{completedCourses}
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
