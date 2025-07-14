<!--
	MajorRequirementsList Component
	Displays courses and groups within a major section with drag-and-drop and enhanced interactions
-->
<script lang="ts">
	import type { MajorRequirement } from '../../types.js';
	import { 
		schedulingService, 
		completedCoursesStore, 
		courseSchedulesStore, 
		formatQuarterCode, 
		validationErrorsStore,
		handleCourseDragStart,
		handleCourseDragEnd,
		majorRequirementsService
	} from '../../services/schedulingServices.js';
	import { courseMapStore } from '../../services/data/loadCourses.js';
	import ValidationIndicator from '../shared/ValidationIndicator.svelte';
	
	export let requirements: MajorRequirement[];
	export let onToggleCompletion: (courseId: string) => void;
	
	// Subscribe to stores to ensure reactivity
	$: courseMap = $courseMapStore;
	$: courseSchedules = $courseSchedulesStore;
	$: validationErrors = $validationErrorsStore;
	$: completedCourses = $completedCoursesStore;
	
	// Force reactive updates by creating a dependency on all stores
	$: storeUpdate = [courseMap, courseSchedules, validationErrors, completedCourses];
	
	// Drag and drop functionality
	let isDragging = false;
	let draggedCourseId: string | null = null;
	
	function handleDragStart(event: DragEvent, courseId: string) {
		isDragging = true;
		draggedCourseId = courseId;
		handleCourseDragStart(event, courseId);
	}
	
	function handleDragEnd() {
		isDragging = false;
		draggedCourseId = null;
		handleCourseDragEnd();
	}
</script>

<div class="space-y-4">
	{#each requirements as requirement}
		{#if requirement.type === 'course'}
			{#key storeUpdate}
				{@const courseStatus = majorRequirementsService.getCourseStatus(requirement.courseId)}
				{@const displayClasses = majorRequirementsService.getCourseDisplayClasses(courseStatus)}
			<!-- Individual Course Requirement -->
			<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
			<div
				class="relative flex items-center justify-between p-3 rounded border transition-colors drag-handle w-full text-left {displayClasses}"
				draggable="true"
				on:dragstart={(e) => handleDragStart(e, requirement.courseId)}
				on:dragend={handleDragEnd}
				role="listitem"
				aria-label="Draggable course {requirement.courseId}"
			>
					<div class="flex items-center space-x-3">
						<!-- Checkbox - direct completion toggle -->
						<button
							class="completion-checkbox w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200
									{courseStatus.isDirectlyCompleted
										? 'bg-green-500 border-green-500 shadow-sm' 
										: 'bg-white border-gray-300 hover:border-green-400 hover:bg-green-50'}"
							on:click|stopPropagation={() => onToggleCompletion(requirement.courseId)}
							title={courseStatus.isDirectlyCompleted ? 'Mark as incomplete' : 'Mark as complete'}
						>
							{#if courseStatus.isDirectlyCompleted}
								<span class="text-white text-xs font-bold">✓</span>
							{/if}
						</button>
						
						<!-- Course ID - links to prerequisite tree -->
						<button
							class="text-blue-600 hover:text-blue-800 font-medium cursor-pointer px-2 py-1 rounded-md hover:bg-blue-100 hover:shadow-sm transition-all duration-200"
							on:click|stopPropagation={() => window.open(`/courses/${requirement.courseId}`, '_blank')}
							title="View {requirement.courseId} prerequisites and details (opens in new tab)"
						>
							{requirement.courseId}
							{#if courseStatus.isScheduled && !courseStatus.isDirectlyCompleted}
								<span class="ml-2 text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">
									{formatQuarterCode(schedulingService.getSchedule(requirement.courseId))}
								</span>
							{/if}
						</button>
					</div>
					
					<div class="flex flex-col items-end">
						<!-- Equivalent course indicator -->
						{#if courseStatus.completedSource !== null && courseStatus.completedSource !== requirement.courseId}
							<button
								class="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded mt-1 hover:bg-green-200 hover:shadow-sm transition-all duration-200 cursor-pointer via-button"
								on:click|stopPropagation={() => window.open(`/courses/${courseStatus.completedSource}`, '_blank')}
								title="View {courseStatus.completedSource} prerequisites and details (opens in new tab)"
			>
				✓ Via: {courseStatus.completedSource}
			</button>
		{/if}
	</div>
</div>
{/key}
{:else if requirement.type === 'group'}
	{#key storeUpdate}
		{@const groupStats = majorRequirementsService.getGroupStats(requirement)}
		
		<!-- Group Requirement -->
		<div class="border border-gray-300 rounded-lg p-4 bg-blue-50">
			<div class="flex items-center justify-between mb-3">
				<div class="flex-1">
					<h3 class="font-semibold text-lg">{requirement.title}</h3>
					<p class="text-gray-700 text-sm">{requirement.description}</p>
					<p class="text-blue-800 font-medium text-sm mt-1">
						Select {requirement.needs} from {requirement.options.length} options:
					</p>
				</div>
				
				<!-- Group progress indicator -->
				<div class="flex-shrink-0 ml-4">
					<div class="text-sm text-gray-600 text-right">
						<div class="font-medium">
							{groupStats.groupPlannedCount}/{groupStats.groupRequiredCount} courses planned
						</div>
						<div class="w-16 h-2 bg-gray-200 rounded-full overflow-hidden relative">
							<!-- Completed courses (green) -->
							<div 
								class="absolute left-0 top-0 h-full bg-green-500 transition-all duration-300 ease-out"
								style="width: {groupStats.groupRequiredCount > 0 ? (groupStats.groupCompletedProgress / groupStats.groupRequiredCount) * 100 : 0}%"
							></div>
							<!-- Scheduled courses (purple) -->
							<div 
								class="absolute top-0 h-full bg-purple-400 transition-all duration-300 ease-out"
								style="left: {groupStats.groupRequiredCount > 0 ? (groupStats.groupCompletedProgress / groupStats.groupRequiredCount) * 100 : 0}%; width: {groupStats.groupRequiredCount > 0 ? (groupStats.groupScheduledProgress / groupStats.groupRequiredCount) * 100 : 0}%"
							></div>
						</div>
					</div>
					</div>
				</div>
				
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
					{#each requirement.options as option}
						{#if option.type === 'course'}
							{@const courseStatus = majorRequirementsService.getGroupCourseStatus(option.courseId, groupStats.groupCourseIds)}
							{@const displayClasses = majorRequirementsService.getGroupCourseDisplayClasses(courseStatus)}
							
							<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
							<div 
								class="relative flex items-center justify-between p-2 rounded border transition-colors drag-handle w-full text-left {displayClasses}"
								draggable="true"
								on:dragstart={(e) => handleDragStart(e, option.courseId)}
								on:dragend={handleDragEnd}
								role="listitem"
								aria-label="Draggable course {option.courseId}"
							>
								<div class="flex items-center space-x-2">
									<!-- Checkbox - direct completion toggle -->
									<button
										class="completion-checkbox w-4 h-4 rounded border-2 border-gray-300 flex items-center justify-center 
												{courseStatus.isDirectlyCompleted ? 'bg-green-500 border-green-500' : 'bg-white'} 
												hover:border-green-400 transition-colors"
										on:click|stopPropagation={() => onToggleCompletion(option.courseId)}
										title={courseStatus.isDirectlyCompleted ? 'Mark as incomplete' : 'Mark as complete'}
									>
										{#if courseStatus.isDirectlyCompleted}
											<span class="text-white text-xs">✓</span>
										{/if}
									</button>
									
									<!-- Course ID - links to prerequisite tree -->
									<button
										class="text-blue-600 hover:text-blue-800 text-sm cursor-pointer px-2 py-1 rounded-md hover:bg-blue-100 hover:shadow-sm transition-all duration-200"
										on:click|stopPropagation={() => window.open(`/courses/${option.courseId}`, '_blank')}
										title="View {option.courseId} prerequisites and details (opens in new tab)"
									>
										{option.courseId}
										{#if courseStatus.isScheduled && !courseStatus.isDirectlyCompleted}
											<span class="ml-2 text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">
												{formatQuarterCode(schedulingService.getSchedule(option.courseId))}
											</span>
										{/if}
									</button>
								</div>
								
								<div class="flex flex-col items-end">
									<!-- Equivalent course indicator for group options -->
									{#if courseStatus.isEffectivelyCompleted && courseStatus.completedSource !== option.courseId}
										<button
											class="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded hover:bg-green-200 hover:shadow-sm transition-all duration-200 cursor-pointer via-button"
											on:click|stopPropagation={() => window.open(`/courses/${courseStatus.completedSource}`, '_blank')}
											title="View {courseStatus.completedSource} prerequisites and details (opens in new tab)"
										>
											✓ Via: {courseStatus.completedSource}
										</button>
									{/if}
								</div>
							</div>
						{/if}
					{/each}
				</div>
			</div>
		{/key}
		{/if}
	{/each}
</div>

<style>
	/* Prevent parent hover state when hovering over Via button */
	.via-button:hover {
		/* Force the parent to not apply hover styles when hovering over the via button */
		pointer-events: auto;
	}
</style>