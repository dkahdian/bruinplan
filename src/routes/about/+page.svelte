<script lang="ts">
	import { base } from '$app/paths';
	import Footer from '../../lib/components/shared/Footer.svelte';
</script>

<svelte:head>
	<title>About - BruinPlan</title>
	<meta name="description" content="Learn about BruinPlan's mission to help UCLA students navigate their academic journey with confidence." />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
	<!-- Header -->
	<div class="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
		<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
			<div class="text-center">
				<h1 class="text-4xl sm:text-5xl font-bold mb-4">
					About <span class="bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent">BruinPlan</span>
				</h1>
				<p class="text-xl text-blue-100 max-w-2xl mx-auto">
					Empowering UCLA students to navigate their academic journey with clarity and confidence
				</p>
			</div>
		</div>
	</div>

	<!-- Main Content -->
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
		<div class="bg-white rounded-2xl shadow-xl p-8 sm:p-12">
			
			<!-- Mission Section -->
			<section class="mb-12">
				<h2 class="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
				<div class="prose prose-lg text-gray-600 leading-relaxed">
					<p class="mb-6">
						TODO: Add mission statement here - focusing on helping UCLA students plan their academic journey, 
						making degree requirements more accessible, and providing better tools than traditional DARS systems
					</p>
					<p class="mb-6">
						TODO: Expand on the vision of making academic planning intuitive and visual, 
						helping students understand complex prerequisites and degree requirements
					</p>
				</div>
			</section>

			<!-- The Problem Section -->
			<section class="mb-12">
				<h2 class="text-3xl font-bold text-gray-900 mb-6">The Problem</h2>
				<div class="bg-gray-50 rounded-lg p-6 mb-6">
					<p class="text-gray-700 leading-relaxed">
						UCLA's current Degree Audit Reporting System (DARS) presents course requirements and prerequisites 
						in dense, hard-to-interpret formats. Students often struggle to visualize their academic path, 
						understand complex prerequisite chains, and plan their course sequences effectively.
					</p>
				</div>
			</section>

			<!-- Our Solution Section -->
			<section class="mb-12">
				<h2 class="text-3xl font-bold text-gray-900 mb-6">Our Solution</h2>
				<div class="grid sm:grid-cols-2 gap-6">
					<div class="bg-blue-50 rounded-lg p-6">
						<h3 class="text-xl font-semibold text-blue-800 mb-3">Visual Prerequisites</h3>
						<p class="text-blue-700">
							Interactive graphs that clearly show course prerequisite chains and dependencies, 
							making complex academic pathways easy to understand.
						</p>
					</div>
					<div class="bg-purple-50 rounded-lg p-6">
						<h3 class="text-xl font-semibold text-purple-800 mb-3">Progress Tracking</h3>
						<p class="text-purple-700">
							Smart completion tracking that shows exactly what you've completed and what's left, 
							with intelligent handling of equivalent courses and requirements.
						</p>
					</div>
					<div class="bg-green-50 rounded-lg p-6">
						<h3 class="text-xl font-semibold text-green-800 mb-3">Quarter Planning</h3>
						<p class="text-green-700">
							Drag-and-drop course scheduling with automatic prerequisite validation, 
							helping you plan your entire academic journey quarter by quarter.
						</p>
					</div>
					<div class="bg-yellow-50 rounded-lg p-6">
						<h3 class="text-xl font-semibold text-yellow-800 mb-3">Accessible Design</h3>
						<p class="text-yellow-700">
							Modern, responsive interface that works across devices, with smooth animations 
							and intuitive interactions that make academic planning enjoyable.
						</p>
					</div>
				</div>
			</section>

			<!-- Values Section -->
			<section class="mb-12">
				<h2 class="text-3xl font-bold text-gray-900 mb-6">Our Values</h2>
				<div class="prose prose-lg text-gray-600 leading-relaxed">
					<p class="mb-6">
						[TODO: Add core values such as accessibility, transparency, student empowerment, 
						open-source collaboration, etc.]
					</p>
				</div>
			</section>

			<!-- Open Source Section -->
			<section class="mb-12">
				<h2 class="text-3xl font-bold text-gray-900 mb-6">Open Source & Community</h2>
				<div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
					<p class="text-gray-700 leading-relaxed mb-4">
						BruinPlan is an open-source project built by a UCLA student, for UCLA students. We believe that 
						educational tools should be transparent, community-driven, and freely accessible to all.
					</p>
					<div class="flex flex-wrap gap-4 items-center">
						<a href="https://github.com/dkahdian/bruinplan" target="_blank" rel="noopener noreferrer" 
						   class="inline-flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
							<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
								<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
							</svg>
							<span>View on GitHub</span>
						</a>
						<span class="text-sm text-gray-500">Licensed under MIT</span>
					</div>
				</div>
			</section>

			<!-- Navigation Back -->
			<div class="text-center pt-8 border-t border-gray-200">
				<a href="{base}/" class="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
					</svg>
					<span>Back to Home</span>
				</a>
			</div>
		</div>
	</div>

	<Footer />
</div>
