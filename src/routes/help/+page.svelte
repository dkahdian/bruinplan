<script lang="ts">
	import Footer from '../../lib/components/shared/Footer.svelte';
</script>

<svelte:head>
	<title>Help - BruinPlan</title>
	<meta name="description" content="Get help and support for using BruinPlan's course planning features." />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
	<!-- Header -->
	<div class="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
		<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
			<div class="text-center">
				<h1 class="text-4xl sm:text-5xl font-bold mb-4">
					Get <span class="bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent">Help</span>
				</h1>
				<p class="text-xl text-blue-100 max-w-2xl mx-auto">
					Need assistance with BruinPlan? We're here to help you succeed.
				</p>
			</div>
		</div>
	</div>

	<!-- Main Content -->
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
		<div class="bg-white rounded-2xl shadow-xl p-8 sm:p-12">
			
			<!-- Contact Section -->
			<section class="text-center mb-12">
				<div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 mb-8">
					<div class="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-6">
						<svg class="w-8 h-8 text-blue-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
						</svg>
					</div>
					<h2 class="text-3xl font-bold text-gray-900 mb-4">Contact Support</h2>
					<p class="text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
						Have questions about using BruinPlan? Need help with course planning or major requirements? 
						We're here to assist you with any questions or issues you may encounter.
					</p>
					<div class="bg-white rounded-lg p-6 border border-gray-200">
						<p class="text-gray-700 mb-2">Email us directly at:</p>
						<p class="text-lg font-mono text-blue-600 mb-4">TODO: Add support email address</p>
						<p class="text-sm text-gray-500">
							We'll get back to you as soon as we can.
						</p>
					</div>
				</div>
			</section>

			<!-- Quick Help Section -->
			<section class="mb-12">
				<h2 class="text-3xl font-bold text-gray-900 mb-8 text-center">Quick Help</h2>
				<div class="grid sm:grid-cols-2 gap-6">
					<div class="bg-blue-50 rounded-lg p-6">
						<h3 class="text-xl font-semibold text-blue-800 mb-3 flex items-center">
							<svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
							</svg>
							Course Prerequisites
						</h3>
						<p class="text-blue-700 mb-3">
							Use the interactive graphs to explore course prerequisites. Click on any course to see its prerequisite chain.
						</p>
						<a href="/courses" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
							Explore Course Prerequisites →
						</a>
					</div>
					
					<div class="bg-purple-50 rounded-lg p-6">
						<h3 class="text-xl font-semibold text-purple-800 mb-3 flex items-center">
							<svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
							</svg>
							Major Planning
						</h3>
						<p class="text-purple-700 mb-3">
							Browse major requirements, track your progress, and plan your course sequence with our quarter-by-quarter planner.
						</p>
						<a href="/majors" class="text-purple-600 hover:text-purple-800 text-sm font-medium">
							Explore Majors →
						</a>
					</div>
					
					<div class="bg-green-50 rounded-lg p-6">
						<h3 class="text-xl font-semibold text-green-800 mb-3 flex items-center">
							<svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
							</svg>
							Progress Tracking
						</h3>
						<p class="text-green-700 mb-3">
							Mark courses as completed to track your progress. Your completion status is saved locally in your browser.
						</p>
						<p class="text-green-600 text-sm font-medium">
							Tip: Use the checkboxes next to course names
						</p>
					</div>
					
					<div class="bg-yellow-50 rounded-lg p-6">
						<h3 class="text-xl font-semibold text-yellow-800 mb-3 flex items-center">
							<svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
							</svg>
							Technical Issues
						</h3>
						<p class="text-yellow-700 mb-3">
							Experiencing bugs or technical problems? Report them to help us improve BruinPlan for everyone.
						</p>
						<a href="/report-bug" class="text-yellow-600 hover:text-yellow-800 text-sm font-medium">
							Report a Bug →
						</a>
					</div>
				</div>
			</section>

			<!-- Navigation Back -->
			<div class="text-center pt-8 border-t border-gray-200">
				<a href="/" class="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors">
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
