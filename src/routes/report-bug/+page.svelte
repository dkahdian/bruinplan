<script lang="ts">
	import { base } from '$app/paths';
	import Footer from '../../lib/components/shared/Footer.svelte';
</script>

<svelte:head>
	<title>Report a Bug - BruinPlan</title>
	<meta name="description" content="Report bugs and technical issues to help improve BruinPlan for all UCLA students." />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-amber-50">
	<!-- Header -->
	<div class="bg-gradient-to-r from-yellow-600 to-amber-600 text-white">
		<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
			<div class="text-center">
				<h1 class="text-4xl sm:text-5xl font-bold mb-4">
					Report a <span class="bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent">Bug</span>
				</h1>
				<p class="text-xl text-yellow-100 max-w-2xl mx-auto">
					Help us improve BruinPlan by reporting any issues you encounter
				</p>
			</div>
		</div>
	</div>

	<!-- Main Content -->
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
		<div class="bg-white rounded-2xl shadow-xl p-8 sm:p-12">
			
			<!-- Intro Section -->
			<section class="text-center mb-12">
				<div class="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-8 mb-8">
					<div class="bg-yellow-100 rounded-full p-4 w-16 h-16 mx-auto mb-6">
						<svg class="w-8 h-8 text-yellow-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"></path>
						</svg>
					</div>
					<h2 class="text-3xl font-bold text-gray-900 mb-4">Found a Bug?</h2>
					<p class="text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
						Your feedback is invaluable in making BruinPlan better for all UCLA students. 
						If you've encountered a technical issue, incorrect data, or unexpected behavior, please let us know!
					</p>
				</div>
			</section>

			<!-- How to Report Section -->
			<section class="mb-12">
				<h2 class="text-3xl font-bold text-gray-900 mb-8">How to Report a Bug</h2>
				
				<div class="bg-gray-50 rounded-lg p-6 mb-8">
					<h3 class="text-xl font-semibold text-gray-800 mb-4 flex items-center">
						<svg class="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
						</svg>
						Send us an Email
					</h3>
					<p class="text-gray-700 mb-4">
						Email us directly with details about the bug you encountered:
					</p>
					<div class="bg-white rounded-lg p-4 border border-gray-200 mb-4">
						<p class="text-lg font-mono text-blue-600">bugs@bruinplan.com</p>
					</div>
				</div>

				<div class="bg-blue-50 rounded-lg p-6 mb-8">
					<h3 class="text-xl font-semibold text-blue-800 mb-4">What to Include in Your Report</h3>
					<div class="space-y-4">
						<div class="flex items-start space-x-3">
							<div class="bg-blue-200 rounded-full p-1 mt-1">
								<svg class="w-4 h-4 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
								</svg>
							</div>
							<div>
								<h4 class="font-semibold text-blue-800">Clear Description</h4>
								<p class="text-blue-700 text-sm">Describe what you were trying to do and what went wrong</p>
                                <p class="text-blue-700 text-sm">If the problem is related to a prerequisite or requirement, please list what the correct requirement should be, ideally with a source.</p>
							</div>
						</div>
						<div class="flex items-start space-x-3">
							<div class="bg-blue-200 rounded-full p-1 mt-1">
								<svg class="w-4 h-4 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
								</svg>
							</div>
							<div>
								<h4 class="font-semibold text-blue-800">Steps to Reproduce</h4>
								<p class="text-blue-700 text-sm">List the exact steps someone else could follow to see the same issue</p>
							</div>
						</div>
						<div class="flex items-start space-x-3">
							<div class="bg-blue-200 rounded-full p-1 mt-1">
								<svg class="w-4 h-4 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
								</svg>
							</div>
							<div>
								<h4 class="font-semibold text-blue-800">Browser & Device Info</h4>
								<p class="text-blue-700 text-sm">What browser you're using (Chrome, Firefox, Safari, etc.) and device type</p>
							</div>
						</div>
						<div class="flex items-start space-x-3">
							<div class="bg-blue-200 rounded-full p-1 mt-1">
								<svg class="w-4 h-4 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
								</svg>
							</div>
							<div>
								<h4 class="font-semibold text-blue-800">Screenshots (if helpful)</h4>
								<p class="text-blue-700 text-sm">Visual evidence can help us understand the issue faster</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			<!-- Common Issues Section -->
			<section class="mb-12">
				<h2 class="text-3xl font-bold text-gray-900 mb-8">Common Issues</h2>
				<div class="grid sm:grid-cols-2 gap-6">
					<div class="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
						<h3 class="text-lg font-semibold text-yellow-800 mb-2">Graph Not Loading</h3>
						<p class="text-yellow-700 text-sm">
							If course prerequisite graphs aren't displaying, try refreshing the page or clearing your browser cache.
						</p>
					</div>
					<div class="bg-purple-50 rounded-lg p-6 border border-purple-200">
						<h3 class="text-lg font-semibold text-purple-800 mb-2">Incorrect Prerequisites</h3>
						<p class="text-purple-700 text-sm">
							If you notice wrong prerequisite information, please report it so we can update our course data.
						</p>
					</div>
					<div class="bg-green-50 rounded-lg p-6 border border-green-200">
						<h3 class="text-lg font-semibold text-green-800 mb-2">Progress Not Saving</h3>
						<p class="text-green-700 text-sm">
							If your completed courses aren't being remembered, check if cookies/localStorage are enabled in your browser.
						</p>
					</div>
					<div class="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
						<h3 class="text-lg font-semibold text-yellow-800 mb-2">Page Crashes</h3>
						<p class="text-yellow-700 text-sm">
							If BruinPlan becomes unresponsive, please include your browser's developer console errors in your report.
						</p>
					</div>
				</div>
			</section>

			<!-- Response Time -->
			<section class="mb-12">
				<div class="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
					<h3 class="text-xl font-semibold text-gray-800 mb-3 flex items-center">
						<svg class="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
						</svg>
						Response Time
					</h3>
					<p class="text-gray-700">
						We typically respond to bug reports within <strong>24-48 hours</strong> during business days. 
						Critical issues affecting many users will be prioritized for faster resolution.
					</p>
				</div>
			</section>

			<!-- Thank You -->
			<section class="text-center mb-8">
				<div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
					<h3 class="text-2xl font-bold text-gray-900 mb-3">Thank You!</h3>
					<p class="text-gray-600">
						Your bug reports help make BruinPlan better for the entire UCLA community. 
						Every report contributes to a more reliable and useful tool for course planning.
					</p>
				</div>
			</section>

			<!-- Navigation Links -->
			<div class="flex flex-col sm:flex-row justify-center items-center gap-6 pt-8 border-t border-gray-200">
				<a href="{base}/" class="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
					</svg>
					<span>Back to Home</span>
				</a>
				<div class="hidden sm:block text-gray-400">•</div>
				<a href="{base}/help" class="inline-flex items-center space-x-2 text-purple-600 hover:text-purple-800 transition-colors">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
					</svg>
					<span>Get Help</span>
				</a>
			</div>
		</div>
	</div>

	<Footer />
</div>
