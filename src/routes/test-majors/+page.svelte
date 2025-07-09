<script lang="ts">
	import { onMount } from 'svelte';
	import { loadMajorByName, majorNameToId, majorIdToDisplayName, getAllMajorCourses } from "../../lib/services/data/loadMajors.js";
	import type { Major } from '../../lib/types.js';

	let major: Major | null = null;
	let loading = true;
	let error = '';
	let allCourses: string[] = [];
	
	// Test URL encoding round-trip
	const testNames = [
		'Mathematics BS',
		'Computer Science and Engineering BS',
		'Mathematics/Economics BS',
		"Women's Studies BA"
	];
	
	let urlTests: Array<{name: string, id: string, roundTrip: string, passed: boolean}> = [];

	onMount(async () => {
		// Test URL encoding
		urlTests = testNames.map(name => {
			const id = majorNameToId(name);
			const roundTrip = majorIdToDisplayName(id);
			return {
				name,
				id,
				roundTrip,
				passed: name === roundTrip
			};
		});

		// Test major loading
		try {
			major = await loadMajorByName('Mathematics BS');
			if (major) {
				allCourses = getAllMajorCourses(major);
			} else {
				error = 'Failed to load Mathematics BS major';
			}
		} catch (e) {
			error = `Error loading major: ${e}`;
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>Major Service Test - BruinPlan</title>
</svelte:head>

<div class="container mx-auto p-8 max-w-4xl">
	<h1 class="text-3xl font-bold mb-8">Major Loading Service Test</h1>

	<!-- URL Encoding Tests -->
	<section class="mb-8">
		<h2 class="text-2xl font-semibold mb-4">URL Encoding Round-Trip Test</h2>
		<div class="bg-gray-50 p-4 rounded-lg">
			{#each urlTests as test}
				<div class="mb-2 font-mono text-sm">
					<span class={test.passed ? 'text-green-600' : 'text-red-600'}>
						{test.passed ? '✅' : '❌'}
					</span>
					"{test.name}" → "{test.id}" → "{test.roundTrip}"
				</div>
			{/each}
		</div>
	</section>

	<!-- Major Loading Test -->
	<section class="mb-8">
		<h2 class="text-2xl font-semibold mb-4">Major Loading Test</h2>
		
		{#if loading}
			<div class="text-gray-600">Loading Mathematics BS major...</div>
		{:else if error}
			<div class="text-red-600 bg-red-50 p-4 rounded-lg">
				❌ {error}
			</div>
		{:else if major}
			<div class="bg-green-50 p-4 rounded-lg">
				<h3 class="text-lg font-semibold text-green-800 mb-2">Successfully loaded major!</h3>
				
				<div class="grid grid-cols-2 gap-4 mb-4">
					<div>
						<strong>Name:</strong> {major.name}
					</div>
					<div>
						<strong>College:</strong> {major.college}
					</div>
					<div>
						<strong>Department:</strong> {major.department}
					</div>
					<div>
						<strong>Degree:</strong> {major.degreeObjective}
					</div>
				</div>

				<div class="mb-4">
					<strong>Overview:</strong> {major.overview}
				</div>

				<h4 class="font-semibold mb-2">Sections ({major.sections.length}):</h4>
				{#each major.sections as section}
					<div class="ml-4 mb-3 border-l-2 border-blue-200 pl-4">
						<h5 class="font-medium text-blue-800">{section.title}</h5>
						<p class="text-gray-600 text-sm mb-2">{section.description}</p>
						
						<div class="text-sm">
							<span class="text-gray-700">
								📚 {section.requirements.filter(r => r.type === 'course').length} courses, {section.requirements.filter(r => r.type === 'group').length} groups
							</span>

							{#each section.requirements.filter(r => r.type === 'group') as group}
								<div class="mt-1 text-xs text-gray-600">
									"{group.title}": needs {group.needs} from {group.options.length} options
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</section>

	<!-- Course Extraction Test -->
	{#if allCourses.length > 0}
		<section>
			<h2 class="text-2xl font-semibold mb-4">Course Extraction Test</h2>
			<div class="bg-blue-50 p-4 rounded-lg">
				<h3 class="text-lg font-semibold text-blue-800 mb-2">
					Extracted {allCourses.length} total course references
				</h3>
				
				<div class="text-sm text-gray-700 mb-2">
					Sample courses: {allCourses.slice(0, 10).join(', ')}{allCourses.length > 10 ? '...' : ''}
				</div>

				<details class="text-xs">
					<summary class="cursor-pointer text-blue-600 hover:text-blue-800">
						Show all courses
					</summary>
					<div class="mt-2 p-2 bg-white rounded border max-h-40 overflow-y-auto">
						{allCourses.join(', ')}
					</div>
				</details>
			</div>
		</section>
	{/if}
</div>

<style>
	.container {
		font-family: system-ui, -apple-system, sans-serif;
	}
</style>
