<!--
	MajorRequirementsList Component
	Displays courses and groups within a major section with drag-and-drop and enhanced interactions
-->
<script lang="ts">
	import type { MajorRequirement } from '../../types.js';
	import { schedulingService, completedCoursesStore, courseSchedulesStore, formatQuarterCode, validationErrorsStore } from '../../services/shared/schedulingService.js';
	import { courseMapStore } from '../../services/data/loadCourses.js';
	import ValidationIndicator from '../shared/ValidationIndicator.svelte';
	
	export let requirements: MajorRequirement[];
	export let onToggleCompletion: (courseId: string) => void;
	
	// Subscribe to both stores to ensure reactivity when either changes
	$: userCompletedCourses = $completedCoursesStore;
	$: courseMap = $courseMapStore;
	$: courseSchedules = $courseSchedulesStore;
	$: validationErrors = $validationErrorsStore;
	
	// Force reactivity by depending on all stores
	$: reactiveKey = [userCompletedCourses, courseMap, courseSchedules, validationErrors];
	
	// Drag and drop functionality with clean visual feedback
	const flipDurationMs = 300;
	let isDragging = false;
	let draggedCourseId: string | null = null;
	
	function handleDragStart(event: DragEvent, courseId: string) {
		if (!event.dataTransfer) return;
		
		isDragging = true;
		draggedCourseId = courseId;
		
		// Create a clean, small drag image
		const dragImg = document.createElement('div');
		dragImg.className = 'bg-purple-600 text-purple-100 px-3 py-1 rounded text-sm font-medium shadow-lg border border-purple-700';
		dragImg.textContent = courseId;
		dragImg.style.position = 'absolute';
		dragImg.style.top = '-1000px';
		dragImg.style.left = '-1000px';
		dragImg.style.zIndex = '1000';
		
		document.body.appendChild(dragImg);
		
		// Set the custom drag image
		event.dataTransfer.setDragImage(dragImg, 20, 10);
		
		// Clean up the temporary drag image
		setTimeout(() => {
			if (document.body.contains(dragImg)) {
				document.body.removeChild(dragImg);
			}
		}, 0);
		
		// Set drag data
		event.dataTransfer.setData('text/plain', courseId);
		event.dataTransfer.setData('application/x-bruinplan-course', courseId);
		event.dataTransfer.effectAllowed = 'move';
	}
	
	function handleDragEnd() {
		isDragging = false;
		draggedCourseId = null;
	}
</script>

<div class="space-y-4">
	{#each requirements as requirement}
		{#if requirement.type === 'course'}
			<!-- Force reactivity by depending on both stores -->
			{@const completedSource = reactiveKey && schedulingService.getCompletedCourseSource(requirement.courseId)}
			{@const isEffectivelyCompleted = completedSource !== null}
			{@const isDirectlyCompleted = reactiveKey && userCompletedCourses.has(requirement.courseId)}
			{@const isScheduled = reactiveKey && schedulingService.getSchedule(requirement.courseId) > 0}
			{@const courseErrors = reactiveKey && validationErrors.filter(error => error.courseId === requirement.courseId)}
			{@const hasErrors = courseErrors.some(error => error.type === 'error')}
			{@const hasWarnings = courseErrors.some(error => error.type === 'warning')}
			{@const validationBgClass = hasErrors ? 'bg-red-200 border-red-300' : hasWarnings ? 'bg-orange-100 border-orange-300' : (isScheduled && !isDirectlyCompleted) ? 'bg-purple-100 border-purple-300' : ''}
		<!-- Individual Course Requirement -->
		<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
		<div
			class="relative flex items-center justify-between p-3 rounded border transition-colors drag-handle w-full text-left
					{validationBgClass || 
					(isEffectivelyCompleted
						? 'bg-green-100 hover:bg-green-200 border-green-200'
						: isScheduled
						? 'theme-scheduled hover:bg-purple-200'
						: 'bg-gray-50 hover:bg-gray-100 border-gray-200')}"
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
								{isDirectlyCompleted
									? 'bg-green-500 border-green-500 shadow-sm' 
									: 'bg-white border-gray-300 hover:border-green-400 hover:bg-green-50'}"
						on:click|stopPropagation={() => onToggleCompletion(requirement.courseId)}
						title={isDirectlyCompleted ? 'Mark as incomplete' : 'Mark as complete'}
					>
						{#if isDirectlyCompleted}
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
						{#if isScheduled}
							<span class="ml-2 text-xs bg-theme-purple-200 text-theme-purple-800 px-2 py-0.5 rounded-full">
								{formatQuarterCode(schedulingService.getSchedule(requirement.courseId))}
							</span>
						{/if}
					</button>
				</div>
				
				<div class="flex flex-col items-end">
					
					<!-- Equivalent course indicator -->
					{#if completedSource !== null && completedSource !== requirement.courseId}
						<button
							class="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded mt-1 hover:bg-green-200 hover:shadow-sm transition-all duration-200 cursor-pointer via-button"
							on:click|stopPropagation={() => window.open(`/courses/${completedSource}`, '_blank')}
							title="View {completedSource} prerequisites and details (opens in new tab)"
						>
							✓ Via: {completedSource}
						</button>				{/if}
			</div>
		</div>
		{:else if requirement.type === 'group'}
			<!-- Calculate group completion stats with reactivity -->
			{@const groupCourseIds = requirement.options.filter(option => option.type === 'course').map(option => option.courseId)}
			{@const groupCompletedCount = reactiveKey && requirement.options.filter(option => 
				option.type === 'course' && schedulingService.getCompletedCourseOfGroupSource(option.courseId, groupCourseIds) !== null
			).length}
			{@const groupScheduledCount = reactiveKey && requirement.options.filter(option => 
				option.type === 'course' && schedulingService.getSchedule(option.courseId) > 0 && 
				schedulingService.getCompletedCourseOfGroupSource(option.courseId, groupCourseIds) === null
			).length}
			{@const groupRequiredCount = requirement.needs}
			{@const groupPlannedCount = Math.min(groupCompletedCount + groupScheduledCount, groupRequiredCount)}
			{@const groupCompletedProgress = Math.min(groupCompletedCount, groupRequiredCount)}
			{@const groupScheduledProgress = Math.min(groupScheduledCount, groupRequiredCount - groupCompletedCount)}
			
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
								{groupPlannedCount}/{groupRequiredCount} courses planned
							</div>
							<div class="w-16 h-2 bg-gray-200 rounded-full overflow-hidden relative">
								<!-- Completed courses (green) -->
								<div 
									class="absolute left-0 top-0 h-full bg-green-500 transition-all duration-300 ease-out"
									style="width: {groupRequiredCount > 0 ? (groupCompletedProgress / groupRequiredCount) * 100 : 0}%"
								></div>
								<!-- Scheduled courses (purple) -->
								<div 
									class="absolute top-0 h-full bg-purple-400 transition-all duration-300 ease-out"
									style="left: {groupRequiredCount > 0 ? (groupCompletedProgress / groupRequiredCount) * 100 : 0}%; width: {groupRequiredCount > 0 ? (groupScheduledProgress / groupRequiredCount) * 100 : 0}%"
								></div>
							</div>
						</div>
					</div>
				</div>
				
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
					{#each requirement.options as option}
						{#if option.type === 'course'}
							<!-- Force reactivity by depending on both stores -->
							{@const optionCompletedSource = reactiveKey && schedulingService.getCompletedCourseOfGroupSource(option.courseId, groupCourseIds)}
							{@const isEffectivelyCompleted = optionCompletedSource !== null}
							{@const isDirectlyCompleted = reactiveKey && userCompletedCourses.has(option.courseId)}
							{@const isScheduled = reactiveKey && schedulingService.getSchedule(option.courseId) > 0}						<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
						<div 
							class="relative flex items-center justify-between p-2 rounded border transition-colors drag-handle w-full text-left
									{isEffectivelyCompleted
										? 'bg-green-100 hover:bg-green-200 border-green-200' 
										: isScheduled
										? 'theme-scheduled hover:bg-purple-200'
										: 'bg-white hover:bg-gray-50 border-gray-200'}"
							draggable="true"
							on:dragstart={(e) => handleDragStart(e, option.courseId)}
							on:dragend={handleDragEnd}
							
							
							role="listitem"
							aria-label="Draggable course {option.courseId}"
						>
								<div class="flex items-center space-x-2">								<!-- Checkbox - direct completion toggle -->
								<button
									class="completion-checkbox w-4 h-4 rounded border-2 border-gray-300 flex items-center justify-center 
											{isDirectlyCompleted ? 'bg-green-500 border-green-500' : 'bg-white'} 
											hover:border-green-400 transition-colors"
									on:click|stopPropagation={() => onToggleCompletion(option.courseId)}
									title={isDirectlyCompleted ? 'Mark as incomplete' : 'Mark as complete'}
								>
										{#if isDirectlyCompleted}
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
										{#if isScheduled}
											<span class="ml-2 text-xs bg-theme-purple-200 text-theme-purple-800 px-2 py-0.5 rounded-full">
												{formatQuarterCode(schedulingService.getSchedule(option.courseId))}
											</span>
										{/if}
									</button>
								</div>
								
								<div class="flex flex-col items-end">
									
									<!-- Equivalent course indicator for group options -->
									{#if isEffectivelyCompleted && optionCompletedSource !== option.courseId}
										<button
											class="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded hover:bg-green-200 hover:shadow-sm transition-all duration-200 cursor-pointer via-button"
											on:click|stopPropagation={() => window.open(`/courses/${optionCompletedSource}`, '_blank')}
											title="View {optionCompletedSource} prerequisites and details (opens in new tab)"
										>
											✓ Via: {optionCompletedSource}
										</button>								{/if}
							</div>
						</div>
						{/if}
					{/each}
				</div>
			</div>
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