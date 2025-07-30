<!--
	Majors List Page
	Shows all available majors organized by college/school
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { majorNameToId } from '../../lib/data-layer/api.js';
	import { recentlyVisitedMajorsService } from '../../lib/services/shared/recentlyVisitedMajors.js';
	import Footer from '../../lib/components/shared/Footer.svelte';
	import type { MajorInfo } from '../../lib/types.js';

	export let data: { majors: MajorInfo[] };
	
	$: majors = data.majors;
	
	let searchQuery = '';
	let recentMajors: Array<{id: string; name: string; school: string; department: string; visitedAt: number}> = [];

	// Load recently visited majors on mount
	onMount(() => {
		recentMajors = recentlyVisitedMajorsService.getRecentMajors();
	});

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

	// Show recently visited section only when search is empty
	$: showRecentlyVisited = !searchQuery.trim() && recentMajors.length > 0;
</script>

<svelte:head>
	<title>UCLA Majors - Browse All Undergraduate Programs | BruinPlan</title>
	<meta name="description" content="Browse all UCLA undergraduate majors and their requirements. Track progress, plan courses, and explore degree programs across all schools and colleges." />
	<meta name="keywords" content="UCLA majors, undergraduate programs, degree requirements, major planning, UCLA colleges, BruinPlan" />
	<link rel="canonical" href="https://bruinplan.com/majors" />
	
	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://bruinplan.com/majors" />
	<meta property="og:title" content="UCLA Majors - Browse All Undergraduate Programs" />
	<meta property="og:description" content="Browse all UCLA undergraduate majors and their requirements" />
	<meta property="og:image" content="https://bruinplan.com/og-image.png" />
	
	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content="https://bruinplan.com/majors" />
	<meta property="twitter:title" content="UCLA Majors - Browse All Undergraduate Programs" />
	<meta property="twitter:description" content="Browse all UCLA undergraduate majors and their requirements" />
	<meta property="twitter:image" content="https://bruinplan.com/og-image.png" />
	
	<!-- JSON-LD Structured Data -->
	<script type="application/ld+json">
	{JSON.stringify({
		"@context": "https://schema.org",
		"@type": "WebPage",
		"name": "UCLA Majors",
		"description": "Browse all UCLA undergraduate majors and their requirements",
		"url": "https://bruinplan.com/majors",
		"mainEntity": {
			"@type": "ItemList",
			"name": "UCLA Undergraduate Majors",
			"numberOfItems": majors.length,
			"itemListElement": majors.slice(0, 10).map((major, index) => ({
				"@type": "EducationalOccupationalProgram",
				"position": index + 1,
				"name": major.name,
				"provider": {
					"@type": "EducationalOrganization",
					"name": "University of California, Los Angeles",
					"department": major.department
				},
				"url": `https://bruinplan.com/majors/${majorNameToId(major.name)}`
			}))
		},
		"provider": {
			"@type": "WebApplication",
			"name": "BruinPlan",
			"url": "https://bruinplan.com"
		}
	})}
	</script>
	
	<!-- BreadcrumbList for navigation -->
	<script type="application/ld+json">
	{JSON.stringify({
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		"itemListElement": [
			{
				"@type": "ListItem",
				"position": 1,
				"name": "Home",
				"item": "https://bruinplan.com/"
			},
			{
				"@type": "ListItem",
				"position": 2,
				"name": "UCLA Majors",
				"item": "https://bruinplan.com/majors"
			}
		]
	})}
	</script>
</svelte:head>

<!-- Page with blue gradient background -->
<div class="min-h-screen bg-gradient-to-br from-blue-600 to-blue-200">
	<div class="container mx-auto px-4 py-8">
		<!-- Title and search bar -->
		<div class="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
			<h1 class="text-3xl font-bold text-blue-1-00">UCLA Undergraduate Majors</h1>
			
			<!-- Search bar with light blue background -->
			<div class="relative md:w-96">
				<input
					type="text"
					placeholder="Search majors, colleges, or departments..."
					bind:value={searchQuery}
					class="w-full px-4 py-3 pl-10 bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent text-gray-800 placeholder-gray-500"
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

		<!-- Recently Visited Section -->
		{#if showRecentlyVisited}
			<section class="mb-8">
				<h2 class="text-2xl font-semibold mb-4 text-blue-1000 border-b border-blue-300 pb-2">
					Recently Visited
				</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each recentMajors as recentMajor}
						<a
							href="{base}/majors/{recentMajor.id}"
							class="block p-4 bg-gradient-to-r from-yellow-100 to-yellow-500 border border-yellow-300 rounded-lg hover:from-yellow-200 hover:to-yellow-300 hover:border-yellow-400 transition-all duration-200 shadow-sm hover:shadow-md"
						>
							<h3 class="font-medium text-lg mb-2 text-gray-800">{recentMajor.name}</h3>
							{#if recentMajor.department}
								<p class="text-sm text-gray-600 mb-1">Department: {recentMajor.department}</p>
							{/if}
							<p class="text-sm text-yellow-800">{recentMajor.school}</p>
						</a>
					{/each}
				</div>
			</section>
		{/if}

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
					<h2 class="text-2xl font-semibold mb-4 text-blue-1000 border-b border-blue-300 pb-2">
						{college}
					</h2>
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{#each collegeMajors as major}
							<a
								href="{base}/majors/{majorNameToId(major.name)}"
								class="block p-4 bg-gradient-to-r from-yellow-100 to-yellow-300 border border-yellow-700 rounded-lg hover:from-yellow-200 hover:to-yellow-500 hover:border-yellow-400 transition-all duration-200 shadow-sm hover:shadow-md"
							>
								<h3 class="font-medium text-lg mb-2 text-gray-800">{major.name}</h3>
								{#if major.department}
									<p class="text-sm text-gray-600 mb-1">Department: {major.department}</p>
								{/if}
								<p class="text-sm text-yellow-800">{major.degreeObjective}</p>
							</a>
						{/each}
					</div>
				</section>
			{/each}
		{/if}
	</div>

	<Footer />
</div>
