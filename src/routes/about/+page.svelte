<script lang="ts">
	import { base } from '$app/paths';
	import Footer from '../../lib/components/shared/Footer.svelte';
</script>

<svelte:head>
	<title>About BruinPlan - UCLA Course Planning Tool</title>
	<meta name="description" content="Learn how BruinPlan was built with SvelteKit and TypeScript, how UCLA course data is collected, and how your privacy is protected with local-only storage." />
	<meta name="keywords" content="BruinPlan, UCLA, course planning, SvelteKit, TypeScript, privacy, local storage" />
	<link rel="canonical" href="https://bruinplan.com/about" />
	
	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://bruinplan.com/about" />
	<meta property="og:title" content="About BruinPlan - UCLA Course Planning Tool" />
	<meta property="og:description" content="Learn how BruinPlan was built and how your data is kept private with local-only storage." />
	<meta property="og:image" content="https://bruinplan.com/og-image.png" />
	
	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content="https://bruinplan.com/about" />
	<meta property="twitter:title" content="About BruinPlan - UCLA Course Planning Tool" />
	<meta property="twitter:description" content="Learn how BruinPlan was built and how your data is kept private with local-only storage." />
	<meta property="twitter:image" content="https://bruinplan.com/og-image.png" />
	
	<!-- JSON-LD Structured Data -->
	<script type="application/ld+json">
	{
		"@context": "https://schema.org",
		"@type": "Person",
		"name": "David Kahdian",
		"jobTitle": "Developer",
		"affiliation": {
			"@type": "EducationalOrganization",
			"name": "University of California, Los Angeles",
			"alternateName": "UCLA"
		},
		"description": "Creator of BruinPlan, a course planning tool for UCLA students",
		"url": "https://bruinplan.com/about"
	}
	</script>
	
	<script type="application/ld+json">
	{
		"@context": "https://schema.org",
		"@type": "Organization",
		"name": "BruinPlan",
		"url": "https://bruinplan.com",
		"description": "Interactive course planning and prerequisite visualization tool for UCLA students",
		"founder": {
			"@type": "Person",
			"name": "David Kahdian"
		},
		"sameAs": [
			"https://github.com/dkahdian/bruinplan"
		]
	}
	</script>
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
					How it works, how your data is handled, and who built it.
				</p>
			</div>
		</div>
	</div>

	<!-- Main Content -->
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
		<div class="bg-white rounded-2xl shadow-xl p-8 sm:p-12">

			<!-- Data Collection Section -->
			<section class="mb-12">
				<h2 class="text-2xl font-bold text-gray-900 mb-4">Where does the data come from?</h2>
				<div class="prose prose-lg text-gray-600 leading-relaxed">
					<p>
						All course and major requirement data in BruinPlan is collected from publicly available resources provided by the UCLA Registrar and departmental websites. No private or restricted data is used. Data is periodically updated to reflect the latest catalog information.
					</p>
				</div>
			</section>

			<!-- User Data Section -->
			<section class="mb-12">
				<h2 class="text-2xl font-bold text-gray-900 mb-4">How is your data used?</h2>
				<div class="prose prose-lg text-gray-600 leading-relaxed">
					<p>
						BruinPlan is designed with privacy in mind. Any progress tracking or planning you do is stored <strong>locally in your browser</strong> using localStorage. No personal or academic data ever leaves your device—nothing is sent to any server.
					</p>
				</div>
			</section>

			<!-- How It Was Made Section -->
			<section class="mb-12">
				<h2 class="text-2xl font-bold text-gray-900 mb-4">How was BruinPlan built?</h2>
				<div class="prose prose-lg text-gray-600 leading-relaxed">
					<p>
						BruinPlan is a modern web app built with <span class="font-semibold text-blue-700">SvelteKit</span> and <span class="font-semibold text-blue-700">TypeScript</span>, styled with <span class="font-semibold text-purple-700">Tailwind CSS</span>. Interactive course graphs are powered by <span class="font-semibold text-green-700">Cytoscape.js</span>. All code is open source and available on GitHub.
					</p>
				</div>
			</section>

			<!-- Creator Section -->
			<section class="mb-12">
				<h2 class="text-2xl font-bold text-gray-900 mb-4">Meet the Creator</h2>
				<div class="flex flex-col sm:flex-row items-center gap-6">
					<img src="/profile.jpg" alt="David Kahdian" class="w-32 h-32 rounded-full shadow-lg border-4 border-blue-200 object-cover" loading="lazy" />
					<div>
						<p class="text-lg text-gray-700 mb-2 font-semibold">David Kahdian</p>
						<p class="text-gray-600">UCLA Computer Engineering & Applied Mathematics</p>
					</div>
				</div>
			</section>

			<!-- Open Source Section -->
			<section class="mb-12">
				<h2 class="text-2xl font-bold text-gray-900 mb-4">Open Source & Community</h2>
				<div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
					<p class="text-gray-700 leading-relaxed mb-4">
						BruinPlan is an open-source project. Contributions, feedback, and suggestions are always welcome!
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
