<!--
	Course Search Button Component
	Provides a searchable dropdown for adding courses to a quarter
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { Course } from '../../types.js';
	import { searchCoursesNew } from '../../services/shared/searchService.js';

	export let placeholder: string = 'Search for courses...';
	export let buttonText: string = 'Add Course';
	export let maxResults: number = 10;
	export let onCourseSelected: (course: Course) => void = () => {};

	let isSearchExpanded = false;
	let searchQuery = '';
	let searchResults: Course[] = [];
	let isSearching = false;
	let searchContainer: HTMLDivElement;

	// Search function with debouncing
	async function performSearch(query: string) {
		if (!query.trim()) {
			searchResults = [];
			isSearching = false;
			return;
		}

		isSearching = true;
		try {
			searchResults = await searchCoursesNew(query, {
				maxResults,
				enableLogging: false
			});
		} catch (error) {
			console.error('Search failed:', error);
			searchResults = [];
		} finally {
			isSearching = false;
		}
	}

	// Debounced search with reactive statement
	let searchTimeout: ReturnType<typeof setTimeout> | null = null;
	$: {
		if (searchTimeout) clearTimeout(searchTimeout);
		
		if (searchQuery.trim()) {
			searchTimeout = setTimeout(() => performSearch(searchQuery), 200);
		} else {
			searchResults = [];
			isSearching = false;
		}
	}

	// Function to handle course selection
	function selectCourse(selectedCourse: Course) {
		onCourseSelected(selectedCourse);
		// Close the dropdown and clear search
		isSearchExpanded = false;
		searchQuery = '';
	}

	// Close search dropdown when clicking outside
	function handleClickOutside(event: MouseEvent) {
		if (searchContainer && !searchContainer.contains(event.target as Node)) {
			isSearchExpanded = false;
			searchQuery = '';
		}
	}

	// Add click outside listener
	onMount(() => {
		document.addEventListener('click', handleClickOutside);
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<div class="relative" bind:this={searchContainer}>
	<button 
		class="w-full py-2 px-3 border-2 border-dashed border-gray-300 rounded-lg text-white hover:border-purple-400 hover:text-purple-100 transition-colors text-sm"
		on:click={() => isSearchExpanded = !isSearchExpanded}
		type="button"
	>
		{buttonText}
	</button>
	
	<!-- Search dropdown -->
	{#if isSearchExpanded}
		<div class="absolute top-full left-0 mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-50">
			<div class="p-3">
				<input
					type="text"
					placeholder={placeholder}
					bind:value={searchQuery}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
					autocomplete="off"
				/>
			</div>
			
			{#if isSearching}
				<div class="px-3 py-4 text-center border-t border-gray-200 text-sm text-gray-500">
					<div class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
					<span class="ml-2">Searching...</span>
				</div>
			{:else if searchResults.length > 0}
				<div class="max-h-60 overflow-y-auto border-t border-gray-200">
					{#each searchResults as course}
						<button
							class="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors cursor-pointer"
							on:click={() => selectCourse(course)}
							type="button"
						>
							<div class="font-medium text-gray-900 text-sm">{course.id}</div>
							<div class="text-xs text-gray-600 truncate">{course.title}</div>
							<div class="text-xs text-gray-500">{course.units} units</div>
						</button>
					{/each}
				</div>
			{:else if searchQuery.trim()}
				<div class="px-3 py-4 text-gray-500 text-center border-t border-gray-200 text-sm">
					No courses found matching "{searchQuery}"
				</div>
			{:else}
				<div class="px-3 py-4 text-gray-500 text-center border-t border-gray-200 text-sm">
					Start typing to search for courses...
				</div>
			{/if}
		</div>
	{/if}
</div>
