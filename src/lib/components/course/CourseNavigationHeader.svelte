<!-- CourseNavigationHeader.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Course } from '../../types.js';
	import { searchCoursesNew } from '../../services/shared/search.js';

	export let courseId: string;

	let isSearchExpanded = false;
	let searchQuery = '';
	let searchResults: Course[] = [];
	let isSearching = false;

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
				maxResults: 10
			});
		} catch (error) {
			console.error('Search failed:', error);
			searchResults = [];
		} finally {
			isSearching = false;
		}
	}

	// Debounced search
	let searchTimeout: ReturnType<typeof setTimeout> | null = null;
	$: {
		if (searchTimeout) clearTimeout(searchTimeout);
		
		if (searchQuery.trim()) {
			searchTimeout = setTimeout(() => performSearch(searchQuery), 300);
		} else {
			searchResults = [];
			isSearching = false;
		}
	}

	// Handle course selection from search - use proper URL navigation
	function onCourseSelected(course: Course) {
		// Convert course ID to URL format (remove spaces and special characters)
		const urlCourseId = course.id.replace(/[^A-Z0-9]/g, '');
		
		// Navigate to the course page using SvelteKit's goto
		goto(`/courses/${urlCourseId}`);
		
		// Close search
		isSearchExpanded = false;
		searchQuery = '';
		searchResults = [];
	}

	// Handle clicking the course ID to toggle search
	function toggleSearch(event: MouseEvent) {
		event.stopPropagation();
		isSearchExpanded = !isSearchExpanded;
		if (!isSearchExpanded) {
			searchQuery = '';
			searchResults = [];
		}
	}
</script>

<div class="course-navigation-header bg-white border-b border-gray-200 px-4 py-3">
	<div class="max-w-7xl mx-auto">
		<div class="flex items-center justify-between relative">
			<!-- Left side: Title and course search -->
			<div class="flex items-center gap-3">
				<div class="flex items-center gap-2">
					<span class="text-lg font-bold text-gray-900">Prerequisites for</span>
					<button
						class="inline-flex items-center gap-1 px-3 py-1 rounded-md text-lg font-medium bg-purple-100 text-blue-700 hover:bg-purple-200 transition-colors cursor-pointer"
						on:click={toggleSearch}
						type="button"
					>
						{courseId}
						<svg class="w-3 h-3 transform transition-transform {isSearchExpanded ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
						</svg>
					</button>
				</div>

				<!-- Right side: Navigation links (close to the left content) -->
				<div class="flex items-center gap-4 ml-6">
					<a
						href="/courses"
						class="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
					>
						Back to all courses
					</a>
					<a
						href="/majors"
						class="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
					>
						See majors
					</a>
				</div>
			</div>

			<!-- Search section (absolutely positioned below header) -->
			{#if isSearchExpanded}
				<div class="absolute top-full left-0 w-full max-w-md mt-2 z-50">
					<div class="bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
						<!-- Search input section -->
						<div class="p-3 border-b border-gray-200">
							<input
								type="text"
								placeholder="Type course ID or name..."
								bind:value={searchQuery}
								class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
								autocomplete="off"
							/>
						</div>
						
						<!-- Search results section -->
						<div class="max-h-60 overflow-y-auto">
							{#if isSearching}
								<div class="px-3 py-4 text-center text-sm text-gray-500">
									<div class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
									<span class="ml-2">Searching...</span>
								</div>
							{:else if searchResults.length > 0}
								{#each searchResults as course}
									<button
										class="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors cursor-pointer"
										on:click={() => onCourseSelected(course)}
										type="button"
									>
										<div class="font-medium text-gray-900 text-sm">{course.id}</div>
										<div class="text-xs text-gray-600 truncate">{course.title}</div>
										<div class="text-xs text-gray-500">{course.units} units</div>
									</button>
								{/each}
							{:else if searchQuery.trim()}
								<div class="px-3 py-4 text-sm text-gray-500 text-center">
									No courses found matching "{searchQuery}"
								</div>
							{:else}
								<div class="px-3 py-4 text-sm text-gray-500 text-center">
									Start typing to search for courses...
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.course-navigation-header {
		position: sticky;
		top: 0;
		z-index: 10;
	}
</style>
