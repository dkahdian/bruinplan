<script lang="ts">
  import { base } from '$app/paths';
</script>

<svelte:head>
  <title>Known Bugs - BruinPlan</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-4xl">
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-4">Known Bugs</h1>
    <p class="text-gray-600">
      This page tracks known issues and bugs in BruinPlan. We're working to fix these issues.
    </p>
  </div>

  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <p class="text-gray-500 text-center">
      No known bugs at this time! 🎉
    </p>
    <p class="text-gray-400 text-center text-sm mt-2">
      If you encounter any issues, please report them on our GitHub repository.
    </p>
  </div>

  <div class="mt-8 text-center">
    <a 
      href="{base}/" 
      class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      ← Back to Home
    </a>
  </div>
</div>
