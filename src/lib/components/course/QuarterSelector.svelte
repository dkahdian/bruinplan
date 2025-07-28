<!--
  Quarter Selector Component
  Allows users to assign courses to specific quarters
-->
<script lang="ts">
  import { getCurrentQuarterCode, formatQuarterCode } from '../../services/shared/quarterUtils.js';
  import { courseCompletionService, courseSchedulesStore } from '../../services/schedulingServices.js';

  export let courseId: string;
  export let onQuarterChange: (courseId: string, quarterCode: number) => void;

  let isOpen = false;
  let quarters: { code: number; label: string }[] = [];

  // Initialize quarter options (next 12 quarters)
  function initializeQuarters() {
    const currentQuarter = getCurrentQuarterCode();
    quarters = [];
    
    let quarterCode = currentQuarter;
    for (let i = 0; i < 12; i++) {
      quarters.push({
        code: quarterCode,
        label: formatQuarterCode(quarterCode)
      });
      
      // Increment to next quarter
      const year = Math.floor(quarterCode / 10);
      const quarter = quarterCode % 10;
      
      if (quarter === 4) {
        quarterCode = (year + 1) * 10 + 1; // Fall -> Winter (next year)
      } else {
        quarterCode = year * 10 + (quarter + 1); // Same year, next quarter
      }
    }
  }

  // Initialize quarters when component mounts
  initializeQuarters();

  function handleQuarterSelect(quarterCode: number) {
    onQuarterChange(courseId, quarterCode);
    isOpen = false;
  }

  function toggleDropdown() {
    isOpen = !isOpen;
  }

  // Get current assignment (reactive to store changes)
  $: currentQuarterCode = $courseSchedulesStore ? courseCompletionService.getQuarterCode(courseId) : 0;
  $: currentQuarterLabel = currentQuarterCode && currentQuarterCode > 1 
    ? formatQuarterCode(currentQuarterCode) 
    : null;
  
  // Check if course is completed - if so, don't show the quarter selector
  $: isCompleted = currentQuarterCode === 1;
</script>

{#if !isCompleted}
<div class="relative">
  <!-- Quarter selector button -->
  <button
    type="button"
    class="inline-flex items-center px-3 py-1 border border-purple-300 rounded-md text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 transition-colors"
    on:click={toggleDropdown}
    aria-haspopup="true"
    aria-expanded={isOpen}
  >
    {#if currentQuarterLabel}
      {currentQuarterLabel}
    {:else}
      Plan
    {/if}
    <!-- Dropdown arrow -->
    <svg class="ml-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
    </svg>
  </button>

  <!-- Dropdown menu -->
  {#if isOpen}
    <div class="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-10">
      <div class="py-1 max-h-48 overflow-y-auto">
        <!-- Remove from plan option -->
        {#if currentQuarterCode && currentQuarterCode > 1}
          <button
            type="button"
            class="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            on:click={() => handleQuarterSelect(0)}
          >
            Remove from plan
          </button>
          <div class="border-t border-gray-100"></div>
        {/if}
        
        <!-- Quarter options -->
        {#each quarters as quarter}
          <button
            type="button"
            class="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 {currentQuarterCode === quarter.code ? 'bg-purple-50 text-purple-700' : ''}"
            on:click={() => handleQuarterSelect(quarter.code)}
          >
            {quarter.label}
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>

<!-- Click outside to close -->
{#if isOpen}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="fixed inset-0 z-5" on:click={() => isOpen = false}></div>
{/if}
{/if}
