<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import Footer from '../lib/components/shared/Footer.svelte';
	
	// Add some subtle animations on mount
	let heroVisible = false;
	let cardsVisible = false;
	
	onMount(() => {
		setTimeout(() => heroVisible = true, 100);
		setTimeout(() => cardsVisible = true, 300);
	});
</script>

<svelte:head>
	<title>BruinPlan - UCLA Course Planning & Prerequisite Visualization Tool</title>
	<meta name="description" content="Plan your UCLA academic journey with interactive course prerequisite visualization and major requirement tracking. Explore majors, visualize course pathways, and track progress." />
	<meta name="keywords" content="UCLA, course planning, prerequisites, major requirements, academic planning, BruinPlan" />
	<link rel="canonical" href="https://bruinplan.com/" />
	
	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://bruinplan.com/" />
	<meta property="og:title" content="BruinPlan - UCLA Course Planning Tool" />
	<meta property="og:description" content="Plan your UCLA academic journey with interactive course prerequisite visualization and major requirement tracking." />
	<meta property="og:image" content="https://bruinplan.com/og-image.png" />
	
	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content="https://bruinplan.com/" />
	<meta property="twitter:title" content="BruinPlan - UCLA Course Planning Tool" />
	<meta property="twitter:description" content="Plan your UCLA academic journey with interactive course prerequisite visualization and major requirement tracking." />
	<meta property="twitter:image" content="https://bruinplan.com/og-image.png" />
	
	<!-- JSON-LD Structured Data -->
	<script type="application/ld+json">
	{
		"@context": "https://schema.org",
		"@type": "WebApplication",
		"name": "BruinPlan",
		"url": "https://bruinplan.com",
		"description": "Interactive course planning and prerequisite visualization tool for UCLA students",
		"applicationCategory": "EducationApplication",
		"operatingSystem": "All",
		"creator": {
			"@type": "Person",
			"name": "David Kahdian"
		},
		"audience": {
			"@type": "EducationalAudience",
			"educationalRole": "student"
		},
		"provider": {
			"@type": "EducationalOrganization",
			"name": "UCLA",
			"alternateName": "University of California, Los Angeles"
		}
	}
	</script>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-600 to-blue-200">
	<!-- Hero Section -->
	<div class="relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-800 text-white">
		<div class="absolute inset-0 bg-black opacity-10"></div>
		<div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
			<div class="text-center transform transition-all duration-1000 {heroVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}">
				<h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
					<span class="bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent">
						BruinPlan
					</span>
				</h1>
				<p class="text-xl sm:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
					Plan and visualize your UCLA academic journey with ease.
				</p>
			</div>
		</div>
	</div>

	<!-- Main Navigation Cards -->
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
		<div class="grid md:grid-cols-2 gap-8 transform transition-all duration-1000 delay-300 {cardsVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}">
			
			<!-- Major Planning Card -->
			<div class="group">
				<a href="{base}/majors" class="block">
					<div class="bg-gradient-to-br from-yellow-300 to-yellow-100 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:from-yellow-200 hover:to-yellow-400">
						<div class="flex items-center justify-between mb-6">
							<div class="bg-yellow-200 rounded-full p-4">
								<svg class="w-8 h-8 text-yellow-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
								</svg>
							</div>
							<div class="text-yellow-800 group-hover:translate-x-1 transition-transform duration-300">
								<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
								</svg>
							</div>
						</div>
						<h2 class="text-2xl font-bold text-gray-900 mb-4">Explore Majors</h2>
						<p class="text-gray-700 leading-relaxed">
							Browse UCLA majors, track your progress through degree requirements, 
							and see exactly what courses you need to complete your program.
						</p>
					</div>
				</a>
			</div>

			<!-- Course Prerequisites Card -->
			<div class="group">
				<a href="{base}/courses" class="block">
					<div class="bg-gradient-to-br from-yellow-200 to-red-400 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:from-orange-300 hover:to-red-400">
						<div class="flex items-center justify-between mb-6">
							<div class="bg-red-200 rounded-full p-4">
								<svg class="w-8 h-8 text-red-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
								</svg>
							</div>
							<div class="text-red-800 group-hover:translate-x-1 transition-transform duration-300">
								<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
								</svg>
							</div>
						</div>
						<h2 class="text-2xl font-bold text-gray-900 mb-4">Course Prerequisites</h2>
						<p class="text-gray-700 leading-relaxed">
							Visualize course prerequisite chains with interactive graphs. 
							See the complete path of courses needed before taking any class.
						</p>
					</div>
				</a>
			</div>
		</div>
	</div>

	<Footer />
</div>
