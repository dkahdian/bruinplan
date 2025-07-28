<!-- PrerequisiteGraph.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import GraphContainer from './GraphContainer.svelte';
	import GraphLegend from './GraphLegend.svelte';
	import { buildPrerequisiteGraphAsync } from '../../services/graph/index.js';
	import { getCourseById } from '../../data-layer/api.js';
	import { initializeSchedulingService, courseSchedulesStore } from '../../services/schedulingServices.js';
	import { loadLegendState, saveLegendState, type LegendState } from '../../services/shared/legendState.js';
	import { courseMapStore } from '../../services/shared/coursesStore.js';
	import type { Course } from '../../types.js';
	import type { GraphNode, GraphEdge } from '../../services/graph/types.js';

	export let courseId: string;
	export let showWarnings: boolean = false;
	export let showCompletedCourses: boolean = true;
	export let userCompletedCourses: Set<string> = new Set();
	
	// Svelte 5 event callback props
	export let oncourseselect: ((course: Course) => void) | undefined = undefined;
	export let onbackgroundclick: (() => void) | undefined = undefined;
	
	let course: Course | null = null;
	let nodes: GraphNode[] = [];
	let edges: GraphEdge[] = [];
	let isLoading = true;
	let error: string | null = null;
	let courseMap = new Map<string, Course>();
	let isInitialized = false;
	let previousSchedules: Record<string, number> = {};

	// Initialize state from localStorage
	function initializeFromLocalStorage() {
		if (browser && !isInitialized) {
			const savedState = loadLegendState();
			showWarnings = savedState.showWarnings;
			showCompletedCourses = savedState.showCompletedCourses;
			isInitialized = true;
		}
	}

	// Load course data first, then build graph
	async function loadCourse() {
		if (!courseId) return;
		
		try {
			const loadedCourse = await getCourseById(courseId);
			if (loadedCourse) {
				course = loadedCourse;
				courseMap.set(loadedCourse.id, loadedCourse);
				await loadGraph();
			} else {
				error = 'Course not found';
			}
		} catch (err) {
			console.error('Error loading course:', err);
			error = err instanceof Error ? err.message : 'Error loading course data';
		}
	}

	// Load the graph when course is available
	async function loadGraph() {
		if (!course) return;
		
		isLoading = true;
		error = null;
		
		try {
			const result = await buildPrerequisiteGraphAsync(
				course.id, 
				courseMap,
				{
					userCompletedCourses,
					showCompletedCourses,
					showWarnings
				}
			);
			
			nodes = result.nodes;
			edges = result.edges;
			
			// Update global course map store with loaded courses (only if there are new courses)
			courseMapStore.update(globalMap => {
				const newMap = new Map(globalMap);
				let addedCourses = 0;
				courseMap.forEach((course, courseId) => {
					if (!newMap.has(courseId)) {
						newMap.set(courseId, course);
						addedCourses++;
					}
				});
				if (addedCourses > 0) {
					// Updated global course map with new courses
				}
				return newMap;
			});
		} catch (err) {
			console.error('Error building graph:', err);
			error = err instanceof Error ? err.message : 'Unknown error occurred';
		} finally {
			isLoading = false;
		}
	}

	// Handle course selection from graph
	function onCourseSelect(course: Course) {
		courseMap.set(course.id, course);
		oncourseselect?.(course);
	}

	// Handle background click to reset selection
	function onBackgroundClick() {
		onbackgroundclick?.();
	}

	// Handle courseId changes
	function handleCourseIdChange(newCourseId: string) {
		if (newCourseId && newCourseId !== courseId) {
			loadCourse();
		}
	}

	// Load course on mount
	onMount(() => {
		initializeSchedulingService();
		initializeFromLocalStorage();
		loadCourse();
	});

	// Handle toggle changes
	function handleToggleChange() {
		if (course && !isLoading && isInitialized) {
			loadGraph();
			// Save state to localStorage
			const currentState: LegendState = {
				isExpanded: true, // We don't track this in PrerequisiteGraph
				showWarnings,
				showCompletedCourses
			};
			saveLegendState(currentState);
		}
	}

	// Watch for courseId changes
	$: handleCourseIdChange(courseId);
	
	// Watch for specific toggle changes only (after initialization)
	$: if (isInitialized) {
		showWarnings, showCompletedCourses, handleToggleChange();
	}

	// Watch for course schedule changes and rebuild graph
	$: if (isInitialized && $courseSchedulesStore) {
		// Only rebuild if schedules actually changed
		const currentSchedules = $courseSchedulesStore;
		const schedulesChanged = JSON.stringify(currentSchedules) !== JSON.stringify(previousSchedules);
		
		if (schedulesChanged) {
			previousSchedules = { ...currentSchedules };
			loadCourse();
		}
	}

	// Handle toggle for showCompletedCourses
	function toggleShowCompletedCourses() {
		showCompletedCourses = !showCompletedCourses;
		// The reactive statement above will handle saving and reloading
	}

	// Determine if we should show empty graph message
	$: shouldShowEmptyMessage = !isLoading && !error && course && edges.length === 0;
</script>

<div class="prerequisite-graph-container">
	{#if isLoading}
		<div class="loading">Loading prerequisite graph...</div>
	{:else if error}
		<div class="error">Error loading graph: {error}</div>
	{:else if !course}
		<div class="error">Course not found</div>
	{:else if shouldShowEmptyMessage}
		<div class="empty-graph">
			<div class="empty-message">
				No prerequisites found for {course.id}
			</div>
			{#if !showCompletedCourses}
				<button 
					class="show-completed-link"
					on:click={toggleShowCompletedCourses}
					type="button"
				>
					Try showing completed courses?
				</button>
			{/if}
		</div>
	{:else}
		<!-- Graph container (full width) -->
		<GraphContainer
			{nodes}
			{edges}
			graphWidthPercent={100}
			{showWarnings}
			{showCompletedCourses}
			{userCompletedCourses}
			{onCourseSelect}
			{onBackgroundClick}
		/>
		
		<!-- Graph Legend (positioned absolutely in bottom-left of graph) -->
		<GraphLegend 
			bind:showWarnings={showWarnings}
			bind:showCompletedCourses={showCompletedCourses}
			{userCompletedCourses}
		/>
	{/if}
</div>

<style>
	.prerequisite-graph-container {
		width: 100%;
		height: 100%;
		border: none;
		border-radius: 0;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		background-color: #f9fafb;
		position: relative;
	}

	.loading,
	.error,
	.empty-graph {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		padding: 2rem;
		text-align: center;
		flex: 1;
		flex-direction: column;
		gap: 1rem;
	}

	.error {
		color: #ef4444;
		background-color: #fef2f2;
	}

	.loading {
		color: #6b7280;
		background-color: #f9fafb;
	}

	.empty-graph {
		color: #9ca3af;
		background-color: #f9fafb;
	}

	.empty-message {
		font-size: 1.125rem; /* Medium size */
		font-weight: 500;
	}

	.show-completed-link {
		color: #3b82f6;
		background-color: #f3e8ff; /* Light purple background */
		border: none;
		cursor: pointer;
		font-size: 1rem;
		padding: 0.5rem 1rem;
		border-radius: 0.375rem; /* Rounded corners */
		transition: background-color 0.2s, color 0.2s;
		text-decoration: none; /* Remove underline */
	}

	.show-completed-link:hover {
		background-color: #e9d5ff; /* Slightly darker purple on hover */
		color: #1d4ed8;
	}
</style>
