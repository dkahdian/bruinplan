<script lang="ts">
  import type { Course } from '../../types.js';
  import { searchCoursesNew } from '../../services/shared/search.js';

  export let courseId: string;
  export let title: string;

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
        maxResults: 10
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
  
  // Function to navigate to a selected course
  function selectCourse(selectedCourseId: string) {
    // Remove spaces from course ID for URL compatibility
    const urlSafeCourseId = selectedCourseId.replace(/[^A-Z0-9]/g, '');
    // Navigate to the new course page
    window.location.href = `/courses/${urlSafeCourseId}`;
  }
  
  // Close search dropdown when clicking outside
  function handleClickOutside(event: MouseEvent) {
    if (searchContainer && !searchContainer.contains(event.target as Node)) {
      isSearchExpanded = false;
      searchQuery = '';
    }
  }

  // Add click outside listener
  import { onMount } from 'svelte';
  
  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });
</script>

<div class="mb-5 relative" bind:this={searchContainer}>
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <h2 class="text-2xl font-semibold text-gray-800">{title} for</h2>
      
      <!-- Collapsible course selector -->
      <div class="relative">
        <button 
          class="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 hover:bg-blue-200 transition-colors rounded-lg border border-blue-300"
          on:click={() => isSearchExpanded = !isSearchExpanded}
          type="button"
        >
          <span class="text-xl font-semibold text-blue-900">{courseId}</span>
          <svg 
            class="w-4 h-4 transform transition-transform duration-200 {isSearchExpanded ? 'rotate-180' : ''}"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        
        <!-- Search dropdown -->
        {#if isSearchExpanded}
          <div class="absolute top-full left-0 mt-2 w-96 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
            <div class="p-3">
              <input
                type="text"
                placeholder="Search for courses..."
                bind:value={searchQuery}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autocomplete="off"
              />
            </div>
            
            {#if searchResults.length > 0}
              <div class="max-h-60 overflow-y-auto border-t border-gray-200">
                {#each searchResults as course}
                  <button
                    class="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors cursor-pointer"
                    on:click={() => selectCourse(course.id)}
                    type="button"
                  >
                    <div class="font-medium text-gray-900">{course.id}</div>
                    <div class="text-sm text-gray-600 truncate">{course.title}</div>
                  </button>
                {/each}
              </div>
            {:else if searchQuery.trim()}
              <div class="px-3 py-4 text-gray-500 text-center border-t border-gray-200">
                No courses found matching "{searchQuery}"
              </div>
            {:else}
              <div class="px-3 py-4 text-gray-500 text-center border-t border-gray-200">
                Start typing to search for courses...
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>
    
    <!-- Back to Course Search Button -->
    <a 
      href="/courses"
      class="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 hover:text-purple-800 transition-colors rounded-lg border border-purple-300 text-sm font-medium"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
      </svg>
      Back to Course Search
    </a>
  </div>
</div>
