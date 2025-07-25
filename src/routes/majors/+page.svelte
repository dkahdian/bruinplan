<!--
	Majors List Page
	Shows all available majors organized by college/school
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { majorNameToId } from '../../lib/data-layer/api.js';
	import Footer from '../../lib/components/shared/Footer.svelte';
	import type { MajorInfo } from '../../lib/types.js';

	export let data: { majors: MajorInfo[] };
	
	$: majors = data.majors;
	
	let searchQuery = '';

	// Filter majors based on search query
	$: filteredMajors = majors.filter(major => 
		major.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
		major.college.toLowerCase().includes(searchQuery.toLowerCase()) ||
		major.department.toLowerCase().includes(searchQuery.toLowerCase())
	);

	// Group filtered majors by college
	$: majorsByCollege = filteredMajors.reduce((acc, major) => {
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
	<!-- Title and search bar on the same line -->
	<div class="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
		<h1 class="text-3xl font-bold">UCLA Undergraduate Majors</h1>
		
		<!-- Search bar -->
		<div class="relative md:w-96">
			<input
				type="text"
				placeholder="Search majors, colleges, or departments..."
				bind:value={searchQuery}
				class="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
			/>
			<svg 
				class="absolute left-3 top-3.5 h-5 w-5 text-gray-400" 
				fill="none" 
				stroke="currentColor" 
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
			</svg>
		</div>
	</div>

	{#if filteredMajors.length === 0}
		{#if searchQuery}
			<div class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
				No majors found matching "{searchQuery}". Try a different search term.
			</div>
		{:else}
			<div class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
				No majors found. Please ensure major data files are available.
			</div>
		{/if}
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
