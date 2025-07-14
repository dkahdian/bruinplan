<!--
	Quarter Display Component
	Shows a single quarter with its courses and unit information
	Supports drag-and-drop course assignment
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { formatQuarterCode, schedulingService } from '../../services/shared/schedulingService.js';
	import { courseMapStore } from '../../services/data/loadCourses.js';
	import CourseSearchButton from '../shared/CourseSearchButton.svelte';
	import type { Course } from '../../types.js';

	export let quarterCode: number;
	export let courses: string[] = [];
	export let isLastQuarter: boolean = false;
	export let canRemove: boolean = true;
	export let availableCourses: Course[] = [];
	export let onRemoveQuarter: (quarterCode: number) => void = () => {};

	// Ensure availableCourses is loaded on mount if not provided
	onMount(() => {
		if (!availableCourses || availableCourses.length === 0) {
			availableCourses = Array.from($courseMapStore.values());
		}
	});

	// Calculate total units for this quarter (reactive to courseMapStore changes)
	$: totalUnits = courses.reduce((sum, courseId) => {
		const course = $courseMapStore.get(courseId);
		return sum + (course?.units || 0);
	}, 0);

	// Format quarter display
	$: quarterName = formatQuarterCode(quarterCode);

	// Transform courses for display
	$: courseItems = courses.map(courseId => ({
		id: courseId,
		name: courseId, // Use courseId as name since Course interface doesn't have name
		units: $courseMapStore.get(courseId)?.units || 0
	}));

	// Drag and drop state
	let isDraggedOver = false;
	let isDragging = false;
	let draggedCourseId: string | null = null;

	// Handle drag start from course items within quarters
	function handleCourseDragStart(event: DragEvent, courseId: string) {
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

	function handleCourseDragEnd() {
		isDragging = false;
		draggedCourseId = null;
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

<div class="quarter-display border rounded-lg p-4 shadow-sm bg-purple-700 text-white {isDraggedOver ? 'drag-over' : ''}"
	on:drop={handleDrop}
	on:dragover={handleDragOver}
	on:dragenter={handleDragEnter}
	on:dragleave={handleDragLeave}
	role="region"
	aria-label="Quarter {quarterName} - Drop zone for courses"
>
	<!-- Quarter Header -->
	<div class="flex items-center justify-between mb-3">
		<div class="flex items-center gap-2">
			<h3 class="font-semibold text-white">{quarterName}</h3>
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
		<div class="text-sm px-2 py-1 rounded bg-blue-100 text-blue-700">
			{totalUnits} units
		</div>
	</div>
	
	<!-- Course List -->
	<div class="space-y-2">
		{#if courseItems.length > 0}
			<div class="space-y-2">
				{#each courseItems as courseItem (courseItem.id)}
					<div 
						class="flex items-center justify-between p-2 rounded transition-colors cursor-move bg-purple-100 border-purple-300 text-purple-800 {isDragging && draggedCourseId === courseItem.id ? 'opacity-50' : ''}"
						draggable="true"
						on:dragstart={(e) => handleCourseDragStart(e, courseItem.id)}
						on:dragend={handleCourseDragEnd}
						role="listitem"
						aria-label="Draggable course {courseItem.id}"
					>
						<div class="flex items-center gap-2">
							<a
								href={`/courses/${courseItem.id.replace(/\s+/g, '')}`}
								class="font-medium text-sm text-purple-800 hover:text-blue-800 flex items-center gap-1"
								title="View prerequisites for {courseItem.id}"
								target="_blank"
							>
								{courseItem.id}
								<span class="text-xs opacity-75">({courseItem.units} units)</span>
							</a>
						</div>
						<button
							class="text-gray-500 hover:text-red-600 transition-colors"
							on:click|stopPropagation={() => handleCourseRemove(courseItem.id)}
							title="Remove from this quarter"
							aria-label="Remove {courseItem.id} from this quarter"
						>
							<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
							</svg>
						</button>
					</div>
				{/each}
			</div>
		{:else}
			<div class="text-center py-4 text-gray-200 text-sm border-2 border-dashed border-gray-400 rounded">
				Drop courses here or click "Add Course" below
			</div>
		{/if}
		
		<!-- Course Search Button -->
		<div class="mt-2">
			<CourseSearchButton
				courses={availableCourses}
				buttonText="+ Add Course"
				placeholder="Search for courses..."
				onCourseSelected={handleCourseAdd}
			/>
		</div>
	</div>
</div>

<style>
	.quarter-display {
		min-height: 120px;
		transition: all 0.2s ease;
	}
	
	.quarter-display.drag-over {
		border-color: #a78bfa;
		box-shadow: 0 0 0 2px rgba(167, 139, 250, 0.3);
	}
	
	:global(.quarter-display.drag-over) {
		background-color: rgba(167, 139, 250, 0.2) !important;
	}
</style>
