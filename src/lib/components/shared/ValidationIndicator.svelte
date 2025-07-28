<script lang="ts">
  import type { ValidationError } from '../../types.js';
  
  export let errors: ValidationError[] = [];
  export let courseId: string;
  export let showMessage: boolean = true; // New prop to control message display
  
  // Filter errors for this specific course
  $: courseErrors = errors.filter(error => error.courseId === courseId);
  $: hasWarnings = courseErrors.length > 0;
  
  // Debug logging for significant events
  $: {
    if (hasWarnings) {
      console.log('🚨 ValidationIndicator showing', courseErrors.length, 'warnings for', courseId);
    }
  }
  
  // Get background color class - orange for warnings, red for errors
  $: backgroundClass = hasWarnings ? 'bg-orange-100' : '';
  
  // Format error messages for display
  function formatMessage(error: ValidationError): string {
    return showMessage ? `⚠️ ${error.message}` : '⚠️';
  }
</script>

{#if courseErrors.length > 0}
  <div class="mt-1 p-1 rounded text-xs {backgroundClass}">
    {#each courseErrors as error}
      <div class="text-gray-700 break-words">
        {formatMessage(error)}
      </div>
    {/each}
  </div>
{/if}
