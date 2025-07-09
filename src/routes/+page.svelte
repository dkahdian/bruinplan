<script lang="ts">
	import { onMount } from 'svelte';
	import Footer from '../lib/components/Footer.svelte';
	
	// Add some subtle animations on mount
	let heroVisible = false;
	let cardsVisible = false;
	
	onMount(() => {
		setTimeout(() => heroVisible = true, 100);
		setTimeout(() => cardsVisible = true, 300);
	});
</script>

<svelte:head>
	<title>BruinPlan - UCLA Course & Major Planning</title>
	<meta name="description" content="Visualize course prerequisites and plan your UCLA academic journey with BruinPlan's interactive tools." />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
	<!-- Hero Section -->
	<div class="relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-800 text-white">
		<div class="absolute inset-0 bg-black opacity-10"></div>
		<div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
			<div class="text-center transform transition-all duration-1000 {heroVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}">
				<h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
					<span class="bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent">
						BruinPlan
					</span>
				</h1>
				<p class="text-xl sm:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
					Navigate your UCLA academic journey with confidence. Visualize course prerequisites, 
					explore major requirements, and plan your path to graduation.
				</p>
				<div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
					<div class="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 text-sm text-blue-100">
						Interactive prerequisite graphs
					</div>
					<div class="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 text-sm text-blue-100">
					  Complete major planning
					</div>
					<div class="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 text-sm text-blue-100">
						Progress tracking
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Main Navigation Cards -->
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
		<div class="grid md:grid-cols-2 gap-8 transform transition-all duration-1000 delay-300 {cardsVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}">
			
			<!-- Major Planning Card -->
			<div class="group relative">
				<div class="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
				<a href="/majors" class="relative block">
					<div class="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
						<div class="flex items-center justify-between mb-6">
							<div class="bg-blue-100 rounded-full p-4">
								<svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
								</svg>
							</div>
							<div class="text-blue-600 group-hover:translate-x-1 transition-transform duration-300">
								<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
								</svg>
							</div>
						</div>
						<h2 class="text-2xl font-bold text-gray-900 mb-4">Explore Majors</h2>
						<p class="text-gray-600 mb-6 leading-relaxed">
							Browse UCLA majors, track your progress through degree requirements, 
							and see exactly what courses you need to complete your program.
						</p>
						<div class="flex flex-wrap gap-2">
							<span class="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">Requirements</span>
							<span class="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">Progress Tracking</span>
							<span class="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">Course Planning</span>
						</div>
					</div>
				</a>
			</div>

			<!-- Course Prerequisites Card -->
			<div class="group relative">
				<div class="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
				<a href="/courses" class="relative block">
					<div class="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
						<div class="flex items-center justify-between mb-6">
							<div class="bg-purple-100 rounded-full p-4">
								<svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
								</svg>
							</div>
							<div class="text-purple-600 group-hover:translate-x-1 transition-transform duration-300">
								<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
								</svg>
							</div>
						</div>
						<h2 class="text-2xl font-bold text-gray-900 mb-4">Course Prerequisites</h2>
						<p class="text-gray-600 mb-6 leading-relaxed">
							Visualize course prerequisite chains with interactive graphs. 
							See the complete path of courses needed before taking any class.
						</p>
						<div class="flex flex-wrap gap-2">
							<span class="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">Interactive Graphs</span>
							<span class="bg-pink-50 text-pink-700 px-3 py-1 rounded-full text-sm font-medium">Prerequisites</span>
							<span class="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">Course Search</span>
						</div>
					</div>
				</a>
			</div>
		</div>
	</div>

	<Footer />
</div>
