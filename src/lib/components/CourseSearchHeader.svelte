<script lang="ts">
  import type { Course } from '../types.js';

  export let courseId: string;
  export let title: string;
  export let courses: Course[] = [];

  let isSearchExpanded = false;
  let searchQuery = '';
  let searchResults: Course[] = [];
  let searchContainer: HTMLDivElement;

  // Calculate Levenshtein distance between two strings
  function levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }
  
  // Calculate similarity score for fuzzy matching
  function calculateSimilarity(query: string, course: Course): number {
    const lowerQuery = query.toLowerCase();
    const courseId = course.id.toLowerCase();
    const courseTitle = course.title.toLowerCase();
    
    // Exact matches get highest score
    if (courseId === lowerQuery || courseTitle === lowerQuery) return 1000;
    
    // Substring matches get high scores
    if (courseId.includes(lowerQuery)) return 800;
    if (courseTitle.includes(lowerQuery)) return 700;
    
    // Word-based matching for titles
    const titleWords = courseTitle.split(/\s+/);
    const queryWords = lowerQuery.split(/\s+/);
    
    let wordMatchScore = 0;
    for (const queryWord of queryWords) {
      for (const titleWord of titleWords) {
        if (titleWord.startsWith(queryWord)) {
          wordMatchScore += 300;
        } else if (titleWord.includes(queryWord)) {
          wordMatchScore += 200;
        }
      }
    }
    
    if (wordMatchScore > 0) return wordMatchScore;
    
    // Levenshtein distance for fuzzy matching
    const maxLen = Math.max(lowerQuery.length, courseId.length, courseTitle.length);
    const idDistance = levenshteinDistance(lowerQuery, courseId);
    const titleDistance = levenshteinDistance(lowerQuery, courseTitle);
    
    const idSimilarity = Math.max(0, (maxLen - idDistance) / maxLen) * 100;
    const titleSimilarity = Math.max(0, (maxLen - titleDistance) / maxLen) * 100;
    
    return Math.max(idSimilarity, titleSimilarity);
  }
  
  // Filter courses based on search query with fuzzy matching
  $: if (searchQuery.trim() && courses.length > 0) {
    const query = searchQuery.toLowerCase().trim();
    
    // First, get exact and substring matches
    const exactMatches = courses.filter(course => 
      course.id.toLowerCase().includes(query) || 
      course.title.toLowerCase().includes(query)
    );
    
    // If we have fewer than 5 exact matches, add fuzzy matches
    if (exactMatches.length < 5) {
      // Get all courses with similarity scores
      const scoredCourses = courses
        .filter(course => !exactMatches.some(exact => exact.id === course.id)) // Exclude already matched
        .map(course => ({
          course,
          similarity: calculateSimilarity(query, course)
        }))
        .filter(item => item.similarity > 20) // Only include reasonable matches
        .sort((a, b) => b.similarity - a.similarity) // Sort by similarity descending
        .slice(0, 10 - exactMatches.length) // Fill up to 10 total results
        .map(item => item.course);
      
      searchResults = [...exactMatches, ...scoredCourses].slice(0, 10);
    } else {
      searchResults = exactMatches.slice(0, 10);
    }
  } else {
    searchResults = [];
  }
  
  // Function to navigate to a selected course
  function selectCourse(selectedCourseId: string) {
    // Remove spaces from course ID for URL compatibility
    const urlSafeCourseId = selectedCourseId.replace(/\s+/g, '');
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
                  class="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
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
</div>
