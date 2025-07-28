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
            class="relative inline-flex h-4 w-7 items-center rounded-full {userCompletedCourses.has(equivalent) ? 'bg-green-500' : 'bg-gray-300'} transition-colors"
            on:click={() => onCourseCompletionToggle(equivalent)}
            type="button"
            aria-label="Toggle course completion"
          >
            <span class="inline-block h-3 w-3 transform rounded-full bg-white transition-transform {userCompletedCourses.has(equivalent) ? 'translate-x-3.5' : 'translate-x-0.5'}"></span>
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
