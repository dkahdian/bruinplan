<script lang="ts">
  import QuarterSelector from './QuarterSelector.svelte';
  import ValidationIndicator from '../shared/ValidationIndicator.svelte';
  import { courseCompletionService } from '../../services/schedulingServices.js';
  import { validationErrorsStore } from '../../services/schedulingServices.js';

  export let equivalentCourses: string[];
  export let userCompletedCourses: Set<string>;
  export let onCourseCompletionToggle: (courseId: string) => void;
  export let onQuarterChange: (courseId: string, quarterCode: number) => void;

  // Function to get background color based on course status
  function getBackgroundColor(courseId: string): string {
    if (courseCompletionService.isCompleted(courseId)) {
      return 'bg-green-50 border-green-200';
    } else if (courseCompletionService.isInPlan(courseId)) {
      return 'bg-purple-50 border-purple-200';
    }
    return 'bg-gray-50 border-gray-200';
  }
</script>

<div class="mb-6">
  <h4 class="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Equivalent Courses</h4>
  <div class="space-y-2">
    {#each equivalentCourses as equivalent}
      <div class="flex items-center justify-between p-2 rounded border {getBackgroundColor(equivalent)}">
        <span class="text-sm font-medium text-gray-700">{equivalent}</span>
        <div class="flex items-center gap-2">
          <!-- Quarter selector for equivalent course -->
          <QuarterSelector
            courseId={equivalent}
            {onQuarterChange}
          />
          <span class="text-xs text-gray-600">Taken?</span>
          <button
            class="completion-checkbox w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200
                   {userCompletedCourses.has(equivalent)
                     ? 'bg-green-500 border-green-500 shadow-sm' 
                     : 'bg-white border-gray-300 hover:border-green-400 hover:bg-green-50'}"
            on:click={() => onCourseCompletionToggle(equivalent)}
            type="button"
            aria-label="Toggle course completion"
          >
            {#if userCompletedCourses.has(equivalent)}
              <span class="text-white text-xs font-bold">✓</span>
            {/if}
          </button>
        </div>
      </div>
      <!-- Validation warnings -->
      <div class="ml-2">
        <ValidationIndicator errors={$validationErrorsStore} courseId={equivalent} />
      </div>
    {/each}
  </div>
</div>
