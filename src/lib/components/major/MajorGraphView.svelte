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
	import { completedCoursesStore, schedulingService } from '../../services/shared/schedulingService.js';
	import { loadLegendState } from '../../services/shared/legendStateService.js';
	
	export let major: Major;
	export let onCourseSelect: (courseId: string) => void = () => {};
	
	let nodes: GraphNode[] = [];
	let edges: GraphEdge[] = [];
	let parentChildMap = new Map<string, string[]>();
	let isLoading = true;
	let error: string | null = null;
	let graphContainer: GraphContainer;
	
	// Graph view settings - initialize from localStorage
	const savedLegendState = loadLegendState();
	let showWarnings = savedLegendState.showWarnings;
	let showRecommended = savedLegendState.showRecommended;
	let showCompletedCourses = savedLegendState.showCompletedCourses;
	let graphWidthPercent = 100;
	
	// Compound node (sections and groups) open/closed state tracking (not persisted)
	let compoundNodeState = new Map<string, boolean>();
	
	// Fullscreen state
	let isFullscreen = false;

	/**
	 * Determines if a compound node should be closed by default
	 * @param nodeId - The compound node ID to check
	 * @param nodeType - The type of compound node ('section' or 'group')
	 * @param section - The section data (for section nodes)
	 * @param group - The group data (for group nodes)
	 * @returns true if the compound node should be closed by default
	 */
	function shouldCompoundNodeBeClosedByDefault(nodeId: string, nodeType: string, section?: any, group?: any): boolean {
		if (nodeType === 'section' && section) {
			// Close sections with many requirements (more than 15 items) by default
			if (section.requirements && section.requirements.length > 15) {
				return true;
			}
			
			// Close sections with "elective" in the title (case insensitive)
			if (section.title && section.title.toLowerCase().includes('elective')) {
				return true;
			}
		}
		
		if (nodeType === 'group' && group) {
			// Close groups with many options (more than 8 items) by default
			if (group.options && group.options.length > 8) {
				return true;
			}
			
			// Close groups with "elective" in the title (case insensitive)
			if (group.title && group.title.toLowerCase().includes('elective')) {
				return true;
			}
		}
		
		// Keep other compound nodes open by default
		return false;
	}

	/**
	 * Initialize compound node open/closed state based on default rules
	 */
	function initializeCompoundNodeState() {
		compoundNodeState.clear();
		
		// Initialize section states
		major.sections.forEach(section => {
			const sectionId = `section-${section.id}`;
			compoundNodeState.set(sectionId, !shouldCompoundNodeBeClosedByDefault(sectionId, 'section', section));
		});
		
		// Note: Group states will be initialized during graph building since groups are created dynamically
		compoundNodeState = compoundNodeState; // Trigger reactivity
	}

	// Remove the onMount initialization since we're doing it at declaration time

	// Enforce prerequisite hierarchy: Enforced → Warning → Recommended
	$: {
		if (!showWarnings && showRecommended) {
			showRecommended = false;
		}
	}
	
	// Reactively build the major graph when major or toggle settings change
	$: if (major && showWarnings !== undefined && showRecommended !== undefined && showCompletedCourses !== undefined && $completedCoursesStore) {
		// Initialize compound node state when major changes
		if (compoundNodeState.size === 0) {
			initializeCompoundNodeState();
		}
		buildGraph();
	}
	
	async function buildGraph() {
		// Close any open tooltips before rebuilding
		if (graphContainer) {
			graphContainer.closeTooltips();
		}
		
		try {
			isLoading = true;
			error = null;
			
			console.log('Building graph for major:', major.name);
			console.log('Major sections:', major.sections.length);
			console.log('Graph options:', { showWarnings, showRecommended, showCompletedCourses });
			
			const result = await buildMajorGraph(major, {
				showWarnings,
				showRecommended,
				userCompletedCourses: $completedCoursesStore,
				showCompletedCourses,
				compoundNodeState
			});
			
			console.log('Graph built successfully:', result.nodes.length, 'nodes,', result.edges.length, 'edges');
			nodes = result.nodes;
			edges = result.edges;
			parentChildMap = result.parentChildMap;
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
	
	function handleSectionToggle(nodeId: string) {
		// Toggle the compound node's open/closed state
        console.log(`Toggling compound node ${nodeId}`);
		const currentState = compoundNodeState.get(nodeId) ?? true;
		const newState = !currentState;
		
		// Apply hierarchical rules
		if (newState === false) {
			// Closing a node: close all its children
			closeNodeAndChildren(nodeId);
		} else {
			// Opening a node: open all its parents and the node itself
			openNodeAndParents(nodeId);
		}
		
		compoundNodeState = compoundNodeState; // Trigger reactivity
		
		// Rebuild the graph with the new compound node state
		buildGraph();
	}
	
	/**
	 * Close a node and all its children recursively
	 */
	function closeNodeAndChildren(nodeId: string) {
		compoundNodeState.set(nodeId, false);
		
		// Find and close all children of this node
		const children = parentChildMap.get(nodeId) || [];
		children.forEach(childId => {
			closeNodeAndChildren(childId); // Recursive close
		});
	}
	
	/**
	 * Open a node and all its parents recursively
	 */
	function openNodeAndParents(nodeId: string) {
		compoundNodeState.set(nodeId, true);
		
		// Find and open the parent of this node
		const parentId = getParentNodeId(nodeId);
		if (parentId && compoundNodeState.has(parentId)) {
			openNodeAndParents(parentId); // Recursive open
		}
	}
	
	/**
	 * Check if childId is a child of parentId
	 */
	function isChildOf(childId: string, parentId: string): boolean {
		const children = parentChildMap.get(parentId) || [];
		return children.includes(childId);
	}
	
	/**
	 * Get the parent node ID for a given node
	 */
	function getParentNodeId(nodeId: string): string | null {
		// Search through the parent-child map to find the parent of this node
		for (const [parentId, children] of parentChildMap) {
			if (children.includes(nodeId)) {
				return parentId;
			}
		}
		return null;
	}
	
	function handleBackgroundClick() {
		// Could be used to reset selection or show major overview
	}
	
	/**
	 * Toggle fullscreen mode
	 */
	function toggleFullscreen() {
		isFullscreen = !isFullscreen;
		
		// Allow the DOM to update then resize the graph
		setTimeout(() => {
			if (graphContainer) {
				const cy = graphContainer.getCytoscapeInstance();
				if (cy) {
					cy.resize();
					cy.fit();
				}
			}
		}, 100);
	}
	
	/**
	 * Exit fullscreen mode (for escape key)
	 */
	function exitFullscreen() {
		isFullscreen = false;
		
		// Allow the DOM to update then resize the graph
		setTimeout(() => {
			if (graphContainer) {
				const cy = graphContainer.getCytoscapeInstance();
				if (cy) {
					cy.resize();
					cy.fit();
				}
			}
		}, 100);
	}
	
	/**
	 * Handle keyboard shortcuts
	 */
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && isFullscreen) {
			exitFullscreen();
		}
	}
</script>

<!-- Keyboard event listener for fullscreen mode -->
<svelte:window on:keydown={handleKeydown} />

<!-- Fullscreen overlay -->
{#if isFullscreen}
	<div class="fixed inset-0 z-50 bg-white">
		<div class="h-full flex flex-col">
			<!-- Fullscreen header -->
			<div class="flex-shrink-0 p-4 border-b border-gray-200 bg-white">
				<div class="flex items-center justify-between">
					<div>
						<h3 class="text-lg font-semibold text-gray-900">
							{major.name} - Requirements Graph
						</h3>
						<p class="text-sm text-gray-600">
							This graph shows all courses in your major requirements.
						</p>
					</div>
					<button
						class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
						on:click={toggleFullscreen}
						title="Exit fullscreen"
					>
						<!-- Exit fullscreen icon -->
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
      d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5
         M15 9h4.5M15 9V4.5M15 9l5.5-5.5
         M9 15v4.5M9 15H4.5M9 15l-5.5 5.5
         M15 15v4.5M15 15h4.5M15 15l5.5 5.5"/>
						</svg>
					</button>
				</div>
			</div>
			
			<!-- Fullscreen graph container -->
			<div class="flex-1 min-h-0">
				<GraphContainer
					bind:this={graphContainer}
					{nodes}
					{edges}
					enableTooltips={true}
					{graphWidthPercent}
					bind:showWarnings
					bind:showRecommended
					bind:showCompletedCourses
					userCompletedCourses={$completedCoursesStore}
					onCourseSelect={handleCourseSelect}
					onSectionToggle={handleSectionToggle}
					onBackgroundClick={handleBackgroundClick}
					customStyles={majorGraphStyles}
					layoutOptions={majorGraphLayoutOptions}
					animationConfig={{
						enabled: true,
						duration: 800,
						easing: 'ease-out',
						preserveCompletedPositions: true
					}}
				/>
			</div>
		</div>
	</div>
{/if}
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
		<div class="bg-white rounded-lg border shadow-sm relative">
			<div class="p-4 border-b border-gray-200">
				<h3 class="text-lg font-semibold text-gray-900 mb-2">
					{major.name} - Requirements Graph
				</h3>
				<p class="text-sm text-gray-600">
					This graph shows all courses in your major requirements. 
					Courses are grouped by section and colored by completion status.
				</p>
				
				<!-- Fullscreen Toggle Button -->
				<button
					class="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
					on:click={toggleFullscreen}
					title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
				>
					{#if isFullscreen}
						<!-- Exit fullscreen icon -->
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M15 9h4.5M15 9V4.5M15 9l5.5-5.5M9 15v4.5M9 15H4.5M9 15l-5.5 5.5M15 15h4.5M15 15v4.5M15 15l5.5 5.5"/>
						</svg>
					{:else}
						<!-- Enter fullscreen icon -->
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
						</svg>
					{/if}
				</button>
			</div>
			
			<div class="h-[80vh] min-h-96">
				<GraphContainer
					bind:this={graphContainer}
					{nodes}
					{edges}
					enableTooltips={true}
					{graphWidthPercent}
					bind:showWarnings
					bind:showRecommended
					bind:showCompletedCourses
					userCompletedCourses={$completedCoursesStore}
					onCourseSelect={handleCourseSelect}
					onSectionToggle={handleSectionToggle}
					onBackgroundClick={handleBackgroundClick}
					customStyles={majorGraphStyles}
					layoutOptions={majorGraphLayoutOptions}
					animationConfig={{
						enabled: true,
						duration: 800,
						easing: 'ease-out',
						preserveCompletedPositions: true
					}}
				/>
			</div>
		</div>
	{/if}
</div>
