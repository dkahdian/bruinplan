<script lang="ts">
  // Working directory: bruinplan/src/routes/courses/[courseId]/+page.svelte
  // PrerequisiteGraph is in bruinplan/src/lib/PrerequisiteGraph.svelte
  import PrerequisiteGraph from '../../../lib/PrerequisiteGraph.svelte';
  // Get the courseId from the URL parameters
  // This will be available as a prop in the component
  export let data: { courseId: string };
</script>

<svelte:head>
  <title>Prerequisites for {data.courseId}</title>
</svelte:head>

<main>
  <PrerequisiteGraph courseId={data.courseId} />
</main>

<style>
  main {
    width: 100%;
    min-height: 100vh;
    background: #f9fafb;
  }
</style>
