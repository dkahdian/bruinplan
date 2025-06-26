<script lang="ts">
  export let showWarnings: boolean;
  export let showRecommended: boolean;
  export let showCompletedCourses: boolean;
  export let userCompletedCourses: Set<string>;

  let isLegendExpanded = true;
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
        <div class="font-medium text-gray-700 mb-1">Prerequisite levels:</div>
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <div class="w-6 h-0.5 bg-red-500 flex-shrink-0 relative">
              <div class="absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-2 border-l-red-500 border-t border-b border-transparent"></div>
            </div>
            <span class="text-gray-600">Enforced</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-6 h-0.5 bg-orange-500 flex-shrink-0 relative">
              <div class="absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-2 border-l-orange-500 border-t border-b border-transparent"></div>
            </div>
            <span class="text-gray-600">Warning</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-6 h-0.5 border-t border-dashed border-orange-500 flex-shrink-0 relative">
              <div class="absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-2 border-l-orange-500 border-t border-b border-transparent"></div>
            </div>
            <span class="text-gray-600">Recommended</span>
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
              <button
                class="relative inline-flex h-4 w-7 items-center rounded-full {showCompletedCourses ? 'bg-green-500' : 'bg-gray-300'} transition-colors"
                on:click={() => showCompletedCourses = !showCompletedCourses}
                type="button"
                aria-label="Toggle completed courses"
              >
                <span class="inline-block h-3 w-3 transform rounded-full bg-white transition-transform {showCompletedCourses ? 'translate-x-3.5' : 'translate-x-0.5'}"></span>
              </button>
            </div>
          {/if}
          
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-600">Warning prerequisites</span>
            <button
              class="relative inline-flex h-4 w-7 items-center rounded-full {showWarnings ? 'bg-orange-500' : 'bg-gray-300'} transition-colors"
              on:click={() => showWarnings = !showWarnings}
              type="button"
              aria-label="Toggle warning prerequisites"
            >
              <span class="inline-block h-3 w-3 transform rounded-full bg-white transition-transform {showWarnings ? 'translate-x-3.5' : 'translate-x-0.5'}"></span>
            </button>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-600">Recommended prerequisites</span>
            <button
              class="relative inline-flex h-4 w-7 items-center rounded-full {showRecommended && showWarnings ? 'bg-orange-500' : 'bg-gray-300'} transition-colors"
              on:click={() => {
                if (showWarnings) {
                  showRecommended = !showRecommended;
                } else if (!showRecommended) {
                  // If warnings are off and we're trying to enable recommended, enable both
                  showWarnings = true;
                  showRecommended = true;
                }
              }}
              type="button"
              aria-label="Toggle recommended prerequisites"
            >
              <span class="inline-block h-3 w-3 transform rounded-full bg-white transition-transform {showRecommended && showWarnings ? 'translate-x-3.5' : 'translate-x-0.5'}"></span>
            </button>
          </div>
        </div>
        <div class="text-xs text-gray-500 mt-1">
          Enforced prerequisites always shown
        </div>
      </div>
    </div>
  {/if}
</div>
