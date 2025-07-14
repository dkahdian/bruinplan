<script lang="ts">
  import type { ValidationError } from '../../types.js';
  
  export let errors: ValidationError[] = [];
  export let courseId: string;
  
  // Filter errors for this specific course
  $: courseErrors = errors.filter(error => error.courseId === courseId);
  $: hasErrors = courseErrors.some(error => error.type === 'error');
  $: hasWarnings = courseErrors.some(error => error.type === 'warning');
  
  // Get background color class - darker red for errors
  $: backgroundClass = hasErrors ? 'bg-red-200' : hasWarnings ? 'bg-orange-100' : '';
  
  // Format error messages for display
  function formatMessage(error: ValidationError): string {
    const emoji = error.type === 'error' ? '⚠️❌' : '⚠️';
    return `${emoji} ${error.message}`;
  }
</script>

{#if courseErrors.length > 0}
  <div class="mt-1 p-1 rounded text-xs {backgroundClass}">
    {#each courseErrors as error}
      <div class="text-gray-700">
        {formatMessage(error)}
      </div>
    {/each}
  </div>
{/if}
