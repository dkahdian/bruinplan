<script lang="ts">
  import { onMount } from 'svelte';
  import { saveLegendState, type LegendState } from '../../services/shared/legendState.js';

  export let showWarnings: boolean;
  export let showCompletedCourses: boolean;
  export let userCompletedCourses: Set<string>;

  let isLegendExpanded = true;
  let isInitialized = false;

  // Load only the legend expansion state on mount
  onMount(async () => {
    // Import the load function dynamically to avoid SSR issues
    const { loadLegendState } = await import('../../services/shared/legendState.js');
    const savedState = loadLegendState();
    
    // Only update the legend expansion state here
    // The parent component should handle initializing the toggle states
    isLegendExpanded = savedState.isExpanded;
    
    isInitialized = true;
  });

  // Save state to localStorage whenever any state changes
  $: if (isInitialized) {
    const currentState: LegendState = {
      isExpanded: isLegendExpanded,
      showWarnings,
      showCompletedCourses
    };
    saveLegendState(currentState);
  }
</script>

<div class="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg text-xs max-w-xs overflow-hidden">
  <!-- Collapsible Header -->
  <button 
    class="w-full bg-blue-100 hover:bg-blue-200 transition-colors px-3 py-2 text-left flex items-center justify-between"
    on:click={() => isLegendExpanded = !isLegendExpanded}
    type="button"
  >
    <h4 class="font-semibold text-gray-800 text-sm">Legend</h4>
    <svg 
      class="w-4 h-4 transform transition-transform duration-200 {isLegendExpanded ? 'rotate-180' : ''}"
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
    </svg>
  </button>
  
  <!-- Collapsible Content -->
  {#if isLegendExpanded}
    <div class="p-3">
      <!-- Node types -->
      <div class="mb-3">
        <div class="font-medium text-gray-700 mb-1">Shapes:</div>
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 bg-white border border-gray-400 rounded flex-shrink-0"></div>
            <span class="text-gray-600">Courses</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 bg-gray-100 border-2 border-gray-400 transform rotate-45 flex-shrink-0"></div>
            <span class="text-gray-600">Course options</span>
          </div>
        </div>
      </div>
      
      <!-- Edge types -->
      <div>
        <div class="font-medium text-gray-700 mb-1">Prerequisites:</div>
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <div class="w-6 h-0.5 bg-orange-500 flex-shrink-0 relative">
              <div class="absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-2 border-l-orange-500 border-t border-b border-transparent"></div>
            </div>
            <span class="text-gray-600">Required before taking course</span>
          </div>
        </div>
      </div>
      
      <!-- Additional info -->
      <div class="mt-2 pt-2 border-t border-gray-200">
        <div class="text-gray-500 text-xs mb-3">
          Hover for details • Click to select
        </div>
        
        <!-- Toggle controls -->
        <div class="space-y-2">
          <div class="text-xs font-medium text-gray-700 mb-1">Show/Hide:</div>
          
          <!-- Show completed courses toggle (only if user has completed courses) -->
          {#if userCompletedCourses.size > 0}
            <div class="flex items-center justify-between">
              <span class="text-xs text-gray-600">Completed courses</span>
              <div class="completion-checkbox {showCompletedCourses ? 'bg-green-500' : 'bg-white border border-gray-300'} hover:shadow-md transition-all" 
                   on:click={() => showCompletedCourses = !showCompletedCourses}
                   on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showCompletedCourses = !showCompletedCourses; } }}
                   role="checkbox"
                   aria-checked={showCompletedCourses}
                   tabindex="0">
                {#if showCompletedCourses}
                  <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                {/if}
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>
