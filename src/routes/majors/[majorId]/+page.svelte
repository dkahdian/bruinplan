<!--
	Individual Major Display Page
	Shows detailed major requirements organized by sections
-->
<script lang="ts">
	import type { Major } from '../../../lib/types.js';
	import { getAllMajorCourses } from '../../../lib/services/loadMajors.js';
	
	export let data: { major: Major; majorId: string };
	
	$: major = data.major;
	$: majorId = data.majorId;
	
	// Get all courses for this major
	$: allCourses = getAllMajorCourses(major);
	
	// TODO: This will be replaced with actual completion tracking
	let completedCourses = new Set<string>();
	
	function toggleCourseCompletion(courseId: string) {
		if (completedCourses.has(courseId)) {
			completedCourses.delete(courseId);
		} else {
			completedCourses.add(courseId);
		}
		completedCourses = completedCourses; // Trigger reactivity
	}
	
	function navigateToCourse(courseId: string) {
		window.location.href = `/courses/${courseId}`;
	}
</script>

<svelte:head>
	<title>{major.name} - BruinPlan</title>
	<meta name="description" content="Requirements and prerequisites for {major.name} at UCLA" />
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<!-- Major Header -->
	<div class="mb-8">
		<nav class="text-sm breadcrumbs mb-4">
			<a href="/majors" class="text-blue-600 hover:text-blue-800">← All Majors</a>
		</nav>
		
		<h1 class="text-3xl font-bold mb-4">{major.name}</h1>
		
		<div class="bg-gray-50 rounded-lg p-6 mb-6">
			<p class="text-lg mb-4">{major.overview}</p>
			
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
				<div>
					<strong>College:</strong>
					<br>{major.college}
				</div>
				<div>
					<strong>Department:</strong>
					<br>{major.department}
				</div>
				<div>
					<strong>Degree Level:</strong>
					<br>{major.degreeLevel}
				</div>
				<div>
					<strong>Degree:</strong>
					<br>{major.degreeObjective}
				</div>
			</div>
		</div>
		
		<!-- Quick Stats -->
		<div class="flex flex-wrap gap-4 text-sm text-gray-600 mb-6">
			<span>📚 {allCourses.length} total course references</span>
			<span>📋 {major.sections.length} sections</span>
			<span>✅ {completedCourses.size} completed</span>
		</div>
	</div>

	<!-- Major Sections -->
	<div class="space-y-8">
		{#each major.sections as section}
			<section class="bg-white border border-gray-200 rounded-lg p-6">
				<div class="mb-4">
					<h2 class="text-2xl font-semibold mb-2">{section.title}</h2>
					<p class="text-gray-700">{section.description}</p>
				</div>
				
				<div class="space-y-4">
					{#each section.requirements as requirement}
						{#if requirement.type === 'course'}
							<!-- Individual Course Requirement -->
							<div class="flex items-center justify-between p-3 bg-gray-50 rounded border">
								<div class="flex items-center space-x-3">
									<button
										class="w-5 h-5 rounded border-2 border-gray-300 flex items-center justify-center 
												{completedCourses.has(requirement.courseId) ? 'bg-green-500 border-green-500' : 'bg-white'} 
												hover:border-green-400 transition-colors"
										on:click={() => toggleCourseCompletion(requirement.courseId)}
									>
										{#if completedCourses.has(requirement.courseId)}
											<span class="text-white text-xs">✓</span>
										{/if}
									</button>
									
									<button
										class="text-blue-600 hover:text-blue-800 font-medium"
										on:click={() => navigateToCourse(requirement.courseId)}
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
											<div class="flex items-center space-x-2 p-2 bg-white rounded border">
												<button
													class="w-4 h-4 rounded border-2 border-gray-300 flex items-center justify-center 
															{completedCourses.has(option.courseId) ? 'bg-green-500 border-green-500' : 'bg-white'} 
															hover:border-green-400 transition-colors"
													on:click={() => toggleCourseCompletion(option.courseId)}
												>
													{#if completedCourses.has(option.courseId)}
														<span class="text-white text-xs">✓</span>
													{/if}
												</button>
												
												<button
													class="text-blue-600 hover:text-blue-800 text-sm"
													on:click={() => navigateToCourse(option.courseId)}
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
			</section>
		{/each}
	</div>
	
	<!-- TODO: Add graph view toggle and visualization here -->
	<div class="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
		<p class="text-sm text-yellow-800">
			🚧 <strong>Coming soon:</strong> Interactive prerequisite graph view, missing prerequisite detection, and completion tracking.
		</p>
	</div>
</div>

<style>
	.breadcrumbs {
		@apply text-gray-600;
	}
</style>
