<script lang="ts">
  import type { Course } from '../../types.js';
  import PrerequisiteList from './PrerequisiteList.svelte';
  import EquivalentCourses from './EquivalentCourses.svelte';
  import QuarterSelector from './QuarterSelector.svelte';
  import ValidationIndicator from '../shared/ValidationIndicator.svelte';
  import CourseNavigationHeader from './CourseNavigationHeader.svelte';
  import { validationErrorsStore } from '../../services/schedulingServices.js';

  export let displayedCourse: Course | null;
  export let selectedCourse: Course | null;
  export let isTransitioning: boolean;
  export let userCompletedCourses: Set<string>;
  export let courseMap: Map<string, Course>;
  export let onCourseCompletionToggle: (courseId: string) => void;
  export let onQuarterChange: (courseId: string, quarterCode: number) => void;
  export let onPrerequisiteClick: (courseId: string, requisiteLevel?: string, requisiteType?: string) => void;
  export let courseId: string;
  export let onNavigate: (event: CustomEvent<string>) => void;
</script>

<div class="h-full relative">
  <!-- Course details content -->
  <div 
    class="absolute inset-0 p-4 transition-opacity duration-300 ease-in-out overflow-y-auto"
    class:opacity-0={isTransitioning}
    class:opacity-100={!isTransitioning}
  >
    <!-- Course Navigation Header (only on mobile) -->
    <div class="mobile-header mb-4">
      <CourseNavigationHeader 
        {courseId}
        on:navigate={onNavigate}
      />
    </div>

    {#if displayedCourse}
      <!-- Course header -->
      <div class="mb-6">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <h3 class="text-xl font-bold text-gray-900">{displayedCourse.id}</h3>
            <!-- Bruinwalk link -->
            <a
              href="https://bruinwalk.com/classes/{displayedCourse.id.toLowerCase().replace(/\s+/g, '-')}/"
              target="_blank"
              class="opacity-60 hover:opacity-100 transition-opacity flex items-center gap-1"
              title="View {displayedCourse.id} on Bruinwalk"
            >
              <img src="/paw.png" alt="Bruinwalk" class="w-5 h-5" />
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
            </a>
          </div>
          {#if selectedCourse}
            <span class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              Selected
            </span>
          {:else}
            <span class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
              Main Course
            </span>
          {/if}
        </div>
        <p class="text-lg text-gray-700 font-medium">{displayedCourse.title}</p>
        <div class="mt-3 flex items-center gap-3">
          <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {displayedCourse.units} {(typeof displayedCourse.units === 'number' && displayedCourse.units === 1) ? 'unit' : 'units'}
          </span>
          
          <!-- Course completion checkbox -->
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600">Taken?</span>
            <button
              class="completion-checkbox w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200
                     {userCompletedCourses.has(displayedCourse.id)
                       ? 'bg-green-500 border-green-500 shadow-sm' 
                       : 'bg-white border-gray-300 hover:border-green-400 hover:bg-green-50'}"
              on:click={() => onCourseCompletionToggle(displayedCourse.id)}
              type="button"
              aria-label="Toggle course completion"
            >
              {#if userCompletedCourses.has(displayedCourse.id)}
                <span class="text-white text-xs font-bold">✓</span>
              {/if}
            </button>
          </div>
          
          <!-- Quarter selector -->
          <QuarterSelector
            courseId={displayedCourse.id}
            {onQuarterChange}
          />
        </div>
      </div>

      <!-- Validation errors for selected course -->
      {@const targetCourseId = selectedCourse?.id || displayedCourse.id}
      {@const courseErrors = $validationErrorsStore.filter(error => error.courseId === targetCourseId)}
      {#if courseErrors.length > 0}
        <div class="mb-4">
          <ValidationIndicator errors={courseErrors} courseId={targetCourseId} />
        </div>
      {/if}

      <!-- Course description -->
      {#if displayedCourse.description}
        <div class="mb-6">
          <h4 class="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Description</h4>
          <p class="text-gray-700 leading-relaxed">{displayedCourse.description}</p>
        </div>
      {/if}

      <!-- Prerequisites -->
      {#if displayedCourse.requisites && displayedCourse.requisites.length > 0}
        <PrerequisiteList 
          requisites={displayedCourse.requisites}
          {userCompletedCourses}
          {courseMap}
          {onCourseCompletionToggle}
          {onQuarterChange}
          {onPrerequisiteClick}
        />
      {/if}

      <!-- Equivalent courses -->
      {#if displayedCourse.equivalentCourses && displayedCourse.equivalentCourses.length > 0}
        <EquivalentCourses 
          equivalentCourses={displayedCourse.equivalentCourses}
          {userCompletedCourses}
          {onCourseCompletionToggle}
          {onQuarterChange}
        />
      {/if}

      <!-- Instructions -->
      <div class="mt-8 pt-4 border-t border-gray-200">
        <p class="text-xs text-gray-500 text-center">
          {#if selectedCourse}
            Click on another course or the background to change selection
          {:else}
            Click on any course to view its details
          {/if}
        </p>
      </div>
    {:else}
      <!-- Loading or error state -->
      <div class="text-gray-500 text-center mt-8">
        <p class="text-lg font-medium">Course Details</p>
        <p class="text-sm mt-2">Loading course information...</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .mobile-header {
    display: none;
  }

  /* Mobile responsive design */
  @media (max-width: 768px) {
    .mobile-header {
      display: block;
    }
  }
</style>
