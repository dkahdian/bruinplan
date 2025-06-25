<script lang="ts">
  // Working directory: bruinplan/src/routes/courses/[courseId]/all/+page.svelte
  // PrerequisiteGraph is in bruinplan/src/lib/PrerequisiteGraph.svelte
  import PrerequisiteGraph from '../../../../lib/PrerequisiteGraph.svelte';
  
  // Get the courseId and display options from the URL parameters
  export let data: { 
    courseId: string; 
    showWarnings: boolean; 
    showRecommended: boolean; 
  };
</script>

<svelte:head>
  <title>All Prerequisites for {data.courseId}</title>
</svelte:head>

<main>
  <PrerequisiteGraph 
    courseId={data.courseId} 
    showWarnings={data.showWarnings}
    showRecommended={data.showRecommended}
  />
</main>

<style>
  main {
    width: 100%;
    min-height: 100vh;
    background: #f9fafb;
  }
</style>
