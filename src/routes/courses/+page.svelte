<script lang="ts">
	import { base } from '$app/paths';
	import { searchCoursesNew } from '../../lib/services/shared/search.js';
	import Footer from '../../lib/components/shared/Footer.svelte';
	import type { Course } from '../../lib/types.js';

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
				maxResults: 20
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
			searchTimeout = setTimeout(() => performSearch(searchQuery), 300);
		} else {
			searchResults = [];
			isSearching = false;
		}
	}

	// Function to navigate to a selected course
	function selectCourse(courseId: string) {
		// Remove spaces from course ID for URL compatibility
		const urlSafeCourseId = courseId.replace(/[^A-Z0-9]/g, '');
		// Navigate to the new course page
		window.location.href = `${base}/courses/${urlSafeCourseId}`;
	}
</script>

<svelte:head>
	<title>Course Search - BruinPlan</title>
	<meta name="description" content="Search UCLA courses and view their prerequisite graphs" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-600 to-blue-200">
	<!-- Header Section -->
	<div class="bg-gradient-to-r from-blue-700 to-blue-500 text-white py-12">
		<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
			<h1 class="text-4xl sm:text-5xl font-bold mb-4">
				<span class="bg-gradient-to-r from-yellow-300 to-yellow-100 bg-clip-text text-transparent">
					Course Search
				</span>
			</h1>
			<p class="text-xl text-blue-100 mb-6 max-w-2xl mx-auto">
				Find any UCLA course and explore its prerequisite graph.
			</p>
		</div>
	</div>

	<!-- Main Content -->
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
		<!-- Search Section -->
		<div class="bg-gray-300 rounded-2xl p-8 shadow-xl mb-8">
			<div class="mb-6">
				<label for="course-search" class="block text-lg font-semibold text-gray-800 mb-2">
					Search for a course
				</label>
				<div class="relative">
					<input
						id="course-search"
						type="text"
						placeholder="Enter course ID (e.g., 'MATH 31A') or title..."
						bind:value={searchQuery}
						class="w-full px-4 py-3 text-lg bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent text-gray-800 placeholder-gray-500 pr-12"
						autocomplete="off"
					/>
					{#if isSearching}
						<div class="absolute right-4 top-1/2 transform -translate-y-1/2">
							<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
						</div>
					{/if}
				</div>
			</div>

			{#if isSearching}
				<div class="text-center py-8 text-gray-500">
					<div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
					<p class="mt-4">Searching courses...</p>
				</div>
			{:else if searchQuery.trim() && searchResults.length === 0}
				<div class="text-center py-8 text-gray-500">
					<svg class="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.006-5.5-2.5"></path>
					</svg>
					<p>No courses found matching "{searchQuery}"</p>
					<p class="text-sm mt-1">Try searching with different keywords or course codes</p>
				</div>
			{:else if searchQuery.trim() === ''}
				<div class="text-center py-8 text-gray-500">
					<svg class="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
					</svg>
					<p>Start typing to search for courses</p>
					<p class="text-sm mt-1">Search by course ID (like "MATH 31A") or course title</p>
				</div>
			{/if}
		</div>

		<!-- Search Results -->
		{#if searchResults.length > 0 && !isSearching}
			<div class="bg-gray-300 rounded-2xl shadow-xl overflow-hidden">
				<div class="divide-y divide-gray-200">
					{#each searchResults as course}
						<button
							class="w-full px-6 py-4 text-left hover:bg-gray-200 transition-colors group cursor-pointer"
							on:click={() => selectCourse(course.id)}
							type="button"
						>
							<div class="flex items-start justify-between">
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-3 mb-2">
										<span class="text-lg font-semibold text-blue-700 group-hover:text-blue-800">
											{course.id}
										</span>
										{#if course.units}
											<span class="text-sm text-gray-700 bg-gray-200 px-2 py-1 rounded">
												{course.units} units
											</span>
										{/if}
									</div>
									<h3 class="text-gray-900 font-medium mb-1 group-hover:text-gray-800">
										{course.title}
									</h3>
									{#if course.description}
										<p class="text-sm text-gray-600 line-clamp-2 group-hover:text-gray-700">
											{course.description}
										</p>
									{/if}
								</div>
								<div class="ml-4 flex-shrink-0">
									<svg class="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
									</svg>
								</div>
							</div>
						</button>
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<Footer />
</div>
