<!--
	Majors List Page
	Shows all available majors organized by college/school
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { majorNameToId } from '../../lib/services/loadMajors.js';
	import Footer from '../../lib/components/Footer.svelte';
	import type { MajorInfo } from '../../lib/types.js';

	export let data: { majors: MajorInfo[] };
	
	$: majors = data.majors;

	// Group majors by college
	$: majorsByCollege = majors.reduce((acc, major) => {
		const college = major.college || 'Unknown';
		if (!acc[college]) {
			acc[college] = [];
		}
		acc[college].push(major);
		return acc;
	}, {} as Record<string, MajorInfo[]>);
</script>

<svelte:head>
	<title>UCLA Majors - BruinPlan</title>
	<meta name="description" content="Browse all UCLA undergraduate majors and their requirements" />
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<h1 class="text-3xl font-bold mb-8">UCLA Undergraduate Majors</h1>

	{#if majors.length === 0}
		<div class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
			No majors found. Please ensure major data files are available.
		</div>
	{:else}
		<!-- Major list organized by college -->
		{#each Object.entries(majorsByCollege) as [college, collegeMajors]}
			<section class="mb-8">
				<h2 class="text-2xl font-semibold mb-4 border-b border-gray-300 pb-2">
					{college}
				</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each collegeMajors as major}
						<a
							href="/majors/{majorNameToId(major.name)}"
							class="block p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
						>
							<h3 class="font-medium text-lg mb-2">{major.name}</h3>
							{#if major.department}
								<p class="text-sm text-gray-600 mb-1">Department: {major.department}</p>
							{/if}
							<p class="text-sm text-blue-600">{major.degreeObjective}</p>
						</a>
					{/each}
				</div>
			</section>
		{/each}
	{/if}
</div>

<Footer />
