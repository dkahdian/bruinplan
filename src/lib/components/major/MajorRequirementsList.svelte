<!--
	MajorRequirementsList Component
	Displays courses and groups within a major section
-->
<script lang="ts">
	import type { MajorRequirement } from '../../types.js';
	import { getCompletedCourseSource, getCompletedCourseOfGroupSource, completedCourses } from '../../services/shared/completionService.js';
	import { courseMapStore } from '../../services/data/loadCourses.js';
	
	export let requirements: MajorRequirement[];
	export let onToggleCompletion: (courseId: string) => void;
	
	// Subscribe to both stores to ensure reactivity when either changes
	$: userCompletedCourses = $completedCourses;
	$: courseMap = $courseMapStore;
	
	// Force reactivity by depending on both stores
	$: reactiveKey = [userCompletedCourses, courseMap];
</script>

<div class="space-y-4">
	{#each requirements as requirement}
		{#if requirement.type === 'course'}
			<!-- Force reactivity by depending on both stores -->
			{@const completedSource = reactiveKey && getCompletedCourseSource(requirement.courseId)}
			{@const isEffectivelyCompleted = completedSource !== null}
			{@const isDirectlyCompleted = reactiveKey && $completedCourses.has(requirement.courseId)}
			<!-- Individual Course Requirement -->
			<div 
				class="flex items-center justify-between p-3 rounded border transition-colors cursor-pointer
						{isEffectivelyCompleted
							? 'bg-green-100 hover:bg-green-200 border-green-200' 
							: 'bg-gray-50 hover:bg-gray-100 border-gray-200'}"
				on:click={() => onToggleCompletion(requirement.courseId)}
				on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggleCompletion(requirement.courseId); } }}
				role="button"
				tabindex="0"
				title={isEffectivelyCompleted ? 'Mark as incomplete' : 'Mark as complete'}
			>
				<div class="flex items-center space-x-3">
					<div
						class="w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200
								{isDirectlyCompleted
									? 'bg-green-500 border-green-500 shadow-sm' 
									: 'bg-white border-gray-300 hover:border-green-400 hover:bg-green-50'}"
					>
						{#if isDirectlyCompleted}
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
				
				<div class="flex flex-col items-end">
					<!-- Equivalent course indicator -->
					{#if completedSource !== null && completedSource !== requirement.courseId}
						<button
							class="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded mt-1 hover:bg-green-200 hover:shadow-sm transition-all duration-200 cursor-pointer via-button"
							on:click|stopPropagation={() => window.open(`/courses/${completedSource}`, '_blank')}
							title="View {completedSource} prerequisites and details (opens in new tab)"
						>
							✓ Via: {completedSource}
						</button>
					{/if}
				</div>
			</div>
		{:else if requirement.type === 'group'}
			<!-- Calculate group completion stats with reactivity -->
			{@const groupCourseIds = requirement.options.filter(option => option.type === 'course').map(option => option.courseId)}
			{@const groupCompletedCount = reactiveKey && requirement.options.filter(option => 
				option.type === 'course' && getCompletedCourseOfGroupSource(option.courseId, groupCourseIds) !== null
			).length}
			{@const groupRequiredCount = requirement.needs}
			{@const groupProgress = Math.min(groupCompletedCount, groupRequiredCount)}
			
			<!-- Group Requirement -->
			<div class="border border-gray-300 rounded-lg p-4 bg-blue-50">
				<div class="flex items-center justify-between mb-3">
					<div class="flex-1">
						<h3 class="font-semibold text-lg">{requirement.title}</h3>
						<p class="text-gray-700 text-sm">{requirement.description}</p>
						<p class="text-blue-800 font-medium text-sm mt-1">
							Select {requirement.needs} from {requirement.options.length} options:
						</p>
					</div>
					
					<!-- Group progress indicator -->
					<div class="flex-shrink-0 ml-4">
						<div class="text-sm text-gray-600 text-right">
							<div class="font-medium">
								{groupProgress}/{groupRequiredCount} completed
							</div>
							<div class="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
								<div 
									class="h-full bg-green-500 transition-all duration-300 ease-out"
									style="width: {groupRequiredCount > 0 ? (groupProgress / groupRequiredCount) * 100 : 0}%"
								></div>
							</div>
						</div>
					</div>
				</div>
				
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
					{#each requirement.options as option}
						{#if option.type === 'course'}
							<!-- Force reactivity by depending on both stores -->
							{@const optionCompletedSource = reactiveKey && getCompletedCourseOfGroupSource(option.courseId, groupCourseIds)}
							{@const isEffectivelyCompleted = optionCompletedSource !== null}
							{@const isDirectlyCompleted = reactiveKey && $completedCourses.has(option.courseId)}
							<div 
								class="flex items-center justify-between p-2 rounded border transition-colors cursor-pointer
										{isEffectivelyCompleted
											? 'bg-green-100 hover:bg-green-200 border-green-200' 
											: 'bg-white hover:bg-gray-50 border-gray-200'}"
								on:click={() => onToggleCompletion(option.courseId)}
								on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggleCompletion(option.courseId); } }}
								role="button"
								tabindex="0"
								title={isEffectivelyCompleted ? 'Mark as incomplete' : 'Mark as complete'}
							>
								<div class="flex items-center space-x-2">
									<div
										class="w-4 h-4 rounded border-2 border-gray-300 flex items-center justify-center 
												{isDirectlyCompleted ? 'bg-green-500 border-green-500' : 'bg-white'} 
												hover:border-green-400 transition-colors"
									>
										{#if isDirectlyCompleted}
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
									
									<!-- Equivalent course indicator for group options -->
									{#if isEffectivelyCompleted && optionCompletedSource !== option.courseId}
										<button
											class="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded hover:bg-green-200 hover:shadow-sm transition-all duration-200 cursor-pointer via-button"
											on:click|stopPropagation={() => window.open(`/courses/${optionCompletedSource}`, '_blank')}
											title="View {optionCompletedSource} prerequisites and details (opens in new tab)"
										>
											✓ Via: {optionCompletedSource}
										</button>
									{/if}
								</div>
							</div>
						{/if}
					{/each}
				</div>
			</div>
		{/if}
	{/each}
</div>

<style>
	/* Prevent parent hover state when hovering over Via button */
	.via-button:hover {
		/* Force the parent to not apply hover styles when hovering over the via button */
		pointer-events: auto;
	}
	
	/* Individual course requirement - prevent hover state propagation */
	div[role="button"]:has(.via-button:hover) {
		background-color: rgb(220 252 231) !important; /* Keep light green bg-green-100 */
		border-color: rgb(187 247 208) !important; /* Keep light green border-green-200 */
	}
	
	/* Group option - prevent hover state propagation */
	div[role="button"]:has(.via-button:hover) {
		background-color: rgb(220 252 231) !important; /* Keep light green bg-green-100 */
		border-color: rgb(187 247 208) !important; /* Keep light green border-green-200 */
	}
</style>