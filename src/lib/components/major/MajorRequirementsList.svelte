<!--
	MajorRequirementsList Component
	Displays courses and groups within a major section with drag-and-drop and enhanced interactions
-->
<script lang="ts">
	import { slide } from 'svelte/transition';
	import type { MajorRequirement, Course } from '../../types.js';
	import { 
		schedulingService, 
		completedCoursesStore, 
		courseSchedulesStore, 
		formatQuarterCode, 
		validationErrorsStore,
		validationService,
		handleCourseDragStart,
		handleCourseDragEnd,
		majorRequirementsService
	} from '../../services/schedulingServices.js';
	import ValidationIndicator from '../shared/ValidationIndicator.svelte';
	import StatusIndicator from './StatusIndicator.svelte';
	import { base } from '$app/paths';
	
	export let requirements: MajorRequirement[];
	export let courseMap: Map<string, Course>;
	export let onToggleCompletion: (courseId: string) => void;
	export let isNested: boolean = false;
	export let useCompactLayout: boolean = false;
	
	// Helper function to count all courses in nested groups
	function countAllCourses(requirement: MajorRequirement): number {
		let count = 0;
		if (requirement.type === 'group') {
			for (const option of requirement.options) {
				if (option.type === 'course') {
					count++;
				} else if (option.type === 'group') {
					count += countAllCourses(option);
				}
			}
		}
		return count;
	}
	
	// Collapsible state management
	let collapsedSections = new Set<string>();
	let autoCollapsedSections = new Set<string>(); // Track which sections were auto-collapsed
	let hasInitialized = false; // Track if we've done initial setup
	
	// Initialize collapsed sections for large groups (>20 courses) - only run once
	$: if (!hasInitialized && requirements.length > 0) {
		const newCollapsedSections = new Set<string>();
		
		// Check each requirement and auto-collapse if it has more than 20 courses/sub-groups
		for (const requirement of requirements) {
			if (requirement.type === 'group') {
				const groupId = `${requirement.title}-${requirement.description || ''}`;
				const totalCourses = countAllCourses(requirement);
				const totalOptions = requirement.options.length;
				
				// Auto-collapse if more than 20 courses OR more than 20 sub-groups
				if (totalCourses > 20 || totalOptions > 20) {
					newCollapsedSections.add(groupId);
				}
			}
		}
		
		collapsedSections = newCollapsedSections;
		autoCollapsedSections = new Set(newCollapsedSections);
		hasInitialized = true;
	}
	
	function toggleCollapse(requirementId: string) {
		if (collapsedSections.has(requirementId)) {
			collapsedSections.delete(requirementId);
		} else {
			collapsedSections.add(requirementId);
		}
		
		// Create a new Set to trigger reactivity
		collapsedSections = new Set(collapsedSections);
	}
	
	// Subscribe to stores to ensure reactivity
	$: courseSchedules = $courseSchedulesStore;
	$: validationErrors = $validationErrorsStore;
	$: completedCourses = $completedCoursesStore;
	
	// Force reactive updates by creating a dependency on all stores
	$: storeUpdate = [courseMap, courseSchedules, validationErrors, completedCourses];
	
	// Drag and drop functionality
	let isDragging = false;
	let draggedCourseId: string | null = null;
	let dragStartTime = 0;
	let dragStartPosition = { x: 0, y: 0 };
	
	function handleDragStart(event: DragEvent, courseId: string) {
		isDragging = true;
		draggedCourseId = courseId;
		dragStartTime = Date.now();
		dragStartPosition = { x: event.clientX, y: event.clientY };
		handleCourseDragStart(event, courseId);
	}
	
	function handleDragEnd() {
		isDragging = false;
		draggedCourseId = null;
		handleCourseDragEnd();
	}
	
	function handleCourseClick(event: MouseEvent, courseId: string) {
		// Only toggle completion if this was a short click (not a drag)
		const currentTime = Date.now();
		const timeDiff = currentTime - dragStartTime;
		const distance = Math.sqrt(
			Math.pow(event.clientX - dragStartPosition.x, 2) + 
			Math.pow(event.clientY - dragStartPosition.y, 2)
		);
		
		// If it was a short interaction and minimal movement, treat as click
		if (timeDiff < 200 && distance < 5) {
			onToggleCompletion(courseId);
		}
	}
	
	function handleCourseKeydown(event: KeyboardEvent, courseId: string) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			onToggleCompletion(courseId);
		}
	}
	
	// Helper function to check if a group has nested sub-groups
	function hasNestedGroups(requirement: MajorRequirement): boolean {
		if (requirement.type === 'group') {
			return requirement.options.some(option => option.type === 'group');
		}
		return false;
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
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
			<div
				class="relative flex items-center justify-between p-3 rounded border transition-colors drag-handle w-full text-left cursor-pointer {displayClasses}"
				draggable="true"
				on:dragstart={(e) => handleDragStart(e, requirement.courseId)}
				on:dragend={handleDragEnd}
				on:mousedown={(e) => { dragStartTime = Date.now(); dragStartPosition = { x: e.clientX, y: e.clientY }; }}
				on:click|stopPropagation={(e) => handleCourseClick(e, requirement.courseId)}
				on:keydown={(e) => handleCourseKeydown(e, requirement.courseId)}
				role="button"
				tabindex="0"
				aria-label="Toggle completion for {requirement.courseId}, or drag to schedule"
				title="Click to toggle completion, drag to schedule"
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
							on:click|stopPropagation={() => window.open(`${base}/courses/${requirement.courseId.replace(/[^A-Z0-9]/g, '')}`, '_blank')}
							title="View {requirement.courseId} prerequisites and details (opens in new tab)"
						>
							{requirement.courseId}{#if !useCompactLayout && courseMap.has(requirement.courseId)}: {courseMap.get(requirement.courseId)?.title}{/if}
							{#if courseStatus.isScheduled && !courseStatus.isDirectlyCompleted}
								<span class="ml-2 text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">
									{formatQuarterCode(schedulingService.getSchedule(requirement.courseId))}
								</span>
							{/if}
						</button>
					</div>
					
					<div class="flex flex-col items-end">
						<!-- Validation warnings -->
						<ValidationIndicator errors={$validationErrorsStore} courseId={requirement.courseId} />
						
						<!-- Equivalent course indicator -->
						{#if courseStatus.completedSource !== null && courseStatus.completedSource !== requirement.courseId}
							<button
								class="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded mt-1 hover:bg-green-200 hover:shadow-sm transition-all duration-200 cursor-pointer via-button"
								on:click|stopPropagation={() => window.open(`${base}/courses/${courseStatus.completedSource?.replace(/[^A-Z0-9]/g, '') || ''}`, '_blank')}
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
		{@const totalCourses = countAllCourses(requirement)}
		{@const hasSubGroups = hasNestedGroups(requirement)}
		{@const shouldUseCompact = useCompactLayout || (!hasSubGroups && totalCourses >= 12)}
		
		<!-- Group Requirement -->
		{@const groupId = `${requirement.title}-${requirement.description || ''}`}
		{@const isCollapsed = collapsedSections.has(groupId)}
		<div class="border border-gray-300 rounded-lg p-4 bg-blue-50">
			<!-- Only show header if not nested -->
			{#if !isNested}
				<div class="flex items-center justify-between mb-3">
					<div class="flex-1">
						<div class="flex items-center space-x-2">
							<button
								class="hover:bg-gray-100 focus:outline-none transition-colors rounded p-1"
								on:click={() => toggleCollapse(groupId)}
								title={isCollapsed ? 'Expand section' : 'Collapse section'}
							>
								<span class="text-lg text-blue-800 inline-block transition-transform duration-200 ease-in-out {isCollapsed ? '' : 'rotate-180'}">⌵</span>
							</button>
							<h3 class="font-semibold text-lg">{requirement.title}</h3>
						</div>
						{#if !isCollapsed}
							<div 
								class="transition-all duration-300 ease-in-out"
								transition:slide={{ duration: 300 }}
							>
								<p class="text-gray-700 text-sm mt-1">{requirement.description}</p>
			{#if requirement.options.length !== requirement.needs}
			<p class="text-blue-800 font-medium text-sm mt-1">
				Select {requirement.needs} from {requirement.options.length} options:
			</p>
			{/if}
							</div>
						{/if}
					</div>
					
					<!-- Group progress indicator - always shown -->
					<div class="flex-shrink-0 ml-4">
						<StatusIndicator 
							completedCount={groupStats.groupCompletedProgress}
							plannedCount={groupStats.groupPlannedCount}
							requiredCount={groupStats.groupRequiredCount}
							size="medium"
						/>
					</div>
				</div>
			{:else}
				<!-- Nested header - simplified with collapse functionality -->
				{@const nestedGroupStats = majorRequirementsService.getGroupStats(requirement)}
				<div class="mb-3">
					<div class="flex items-center justify-between">
						<div class="flex items-center space-x-2 flex-1">
							<button
								class="hover:bg-gray-100 focus:outline-none transition-colors rounded p-1"
								on:click={() => toggleCollapse(groupId)}
								title={isCollapsed ? 'Expand section' : 'Collapse section'}
							>
								<span class="text-sm text-blue-800 inline-block transition-transform duration-200 ease-in-out {isCollapsed ? '' : 'rotate-180'}">⌵</span>
							</button>
							<h4 class="font-medium text-base text-gray-800">{requirement.title}</h4>
						</div>
						
						<!-- Nested group progress indicator - always shown -->
						<div class="flex-shrink-0 ml-4">
							<StatusIndicator 
								completedCount={nestedGroupStats.groupCompletedProgress}
								plannedCount={nestedGroupStats.groupPlannedCount}
								requiredCount={nestedGroupStats.groupRequiredCount}
								size="small"
							/>
						</div>
					</div>
					{#if !isCollapsed}
						<div 
							class="transition-all duration-300 ease-in-out"
							transition:slide={{ duration: 300 }}
						>
							{#if requirement.description}
								<p class="text-gray-600 text-xs mt-1">{requirement.description}</p>
							{/if}
			{#if requirement.options.length !== requirement.needs}
			<p class="font-medium text-xs mt-1">
				<span class="text-blue-600">Select {requirement.needs} from {requirement.options.length} options</span>
			</p>
			{/if}
						</div>
					{/if}
				</div>
			{/if}
			
			<!-- Course options with conditional layout - only show if not collapsed -->
			{#if !isCollapsed}
				<div 
					class="transition-all duration-300 ease-in-out {shouldUseCompact ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2' : 'space-y-3'}"
					transition:slide={{ duration: 300 }}
				>
					{#each requirement.options as option, index}
						{#if option.type === 'course'}
							{@const courseStatus = majorRequirementsService.getGroupCourseStatus(option.courseId, groupStats.groupCourseIds)}
							{@const displayClasses = majorRequirementsService.getGroupCourseDisplayClasses(courseStatus)}
							{@const staggerDelay = Math.min(index * 50, 1000)} <!-- Max 1 second total, 50ms per course -->
							
							<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
							<!-- svelte-ignore a11y-click-events-have-key-events -->
							<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
							<div 
								class="relative flex items-center justify-between p-2 rounded border transition-colors drag-handle w-full text-left cursor-pointer {displayClasses}"
								style="animation-delay: {staggerDelay}ms"
								draggable="true"
								on:dragstart={(e) => handleDragStart(e, option.courseId)}
								on:dragend={handleDragEnd}
								on:mousedown={(e) => { dragStartTime = Date.now(); dragStartPosition = { x: e.clientX, y: e.clientY }; }}
								on:click|stopPropagation={(e) => handleCourseClick(e, option.courseId)}
								on:keydown={(e) => handleCourseKeydown(e, option.courseId)}
								role="button"
								tabindex="0"
								aria-label="Toggle completion for {option.courseId}, or drag to schedule"
								title="Click to toggle completion, drag to schedule"
								in:slide={{ duration: 200, delay: staggerDelay }}
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
										on:click|stopPropagation={() => window.open(`${base}/courses/${option.courseId.replace(/[^A-Z0-9]/g, '')}`, '_blank')}
										title="View {option.courseId} prerequisites and details (opens in new tab)"
									>
										{option.courseId}{#if !shouldUseCompact && courseMap.has(option.courseId)}: {courseMap.get(option.courseId)?.title}{/if}
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
											on:click|stopPropagation={() => window.open(`${base}/courses/${courseStatus.completedSource?.replace(/[^A-Z0-9]/g, '') || ''}`, '_blank')}
											title="View {courseStatus.completedSource} prerequisites and details (opens in new tab)"
										>
											✓ Via: {courseStatus.completedSource}
										</button>
									{/if}
									
									<!-- Validation warnings for group options -->
									<ValidationIndicator errors={$validationErrorsStore} courseId={option.courseId} />
								</div>
							</div>
						{:else if option.type === 'group'}
							<!-- Nested Group -->
							{@const courseCount = option.options.filter(opt => opt.type === 'course').length}
							{@const totalNestedCourses = countAllCourses(option)}
							{@const staggerDelay = Math.min(index * 50, 1000)} <!-- Max 1 second total, 50ms per group -->
							<div 
								class="nested-group ml-4 border-l-2 border-gray-300 pl-4"
								in:slide={{ duration: 200, delay: staggerDelay }}
							>
								<!-- Recursively render nested group options with compact layout if needed -->
								<svelte:self requirements={[option]} {courseMap} {onToggleCompletion} isNested={true} useCompactLayout={totalNestedCourses > 10} />
							</div>
						{/if}
					{/each}
				</div>
			{/if}
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
	
	/* Staggered course appearance animation */
	@keyframes courseAppear {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	/* Apply animation when not collapsed */
	:global(.course-item) {
		animation: courseAppear 0.3s ease-out forwards;
	}
</style>