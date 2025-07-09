<script lang="ts">
  export let equivalentCourses: string[];
  export let userCompletedCourses: Set<string>;
  export let onCourseCompletionToggle: (courseId: string) => void;
</script>

<div class="mb-6">
  <h4 class="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Equivalent Courses</h4>
  <div class="space-y-2">
    {#each equivalentCourses as equivalent}
      <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
        <span class="text-sm font-medium text-gray-700">{equivalent}</span>
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-600">I've taken this:</span>
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
    {/each}
  </div>
</div>
