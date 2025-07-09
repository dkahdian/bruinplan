<!--
	MajorRequirementsList Component
	Displays courses and groups within a major section
-->
<script lang="ts">
	import type { MajorRequirement } from '../../types.js';
	import { isCourseEffectivelyCompleted } from '../../services/completionService.js';
	
	export let requirements: MajorRequirement[];
	export let completedCourses: Set<string>;
	export let onToggleCompletion: (courseId: string) => void;
</script>

<div class="space-y-4">
	{#each requirements as requirement}
		{#if requirement.type === 'course'}
			<!-- Individual Course Requirement -->
			<div 
				class="flex items-center justify-between p-3 rounded border transition-colors cursor-pointer
						{isCourseEffectivelyCompleted(requirement.courseId, [], completedCourses)
							? 'bg-green-100 hover:bg-green-200 border-green-200' 
							: 'bg-gray-50 hover:bg-gray-100 border-gray-200'}"
				on:click={() => onToggleCompletion(requirement.courseId)}
				on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggleCompletion(requirement.courseId); } }}
				role="button"
				tabindex="0"
				title={isCourseEffectivelyCompleted(requirement.courseId, [], completedCourses) ? 'Mark as incomplete' : 'Mark as complete'}
			>
				<div class="flex items-center space-x-3">
					<div
						class="w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200
								{isCourseEffectivelyCompleted(requirement.courseId, [], completedCourses)
									? 'bg-green-500 border-green-500 shadow-sm' 
									: 'bg-white border-gray-300 hover:border-green-400 hover:bg-green-50'}"
					>
						{#if isCourseEffectivelyCompleted(requirement.courseId, [], completedCourses)}
							<span class="text-white text-xs font-bold">✓</span>
						{/if}
					</div>
					
					<button
						class="text-blue-600 hover:text-blue-800 font-medium cursor-pointer px-2 py-1 rounded-md hover:bg-blue-100 hover:shadow-sm transition-all duration-200"
						on:click|stopPropagation={() => window.open(`/courses/${requirement.courseId}`, '_blank')}
						title="View {requirement.courseId} prerequisites and details (opens in new tab)"
					>
						{requirement.courseId}
					</button>
				</div>
				
				<span class="text-sm text-gray-500">Required</span>
			</div>
		{:else if requirement.type === 'group'}
			<!-- Group Requirement -->
			<div class="border border-gray-300 rounded-lg p-4 bg-blue-50">
				<div class="mb-3">
					<h3 class="font-semibold text-lg">{requirement.title}</h3>
					<p class="text-gray-700 text-sm">{requirement.description}</p>
					<p class="text-blue-800 font-medium text-sm mt-1">
						Select {requirement.needs} from {requirement.options.length} options:
					</p>
				</div>
				
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
					{#each requirement.options as option}
						{#if option.type === 'course'}
							<div 
								class="flex items-center space-x-2 p-2 rounded border transition-colors cursor-pointer
										{isCourseEffectivelyCompleted(option.courseId, [], completedCourses)
											? 'bg-green-100 hover:bg-green-200 border-green-200' 
											: 'bg-white hover:bg-gray-50 border-gray-200'}"
								on:click={() => onToggleCompletion(option.courseId)}
								on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggleCompletion(option.courseId); } }}
								role="button"
								tabindex="0"
								title={isCourseEffectivelyCompleted(option.courseId, [], completedCourses) ? 'Mark as incomplete' : 'Mark as complete'}
							>
								<div
									class="w-4 h-4 rounded border-2 border-gray-300 flex items-center justify-center 
											{isCourseEffectivelyCompleted(option.courseId, [], completedCourses) ? 'bg-green-500 border-green-500' : 'bg-white'} 
											hover:border-green-400 transition-colors"
								>
									{#if isCourseEffectivelyCompleted(option.courseId, [], completedCourses)}
										<span class="text-white text-xs">✓</span>
									{/if}
								</div>
								
								<button
									class="text-blue-600 hover:text-blue-800 text-sm cursor-pointer px-2 py-1 rounded-md hover:bg-blue-100 hover:shadow-sm transition-all duration-200"
									on:click|stopPropagation={() => window.open(`/courses/${option.courseId}`, '_blank')}
									title="View {option.courseId} prerequisites and details (opens in new tab)"
								>
									{option.courseId}
								</button>
							</div>
						{/if}
					{/each}
				</div>
			</div>
		{/if}
	{/each}
</div>