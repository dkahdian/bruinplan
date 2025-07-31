<!--
	Quarter Display Component
	Shows a single quarter with its courses and unit information
	Supports drag-and-drop course assignment
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { 
		formatQuarterCode, 
		schedulingService, 
		validationErrorsStore,
		handleCourseDragStart,
		handleCourseDragEnd
	} from '../../services/schedulingServices.js';
	import { mobileSelectedCourseStore, scheduleCourseMobile } from '../../services/mobileSchedulingStore.js';
	import CourseSearchButton from '../shared/CourseSearchButton.svelte';
	import ValidationIndicator from '../shared/ValidationIndicator.svelte';
	import { base } from '$app/paths';
	import type { Course } from '../../types.js';

	export let quarterCode: number;
	export let courseMap: Map<string, Course>;
	export let courses: string[] = [];
	export let isLastQuarter: boolean = false;
	export let canRemove: boolean = true;
	export let onRemoveQuarter: (quarterCode: number) => void = () => {};
	export let onMobileQuarterClick: ((quarterCode: number) => void) | undefined = undefined;
	export let isMobileSelected: boolean = false;
	export let isMobile: boolean = false;

	// Calculate total units for this quarter using the passed courseMap
	$: totalUnits = courses.reduce((sum, courseId) => {
		const course = courseMap.get(courseId);
		return sum + (course?.units || 0);
	}, 0);
	
	// Subscribe to validation errors
	$: validationErrors = $validationErrorsStore;

	// Format quarter display
	$: quarterName = formatQuarterCode(quarterCode);

	// Transform courses for display
	$: courseItems = courses.map(courseId => ({
		id: courseId,
		name: courseId, // Use courseId as name since Course interface doesn't have name
		units: courseMap.get(courseId)?.units || 0
	}));

	// Drag and drop state
	let isDraggedOver = false;
	let isDragging = false;
	let draggedCourseId: string | null = null;

	// Mobile selection state
	let selectedCourseForMobile: string | null = null;
	$: selectedCourseForMobile = $mobileSelectedCourseStore;

	// Mobile course selection function
	function selectCourseForMobileScheduling(courseId: string) {
		if (isMobile) {
			// Toggle selection - if already selected, deselect
			if (selectedCourseForMobile === courseId) {
				mobileSelectedCourseStore.set(null);
			} else {
				mobileSelectedCourseStore.set(courseId);
			}
		}
	}

	// Handle mobile quarter click (for both new courses and moving existing courses)
	function handleMobileQuarterClick() {
		if (isMobile && selectedCourseForMobile) {
			// If a course is selected, schedule it to this quarter
			scheduleCourseMobile(selectedCourseForMobile, quarterCode, schedulingService);
		} else if (onMobileQuarterClick) {
			// Fall back to original behavior if no course selected
			onMobileQuarterClick(quarterCode);
		}
	}

	// Handle drag start from course items within quarters
	function handleInternalCourseDragStart(event: DragEvent, courseId: string) {
		isDragging = true;
		draggedCourseId = courseId;
		handleCourseDragStart(event, courseId);
	}

	function handleInternalCourseDragEnd() {
		isDragging = false;
		draggedCourseId = null;
		handleCourseDragEnd();
	}

	function handleRemoveQuarter() {
		if (canRemove) {
			onRemoveQuarter(quarterCode);
		}
	}

	function handleCourseRemove(courseId: string) {
		// Unschedule the course (set to 0)
		schedulingService.scheduleCourse(courseId, 0);
	}

	function handleCourseAdd(course: Course) {
		// Check if course is already scheduled for any quarter
		const currentSchedule = schedulingService.getSchedule(course.id);
		
		if (currentSchedule && currentSchedule !== 0) {
			// Course is already scheduled
			const currentQuarterName = formatQuarterCode(currentSchedule);
			const newQuarterName = formatQuarterCode(quarterCode);
			
			// Special handling for completed courses
			if (currentSchedule === 1) {
				if (confirm(`${course.id} was marked complete; move it to ${newQuarterName}?`)) {
					schedulingService.scheduleCourse(course.id, quarterCode);
				}
			} else {
				// Course is scheduled but not completed - move without confirmation
				schedulingService.scheduleCourse(course.id, quarterCode);
			}
		} else {
			// Course is not scheduled, add it
			schedulingService.scheduleCourse(course.id, quarterCode);
		}
	}

	// Handle external drops (from major list or other quarters)
	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDraggedOver = false;
		
		// Try to get course data from different drag data types
		let courseId: string | null = null;
		
		// First try the application/x-bruinplan-course format (our standard format)
		const bruinplanData = event.dataTransfer?.getData('application/x-bruinplan-course');
		if (bruinplanData) {
			courseId = bruinplanData;
		} else {
			// Fallback to plain text
			const textData = event.dataTransfer?.getData('text/plain');
			if (textData) {
				courseId = textData;
			}
		}
		
		// If we got a courseId, schedule it directly (no confirmation needed for drag/drop)
		if (courseId) {
			schedulingService.scheduleCourse(courseId, quarterCode);
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
	}

	function handleDragEnter(event: DragEvent) {
		event.preventDefault();
		isDraggedOver = true;
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		// Only set to false if we're actually leaving the drop zone
		const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
		const x = event.clientX;
		const y = event.clientY;
		
		if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
			isDraggedOver = false;
		}
	}
</script>

{#if isMobile && onMobileQuarterClick}
	<!-- Mobile: Quarter display with conditional interaction -->
	<div class="quarter-display border rounded-lg shadow-sm bg-purple-700 text-white w-full
		{isDraggedOver ? 'drag-over' : ''}
		{isMobile && isMobileSelected ? 'ring-4 ring-yellow-400 shadow-lg shadow-yellow-300 cursor-pointer' : ''}
		{isMobile ? 'p-2' : 'p-4'}"
		on:click={isMobile && selectedCourseForMobile ? () => handleMobileQuarterClick() : undefined}
		role={isMobile && selectedCourseForMobile ? "button" : undefined}
		aria-label={isMobile && selectedCourseForMobile ? "Move course to quarter {quarterName}" : undefined}
	>
		
		<!-- Quarter Header -->
		<div class="flex items-center justify-between {isMobile ? 'mb-2' : 'mb-3'}">
			<div class="flex items-center gap-2">
				<h3 class="font-semibold text-white {isMobile ? 'text-sm' : ''}">{quarterName}</h3>
				{#if canRemove && isLastQuarter}
					<span
						class="text-gray-300 hover:text-red-400 transition-colors cursor-pointer"
						on:click|stopPropagation={handleRemoveQuarter}
						on:keydown|stopPropagation={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleRemoveQuarter(); } }}
						title="Remove this quarter"
						aria-label="Remove this quarter"
						role="button"
						tabindex="0"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
						</svg>
					</span>
				{/if}
			</div>
			
			<!-- Unit Count Display -->
			<div class="{isMobile ? 'text-xs px-1 py-0.5' : 'text-sm px-2 py-1'} rounded bg-blue-100 text-blue-700">
				{totalUnits} units
			</div>
		</div>
		
		<!-- Course List (outside of clickable header) -->
		<div class="{isMobile ? 'space-y-1' : 'space-y-2'}">
			{#if courseItems.length > 0}
				<div class="{isMobile ? 'space-y-1' : 'space-y-2'}">
					{#each courseItems as courseItem (courseItem.id)}
						{@const courseErrors = validationErrors.filter(error => error.courseId === courseItem.id)}
						{@const hasWarnings = courseErrors.length > 0}
						{@const validationBgClass = hasWarnings ? 'bg-orange-100 border-orange-300' : 'bg-purple-100 border-purple-300'}
						
						<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<div 
							class="flex flex-col rounded transition-colors text-purple-800 {validationBgClass} {isDragging && draggedCourseId === courseItem.id ? 'opacity-50' : ''}
								   {isMobile ? 'p-1 cursor-pointer' : 'p-2'}
								   {isMobile && selectedCourseForMobile === courseItem.id ? 'ring-4 ring-yellow-400 shadow-lg shadow-yellow-300' : ''}"
							role="listitem"
							aria-label="Course {courseItem.id}"
							on:click={isMobile ? (e) => { e.stopPropagation(); selectCourseForMobileScheduling(courseItem.id); } : undefined}
						>
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									{#if !isMobile}
										<a
											href={`${base}/courses/${courseItem.id.replace(/[^A-Z0-9]/g, '')}`}
											class="font-medium text-purple-800 hover:text-blue-800 flex items-center gap-1 {isMobile ? 'text-xs' : 'text-sm'}"
											title="View prerequisites for {courseItem.id}"
											target="_blank"
											on:click|stopPropagation
										>
											{courseItem.id}
											<span class="opacity-75 {isMobile ? 'text-xs' : 'text-xs'}">({courseItem.units} units)</span>
										</a>
									{:else}
										<span class="font-medium text-gray-800 flex items-center gap-1 {isMobile ? 'text-xs' : 'text-sm'}">
											{courseItem.id}
											<span class="opacity-75 {isMobile ? 'text-xs' : 'text-xs'}">({courseItem.units} units)</span>
										</span>
									{/if}
									
									<!-- Bruinwalk link -->
									<a
										href="https://bruinwalk.com/classes/{courseItem.id.toLowerCase().replace(/\s+/g, '-')}/"
										target="_blank"
										class="opacity-60 hover:opacity-100 transition-opacity flex items-center gap-1"
										title="View {courseItem.id} on Bruinwalk"
										on:click|stopPropagation
									>
										<img src="/paw.png" alt="Bruinwalk" class="{isMobile ? 'w-3 h-3' : 'w-4 h-4'}" />
										<svg class="{isMobile ? 'w-2 h-2' : 'w-3 h-3'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
										</svg>
									</a>
								</div>
								<button
									class="text-gray-500 hover:text-red-600 transition-colors {isMobile ? 'p-1 min-w-[24px] min-h-[24px] flex items-center justify-center' : ''}"
									on:click|stopPropagation={() => handleCourseRemove(courseItem.id)}
									title="Remove from this quarter"
									aria-label="Remove {courseItem.id} from this quarter"
								>
									<svg class="{isMobile ? 'w-4 h-4' : 'w-3 h-3'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
									</svg>
								</button>
							</div>
							
							<!-- Validation Indicator -->
							<ValidationIndicator errors={validationErrors} courseId={courseItem.id} />
						</div>
					{/each}
				</div>
			{:else}
				<div class="text-center text-gray-200 border-2 border-dashed border-gray-400 rounded 
							{isMobile ? 'py-2 text-xs' : 'py-4 text-sm'}">
					{isMobile ? 'Tap a course, then tap here; or click add below' : 'Drop courses here or click "Add Course" below'}
				</div>
			{/if}
			
			<!-- Course Search Button -->
			<div class="{isMobile ? 'mt-1' : 'mt-2'}">
				<CourseSearchButton
					buttonText="+ Add Course"
					placeholder="Search for courses..."
					onCourseSelected={handleCourseAdd}
				/>
			</div>
		</div>
	</div>
{:else}
	<!-- Desktop: Standard div with drag and drop -->
	<div class="quarter-display border rounded-lg shadow-sm bg-purple-700 text-white 
		{isDraggedOver ? 'drag-over' : ''}
		{isMobile ? 'p-2' : 'p-4'}"
		on:drop={handleDrop}
		on:dragover={handleDragOver}
		on:dragenter={handleDragEnter}
		on:dragleave={handleDragLeave}
		role="region"
		aria-label="Quarter {quarterName} - Drop zone for courses"
	>
		<!-- Quarter Header -->
		<div class="flex items-center justify-between {isMobile ? 'mb-2' : 'mb-3'}">
			<div class="flex items-center gap-2">
				<h3 class="font-semibold text-white {isMobile ? 'text-sm' : ''}">{quarterName}</h3>
				{#if canRemove && isLastQuarter}
					<button
						class="text-gray-300 hover:text-red-400 transition-colors"
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
			<div class="{isMobile ? 'text-xs px-1 py-0.5' : 'text-sm px-2 py-1'} rounded bg-blue-100 text-blue-700">
				{totalUnits} units
			</div>
		</div>
		
		<!-- Course List -->
		<div class="{isMobile ? 'space-y-1' : 'space-y-2'}">
			{#if courseItems.length > 0}
				<div class="{isMobile ? 'space-y-1' : 'space-y-2'}">
					{#each courseItems as courseItem (courseItem.id)}
						{@const courseErrors = validationErrors.filter(error => error.courseId === courseItem.id)}
						{@const hasWarnings = courseErrors.length > 0}
						{@const validationBgClass = hasWarnings ? 'bg-orange-100 border-orange-300' : 'bg-purple-100 border-purple-300'}
						
						<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<div 
							class="flex flex-col rounded transition-colors text-purple-800 {validationBgClass} {isDragging && draggedCourseId === courseItem.id ? 'opacity-50' : ''}
								   {isMobile ? 'p-1 cursor-pointer' : 'p-2 cursor-move'}
								   {isMobile && selectedCourseForMobile === courseItem.id ? 'ring-4 ring-yellow-400 shadow-lg shadow-yellow-300' : ''}"
							draggable={!isMobile ? "true" : "false"}
							on:dragstart={!isMobile ? (e) => handleInternalCourseDragStart(e, courseItem.id) : undefined}
							on:dragend={!isMobile ? handleInternalCourseDragEnd : undefined}
							on:click={isMobile ? (e) => { e.stopPropagation(); selectCourseForMobileScheduling(courseItem.id); } : undefined}
							role="listitem"
							aria-label={isMobile ? "Select course {courseItem.id} for scheduling" : "Draggable course {courseItem.id}"}
						>
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									{#if !isMobile}
										<a
											href={`${base}/courses/${courseItem.id.replace(/[^A-Z0-9]/g, '')}`}
											class="font-medium text-purple-800 hover:text-blue-800 flex items-center gap-1 {isMobile ? 'text-xs' : 'text-sm'}"
											title="View prerequisites for {courseItem.id}"
											target="_blank"
											on:click|stopPropagation
										>
											{courseItem.id}
											<span class="opacity-75 {isMobile ? 'text-xs' : 'text-xs'}">({courseItem.units} units)</span>
										</a>
									{:else}
										<span class="font-medium text-gray-800 flex items-center gap-1 {isMobile ? 'text-xs' : 'text-sm'}">
											{courseItem.id}
											<span class="opacity-75 {isMobile ? 'text-xs' : 'text-xs'}">({courseItem.units} units)</span>
										</span>
									{/if}
									
									<!-- Bruinwalk link -->
									<a
										href="https://bruinwalk.com/classes/{courseItem.id.toLowerCase().replace(/\s+/g, '-')}/"
										target="_blank"
										class="opacity-60 hover:opacity-100 transition-opacity flex items-center gap-1"
										title="View {courseItem.id} on Bruinwalk"
										on:click|stopPropagation
									>
										<img src="/paw.png" alt="Bruinwalk" class="{isMobile ? 'w-3 h-3' : 'w-4 h-4'}" />
										<svg class="{isMobile ? 'w-2 h-2' : 'w-3 h-3'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
										</svg>
									</a>
								</div>
								<button
									class="text-gray-500 hover:text-red-600 transition-colors {isMobile ? 'p-1 min-w-[24px] min-h-[24px] flex items-center justify-center' : ''}"
									on:click|stopPropagation={() => handleCourseRemove(courseItem.id)}
									title="Remove from this quarter"
									aria-label="Remove {courseItem.id} from this quarter"
								>
									<svg class="{isMobile ? 'w-4 h-4' : 'w-3 h-3'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
									</svg>
								</button>
							</div>
							
							<!-- Validation Indicator -->
							<ValidationIndicator errors={validationErrors} courseId={courseItem.id} />
						</div>
					{/each}
				</div>
			{:else}
				<div class="text-center text-gray-200 border-2 border-dashed border-gray-400 rounded 
							{isMobile ? 'py-2 text-xs' : 'py-4 text-sm'}">
					{isMobile ? 'Tap a course, then tap here; or click add below' : 'Drop courses here or click "Add Course" below'}
				</div>
			{/if}
			
			<!-- Course Search Button -->
			<div class="{isMobile ? 'mt-1' : 'mt-2'}">
				<CourseSearchButton
					buttonText="+ Add Course"
					placeholder="Search for courses..."
					onCourseSelected={handleCourseAdd}
				/>
			</div>
		</div>
	</div>
{/if}

<style>
	.quarter-display {
		min-height: 120px;
		transition: all 0.2s ease;
		height: auto; /* Allow flexible height */
		flex-grow: 1; /* Allow to grow to fill available space */
	}
	
	/* Mobile-specific styling */
	@media (max-width: 768px) {
		.quarter-display {
			min-height: 80px; /* Smaller minimum height on mobile */
		}
	}
	
	.quarter-display.drag-over {
		border-color: #a78bfa;
		box-shadow: 0 0 0 2px rgba(167, 139, 250, 0.3);
	}
	
	:global(.quarter-display.drag-over) {
		background-color: rgba(167, 139, 250, 0.2) !important;
	}
</style>
