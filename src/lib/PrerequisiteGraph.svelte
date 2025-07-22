<!-- PrerequisiteGraph.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import GraphContainer from './components/graph/GraphContainer.svelte';
	import { buildPrerequisiteGraphAsync } from './services/graph/graphBuilder.js';
	import { getCourseById } from './data-layer/api.js';
	import type { Course } from './types.js';
	import type { GraphNode, GraphEdge } from './services/graph/types.js';

	export let courseId: string;
	
	let course: Course | null = null;
	let nodes: GraphNode[] = [];
	let edges: GraphEdge[] = [];
	let isLoading = true;
	let error: string | null = null;

	// Default props for GraphContainer
	const defaultUserCompletedCourses = new Set<string>();
	const graphWidthPercent = 100;
	const showWarnings = false;
	const showCompletedCourses = true;

	// Load course data first, then build graph
	async function loadCourse() {
		console.log('loadCourse called for courseId:', courseId);
		if (!courseId) return;
		
		try {
			const loadedCourse = await getCourseById(courseId);
			if (loadedCourse) {
				course = loadedCourse;
				console.log('Course loaded:', course.id);
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
		console.log('loadGraph called for course:', course?.id);
		if (!course) return;
		
		isLoading = true;
		error = null;
		
		try {
			const result = await buildPrerequisiteGraphAsync(course.id);
			console.log('Graph build result:', result);
			
			nodes = result.nodes;
			edges = result.edges;
			
			console.log('Setting nodes:', nodes.length, 'edges:', edges.length);
		} catch (err) {
			console.error('Error building graph:', err);
			error = err instanceof Error ? err.message : 'Unknown error occurred';
		} finally {
			isLoading = false;
		}
	}

	// Handle courseId changes
	function handleCourseIdChange(newCourseId: string) {
		console.log('CourseId changed from', courseId, 'to', newCourseId);
		if (newCourseId && newCourseId !== courseId) {
			loadCourse();
		}
	}

	// Handle graph interactions
	function onCourseSelect(course: any) {
		console.log('Course selected:', course);
		// Handle course selection
	}

	function onBackgroundClick() {
		console.log('Background clicked');
		// Handle background clicks
	}

	// Load course on mount
	onMount(() => {
		console.log('PrerequisiteGraph mounted with courseId:', courseId);
		loadCourse();
	});

	// Watch for courseId changes
	$: handleCourseIdChange(courseId);
</script>

<div class="prerequisite-graph-container">
	{#if isLoading}
		<div class="loading">Loading prerequisite graph...</div>
	{:else if error}
		<div class="error">Error loading graph: {error}</div>
	{:else if !course}
		<div class="error">Course not found</div>
	{:else}
		<GraphContainer
			{nodes}
			{edges}
			{graphWidthPercent}
			{showWarnings}
			{showCompletedCourses}
			userCompletedCourses={defaultUserCompletedCourses}
			{onCourseSelect}
			{onBackgroundClick}
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
	}

	.loading,
	.error {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		padding: 2rem;
		text-align: center;
		flex: 1;
	}

	.error {
		color: #ef4444;
		background-color: #fef2f2;
	}

	.loading {
		color: #6b7280;
		background-color: #f9fafb;
	}
</style>
