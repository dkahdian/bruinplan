<script lang="ts">
  import { onMount } from 'svelte';
  
  // Svelte 5 event callback prop
  export let onresize: ((event: { newWidthPercent: number }) => void) | undefined = undefined;
  export let resizeContainer: HTMLDivElement;
  
  let isResizing = false;
  let isMobile = false;

  // Detect if device is mobile/touch
  onMount(() => {
    isMobile = window.matchMedia('(max-width: 768px)').matches || 
               'ontouchstart' in window || 
               navigator.maxTouchPoints > 0;
    
    // Listen for viewport changes
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    mediaQuery.addListener((e) => {
      isMobile = e.matches;
    });
  });

  function startResize(event: MouseEvent) {
    if (isMobile) return; // Disable resize on mobile
    
    isResizing = true;
    document.body.classList.add('resizing');
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
    event.preventDefault();
  }

  function handleResize(event: MouseEvent) {
    if (!isResizing || !resizeContainer || isMobile) return;
    
    const containerRect = resizeContainer.getBoundingClientRect();
    const newWidthPercent = ((event.clientX - containerRect.left) / containerRect.width) * 100;
    
    // Constrain between 20% and 80%
    const constrainedWidth = Math.max(20, Math.min(80, newWidthPercent));
    onresize?.({ newWidthPercent: constrainedWidth });
  }

  function stopResize() {
    isResizing = false;
    document.body.classList.remove('resizing');
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
  }
</script>

{#if !isMobile}
<button 
  class="w-2 cursor-col-resize flex-shrink-0 border-0 bg-transparent p-0 m-0 outline-none focus:outline-none resize-handle"
  on:mousedown={startResize}
  aria-label="Resize panels"
  type="button"
>
</button>
{/if}
