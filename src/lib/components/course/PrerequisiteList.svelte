<script lang="ts">
  import type { CourseRequirement, Course } from '../../types.js';
  import { schedulingService, courseCompletionService, validationService } from '../../services/schedulingServices.js';
  import QuarterSelector from './QuarterSelector.svelte';
  import ValidationIndicator from '../shared/ValidationIndicator.svelte';
  import { validationErrorsStore, courseSchedulesStore } from '../../services/schedulingServices.js';

  export let requisites: CourseRequirement[];
  export let userCompletedCourses: Set<string>;
  export let courseMap: Map<string, Course>;
  export let onCourseCompletionToggle: (courseId: string) => void;
  export let onQuarterChange: (courseId: string, quarterCode: number) => void;
  export let onPrerequisiteClick: (courseId: string, requisiteLevel?: string, requisiteType?: string) => void;

  // Make function reactive to store changes
  $: getBackgroundColor = (courseId: string): string => {
    // Force reactivity by accessing the stores
    $courseSchedulesStore;
    $validationErrorsStore;
    
    if (courseCompletionService.isCompleted(courseId)) {
      return 'bg-green-50 border-green-200';
    } else if (courseCompletionService.isInPlan(courseId)) {
      // Check if this planned course has validation errors
      const courseErrors = validationService.validateCourse(courseId);
      if (courseErrors.length > 0) {
        return 'bg-orange-50 border-orange-200'; // Orange for planned with warnings
      }
      return 'bg-purple-50 border-purple-200'; // Purple for planned without warnings
    }
    return 'bg-gray-50 border-gray-200'; // Gray for not planned
  };

  // Helper function to get validation errors for a course
  $: getValidationErrors = (courseId: string) => {
    $validationErrorsStore; // Force reactivity
    return validationService.validateCourse(courseId);
  };

  // Helper function to check if a course is effectively completed and find which equivalent was taken
  function getEquivalentCompletedCourse(courseId: string, groupOptions?: CourseRequirement[]): string | null {
    // If the course itself is completed, no equivalent message needed
    if (userCompletedCourses.has(courseId)) {
      return null;
    }
    
    const course = courseMap.get(courseId);
    if (!course?.equivalentCourses) {
      return null;
    }
    
    // Check if any equivalent course is completed
    for (const equivalent of course.equivalentCourses) {
      if (userCompletedCourses.has(equivalent)) {
        // If we're in a group, check if the equivalent is also present in the same group
        if (groupOptions) {
          const equivalentInGroup = groupOptions.some(option => 
            option.type === 'requisite' && 
            option.course === equivalent
          );
          
          // If the equivalent is also in the group, don't show the equivalent message
          if (equivalentInGroup) {
            return null;
          }
        }
        
        return equivalent;
      }
    }
    
    return null;
  }
</script>

<div class="mb-6">
  <h4 class="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Prerequisites</h4>
  <ul class="space-y-2">
    {#each requisites as requisite}
      {#if requisite.type === 'group'}
        <li class="text-sm">
          <span class="font-medium text-gray-800">Choose {requisite.needs} from:</span>
          <ul class="ml-4 mt-1 space-y-1">
            {#each requisite.options as option}
              {#if option.type !== 'group'}
                <li class="text-sm">
                  <div class="p-2 rounded border {getBackgroundColor(option.course)}">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center">
                        <span class="text-orange-600 font-medium">Required:</span>
                        <button 
                          class="text-gray-800 hover:text-blue-600 hover:bg-blue-50 px-1 py-0.5 rounded transition-colors duration-200 font-medium ml-1"
                          on:click={() => onPrerequisiteClick(option.course)}
                          type="button"
                        >
                          {option.course}
                        </button>
                      </div>
                      <div class="flex items-center gap-2 ml-2">
                        <!-- Quarter selector for prerequisite -->
                        <QuarterSelector
                          courseId={option.course}
                          {onQuarterChange}
                        />
                        <span class="text-xs text-gray-600">Taken?</span>
                        <button
                          class="completion-checkbox w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200
                                 {userCompletedCourses.has(option.course)
                                   ? 'bg-green-500 border-green-500 shadow-sm' 
                                   : 'bg-white border-gray-300 hover:border-green-400 hover:bg-green-50'}"
                          on:click={() => onCourseCompletionToggle(option.course)}
                          type="button"
                          aria-label="Toggle course completion"
                        >
                          {#if userCompletedCourses.has(option.course)}
                            <span class="text-white text-xs font-bold">✓</span>
                          {/if}
                        </button>
                      </div>
                    </div>
                    
                    <!-- Validation errors below the main row, inside colored div -->
                    {#each getValidationErrors(option.course) as error}
                      <div class="mt-2">
                        <span class="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded block">
                          ⚠️ {error.message}
                        </span>
                      </div>
                    {/each}
                  </div>
                  <!-- Equivalent course indicator -->
                  {#if getEquivalentCompletedCourse(option.course, requisite.options)}
                    <div class="ml-6 mt-1">
                      <span class="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
                        ✓ Took equivalent: 
                        <button 
                          class="hover:text-green-800 hover:bg-green-100 px-1 py-0.5 rounded transition-colors duration-200 font-medium"
                          on:click={() => onPrerequisiteClick(option.course)}
                          type="button"
                        >
                          {getEquivalentCompletedCourse(option.course, requisite.options)}
                        </button>
                      </span>
                    </div>
                  {/if}
                </li>
              {/if}
            {/each}
          </ul>
        </li>
      {:else if requisite.type === 'requisite'}
        <li class="text-sm">
          <div class="p-2 rounded border {getBackgroundColor(requisite.course)}">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <span class="text-orange-600 font-medium">Required:</span>
                <button 
                  class="text-gray-800 hover:text-blue-600 hover:bg-blue-50 px-1 py-0.5 rounded transition-colors duration-200 font-medium ml-1"
                  on:click={() => onPrerequisiteClick(requisite.course)}
                  type="button"
                >
                  {requisite.course}
                </button>
              </div>
              <div class="flex items-center gap-2 ml-2">
                <!-- Quarter selector for prerequisite -->
                <QuarterSelector
                  courseId={requisite.course}
                  {onQuarterChange}
                />
                <span class="text-xs text-gray-600">Taken?</span>
                <button
                  class="completion-checkbox w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200
                         {userCompletedCourses.has(requisite.course)
                           ? 'bg-green-500 border-green-500 shadow-sm' 
                           : 'bg-white border-gray-300 hover:border-green-400 hover:bg-green-50'}"
                  on:click={() => onCourseCompletionToggle(requisite.course)}
                  type="button"
                  aria-label="Toggle course completion"
                >
                  {#if userCompletedCourses.has(requisite.course)}
                    <span class="text-white text-xs font-bold">✓</span>
                  {/if}
                </button>
              </div>
            </div>
            
            <!-- Validation errors below the main row, inside colored div -->
            {#each getValidationErrors(requisite.course) as error}
              <div class="mt-2">
                <span class="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded block">
                  ⚠️ {error.message}
                </span>
              </div>
            {/each}
          </div>
          
          <!-- Equivalent course indicator -->
          {#if getEquivalentCompletedCourse(requisite.course)}
            <div class="ml-4 mt-1">
              <span class="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
                ✓ Took equivalent: 
                <button 
                  class="hover:text-green-800 hover:bg-green-100 px-1 py-0.5 rounded transition-colors duration-200 font-medium"
                  on:click={() => onPrerequisiteClick(requisite.course)}
                  type="button"
                >
                  {getEquivalentCompletedCourse(requisite.course)}
                </button>
              </span>
            </div>
          {/if}
        </li>
      {/if}
    {/each}
  </ul>
</div>
