<script lang="ts">
  import type { CourseRequirement, Course } from '../../types.js';
  import { schedulingService } from '../../services/schedulingServices.js';

  export let requisites: CourseRequirement[];
  export let userCompletedCourses: Set<string>;
  export let courseMap: Map<string, Course>;
  export let onCourseCompletionToggle: (courseId: string) => void;
  export let onPrerequisiteClick: (courseId: string) => void;

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
                      <span class="text-xs text-gray-600">I've taken this:</span>
                      <button
                        class="relative inline-flex h-4 w-7 items-center rounded-full {userCompletedCourses.has(option.course) ? 'bg-green-500' : 'bg-gray-300'} transition-colors"
                        on:click={() => onCourseCompletionToggle(option.course)}
                        type="button"
                        aria-label="Toggle course completion"
                      >
                        <span class="inline-block h-3 w-3 transform rounded-full bg-white transition-transform {userCompletedCourses.has(option.course) ? 'translate-x-3.5' : 'translate-x-0.5'}"></span>
                      </button>
                    </div>
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
              <span class="text-xs text-gray-600">I've taken this:</span>
              <button
                class="relative inline-flex h-4 w-7 items-center rounded-full {userCompletedCourses.has(requisite.course) ? 'bg-green-500' : 'bg-gray-300'} transition-colors"
                on:click={() => onCourseCompletionToggle(requisite.course)}
                type="button"
                aria-label="Toggle course completion"
              >
                <span class="inline-block h-3 w-3 transform rounded-full bg-white transition-transform {userCompletedCourses.has(requisite.course) ? 'translate-x-3.5' : 'translate-x-0.5'}"></span>
              </button>
            </div>
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
