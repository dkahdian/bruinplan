<!--
	Individual Major Display Page
	Shows detailed major requirements organized by sections
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { Major } from '../../../lib/types.js';
	import { getAllMajorCourses, calculateRequiredCourseCount } from '../../../lib/services/loadMajors.js';
	import { 
		completedCourses, 
		loadCompletedCourses, 
		toggleCourseCompletion, 
		getCompletedCourseSource,
		clearCompletedCourses 
	} from '../../../lib/services/completionService.js';
	import { loadCourses } from '../../../lib/services/loadCourses.js';
	import { MajorSection } from '../../../lib/components/major/index.js';
	
	export let data: { major: Major; majorId: string };
	
	$: major = data.major;
	$: majorId = data.majorId;
	
	// Initialize course map for the completion service on mount
	let coursesLoaded = false;
	
	// Get all courses for this major
	$: allCourses = getAllMajorCourses(major);
	
	// Calculate actual required course count (accounts for group needs)
	$: totalRequiredCourses = calculateRequiredCourseCount(major);
	
	// Load completion data and initialize course map for the completion service
	onMount(async () => {
		loadCompletedCourses();
		
		try {
			// Load courses to initialize the global course map store
			await loadCourses();
			coursesLoaded = true;
		} catch (error) {
			console.error('Failed to load course data:', error);
			coursesLoaded = true; // Set to true even on error to show the UI
		}
	});

	// Calculate actual completion progress using the new completion service
	$: actualCompletedCourses = coursesLoaded ? (() => {
		let actualCompleted = 0;
		
		function countActualCompleted(requirements: any[]) {
			for (const req of requirements) {
				if (req.type === 'course') {
					// Use the new completion service that automatically handles equivalents
					if (getCompletedCourseSource(req.courseId) !== null) {
						actualCompleted++;
					}
				} else if (req.type === 'group') {
					// For groups, count completed courses up to the needs count
					let groupCompleted = 0;
					for (const option of req.options) {
						if (option.type === 'course') {
							if (getCompletedCourseSource(option.courseId) !== null) {
								groupCompleted++;
							}
						}
					}
					// Only count up to the required number for this group
					actualCompleted += Math.min(groupCompleted, req.needs);
				}
			}
		}
		
		for (const section of major.sections) {
			countActualCompleted(section.requirements);
		}
		
		return actualCompleted;
	})() : 0;
	
	// Calculate total completed courses across all majors
	$: totalGlobalCompleted = $completedCourses.size;
	
	// View mode state
	let viewMode: 'list' | 'graph' = 'list';
</script>

<svelte:head>
	<title>{major.name} - BruinPlan</title>
	<meta name="description" content="Requirements and prerequisites for {major.name} at UCLA" />
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<!-- Major Header -->
	<div class="mb-8">
		<nav class="text-sm breadcrumbs mb-4">
			<a href="/majors" class="text-blue-600 hover:text-blue-800">← All Majors</a>
		</nav>
		
		<h1 class="text-3xl font-bold mb-4">{major.name}</h1>
		
		<div class="bg-gray-50 rounded-lg p-6 mb-6">
			<p class="text-lg mb-4">{major.overview}</p>
			
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
				<div>
					<strong>College:</strong>
					<br>{major.college}
				</div>
				<div>
					<strong>Department:</strong>
					<br>{major.department}
				</div>
				<div>
					<strong>Degree Level:</strong>
					<br>{major.degreeLevel}
				</div>
				<div>
					<strong>Degree:</strong>
					<br>{major.degreeObjective}
				</div>
			</div>
		</div>
		
		<!-- Quick Stats and View Toggle -->
		<div class="flex flex-wrap items-center justify-between gap-4 mb-6">
			<div class="flex flex-wrap gap-4 text-sm text-gray-600">
				<span>{allCourses.length} total course references</span>
				<span>{major.sections.length} sections</span>
				<span>{actualCompletedCourses}/{totalRequiredCourses} courses required</span>
			</div>
			
			<!-- View Mode Toggle -->
			<div class="flex bg-gray-100 rounded-lg p-1">
				<button
					class="px-3 py-1 rounded-md text-sm font-medium transition-colors
							{viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
					on:click={() => viewMode = 'list'}
				>
					📋 List View
				</button>
				<button
					class="px-3 py-1 rounded-md text-sm font-medium transition-colors
							{viewMode === 'graph' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
					on:click={() => viewMode = 'graph'}
					disabled
					title="Graph view coming soon!"
				>
					🔗 Graph View
				</button>
			</div>
		</div>
	</div>

	<!-- Major Content Based on View Mode -->
	{#if viewMode === 'list'}
		<!-- List View: Sectioned Requirements -->
		<div class="mb-6">
			<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
				<h3 class="font-semibold text-blue-800 mb-2">Requirements Overview</h3>
				<p class="text-sm text-blue-700">
					This view shows all major requirements organized by section. Click on any course to view its prerequisite tree. 
					Use the checkboxes to track your progress through the major.
				</p>
			</div>
		</div>
		
		<div class="space-y-8">
			{#each major.sections as section, index}
				<MajorSection 
					{section}
					onToggleCompletion={toggleCourseCompletion}
					sectionIndex={index}
				/>
			{/each}
		</div>
	{:else if viewMode === 'graph'}
		<!-- Graph View: Interactive Prerequisite Graph -->
		<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
			<h3 class="text-lg font-semibold text-yellow-800 mb-2">🚧 Graph View Coming Soon!</h3>
			<p class="text-yellow-700 mb-4">
				We're working on an interactive prerequisite graph that will show:
			</p>
			<ul class="text-sm text-yellow-700 text-left max-w-md mx-auto space-y-1">
				<li>• Visual prerequisite relationships between courses</li>
				<li>• Auto-detection of missing prerequisites</li>
				<li>• Optimal course sequencing suggestions</li>
				<li>• Section-grouped layout with drag-and-drop</li>
			</ul>
			<p class="text-xs text-yellow-600 mt-4">
				For now, use the List View to explore requirements and click courses to see their prerequisites.
			</p>
		</div>
	{/if}
	

	
	<!-- Completion Data Management (for testing/admin) -->
	{#if totalGlobalCompleted > 0}
		<div class="mt-6 p-3 bg-gray-50 border border-gray-200 rounded text-sm">
			<div class="flex items-center justify-between">
				<span class="text-gray-600">
					📊 Course completion data is saved locally ({totalGlobalCompleted} courses marked complete)
				</span>
				<button
					class="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs transition-colors"
					on:click={clearCompletedCourses}
					title="Clear all completion data"
				>
					Reset All
				</button>
			</div>
		</div>
	{/if}

		<!-- TODO: Add graph view toggle and visualization here -->
	<div class="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
		<p class="text-sm text-yellow-800">
			🚧 <strong>Coming soon:</strong> Interactive prerequisite graph view, missing prerequisite detection, and completion tracking.
		</p>
	</div>
</div>