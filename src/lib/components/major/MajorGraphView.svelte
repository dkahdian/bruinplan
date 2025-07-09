<!--
	Major Graph View Component
	Displays major requirements as an interactive graph using the modular graph system
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { Major } from '../../types.js';
	import type { GraphNode, GraphEdge } from '../../services/graph/types.js';
	import GraphContainer from '../graph/GraphContainer.svelte';
	import { buildMajorGraph } from '../../services/major/majorGraphService.js';
	import { majorGraphStyles, majorGraphLayoutOptions } from '../../services/graph/cytoscapeConfig.js';
	import { completedCourses, getCompletedCourseSource } from '../../services/shared/completionService.js';
	import { loadLegendState } from '../../services/shared/legendStateService.js';
	
	export let major: Major;
	export let onCourseSelect: (courseId: string) => void = () => {};
	
	let nodes: GraphNode[] = [];
	let edges: GraphEdge[] = [];
	let isLoading = true;
	let error: string | null = null;
	
	// Graph view settings - initialize from localStorage
	const savedLegendState = loadLegendState();
	let showWarnings = savedLegendState.showWarnings;
	let showRecommended = savedLegendState.showRecommended;
	let showCompletedCourses = savedLegendState.showCompletedCourses;
	let graphWidthPercent = 100;

	// Remove the onMount initialization since we're doing it at declaration time

	// Enforce prerequisite hierarchy: Enforced → Warning → Recommended
	$: {
		if (!showWarnings && showRecommended) {
			showRecommended = false;
		}
	}
	
	// Reactively build the major graph when major or toggle settings change
	$: if (major && showWarnings !== undefined && showRecommended !== undefined && showCompletedCourses !== undefined) {
		buildGraph();
	}
	
	async function buildGraph() {
		try {
			isLoading = true;
			error = null;
			
			console.log('Building graph for major:', major.name);
			console.log('Major sections:', major.sections.length);
			console.log('Graph options:', { showWarnings, showRecommended, showCompletedCourses });
			
			const result = await buildMajorGraph(major, {
				showWarnings,
				showRecommended,
				userCompletedCourses: $completedCourses,
				showCompletedCourses
			});
			
			console.log('Graph built successfully:', result.nodes.length, 'nodes,', result.edges.length, 'edges');
			nodes = result.nodes;
			edges = result.edges;
		} catch (err) {
			console.error('Failed to build major graph:', err);
			console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace');
			error = err instanceof Error ? err.message : 'Failed to build major graph';
		} finally {
			isLoading = false;
		}
	}
	
	function handleCourseSelect(course: any) {
		if (course && course.id) {
			onCourseSelect(course.id);
		}
	}
	
	function handleBackgroundClick() {
		// Could be used to reset selection or show major overview
	}
</script>

<div class="major-graph-container">
	{#if isLoading}
		<div class="flex items-center justify-center h-96 bg-gray-50 rounded-lg border">
			<div class="text-center">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
				<p class="text-gray-600">Building major graph...</p>
			</div>
		</div>
	{:else if error}
		<div class="bg-red-50 border border-red-200 rounded-lg p-6">
			<h3 class="text-lg font-semibold text-red-800 mb-2">Error Building Graph</h3>
			<p class="text-red-700 mb-4">{error}</p>
			<button
				class="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded transition-colors"
				on:click={buildGraph}
			>
				Try Again
			</button>
		</div>
	{:else if nodes.length === 0}
		<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
			<h3 class="text-lg font-semibold text-yellow-800 mb-2">No Graph Data</h3>
			<p class="text-yellow-700">No courses found to display in the graph view.</p>
		</div>
	{:else}
		<!-- Graph Container -->
		<div class="bg-white rounded-lg border shadow-sm">
			<div class="p-4 border-b border-gray-200">
				<h3 class="text-lg font-semibold text-gray-900 mb-2">
					{major.name} - Requirements Graph
				</h3>
				<p class="text-sm text-gray-600">
					This graph shows all courses in your major requirements. 
					Courses are grouped by section and colored by completion status.
				</p>
			</div>
			
			<div class="h-96">
				<GraphContainer
					{nodes}
					{edges}
					enableTooltips={true}
					{graphWidthPercent}
					bind:showWarnings
					bind:showRecommended
					bind:showCompletedCourses
					userCompletedCourses={$completedCourses}
					onCourseSelect={handleCourseSelect}
					onBackgroundClick={handleBackgroundClick}
					customStyles={majorGraphStyles}
					layoutOptions={majorGraphLayoutOptions}
				/>
			</div>
		</div>
	{/if}
</div>

<style>
	.major-graph-container {
		/* Ensure the graph container takes up the full available space */
		min-height: 400px;
	}
</style>
