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

  <div class="space-y-6">
    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
      <h2 class="text-xl font-semibold text-yellow-800 mb-4 flex items-center">
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        Course and Major Issues
      </h2>
      <ul class="space-y-3 text-gray-700">
        <li class="flex items-start">
          <span class="text-yellow-600 mr-2 mt-1">•</span>
          <div>
            <strong>Course Double-Counting:</strong> Some courses are double-counted, especially electives, when a course is optional for a certain path. This is known to affect the following majors:
            <ul class="ml-4 mt-1 space-y-1">
              <li>• Computer Engineering BS</li>
              <li>• Aerospace Engineering BS</li>
            </ul>
            <p><em>Workaround:</em> Manually adjust your course selections to avoid double-counting.</p>
          </div>
        </li>
        <li class="flex items-start">
          <span class="text-yellow-600 mr-2 mt-1">•</span>
          <div>
            <strong>Missing Technical Breadth Options:</strong> Technical breadth course options are missing. This affects all majors in the School of Engineering.
            <p><em>Workaround:</em> Check out the static list of Technical breadth courses at <a href="https://www.seasoasa.ucla.edu/undergraduate-technical-breadth-area-tba/" target="_blank" class="text-yellow-600 hover:text-yellow-800">this link</a>.</p>
          </div>
        </li>
        <li class="flex items-start">
          <span class="text-yellow-600 mr-2 mt-1">•</span>
          <div>
            <strong>Missing Sci-Tech Options:</strong> Science and technology elective options are missing. This affects the Computer Science major.
            <p><em>Workaround:</em> Check out the static list of Science and Technology electives at <a href="https://www.seasoasa.ucla.edu/cs-scitech/" target="_blank" class="text-yellow-600 hover:text-yellow-800">this link</a>.</p>
          </div>
        </li>
        <li class="flex items-start">
          <span class="text-yellow-600 mr-2 mt-1">•</span>
          <div>
            <strong>School-Wide Requirements Missing:</strong> General Education (GE) courses, Writing requirements, Foreign Language requirements, and other university-wide requirements are not yet accounted for in degree planning.
          </div>
        </li>
        <li class="flex items-start">
          <span class="text-yellow-600 mr-2 mt-1">•</span>
          <div>
            <strong>Minors Not Supported:</strong> Minor programs are not yet supported in the system.
          </div>
        </li>
      </ul>
    </div>

    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <p class="text-blue-800 text-sm">
        <strong>Note:</strong> We're actively working to address these issues. If you encounter additional problems, please <a href="{base}/report-bug" class="underline hover:text-blue-600">report them here</a>.
      </p>
    </div>
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
