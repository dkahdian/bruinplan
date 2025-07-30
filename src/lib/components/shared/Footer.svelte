<script lang="ts">
	import { base } from '$app/paths';
</script>

<footer class="bg-gray-900 text-white py-12 mt-10">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="text-center">
			<h3 class="text-2xl font-bold mb-4">BruinPlan</h3>
			<p class="text-gray-400 mb-6 max-w-2xl mx-auto">
				Empowering UCLA students to navigate their academic journey with clarity and confidence.
			</p>
			
			<!-- Footer Navigation Links -->
			<div class="flex flex-col sm:flex-row justify-center items-center gap-6 mb-8">
				<a href="{base}/" class="text-yellow-400 hover:text-yellow-300 transition-colors duration-200 flex items-center space-x-2">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
					</svg>
					<span>Home</span>
				</a>
				<div class="hidden sm:block text-gray-600">•</div>
				<a href="{base}/majors" class="text-blue-400 hover:text-blue-300 transition-colors duration-200 flex items-center space-x-2">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
					</svg>
					<span>Explore Majors</span>
				</a>
				<div class="hidden sm:block text-gray-600">•</div>
				<a href="{base}/courses" class="text-purple-400 hover:text-purple-300 transition-colors duration-200 flex items-center space-x-2">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
					</svg>
					<span>Course Prerequisites</span>
				</a>
			</div>
			
			<!-- Secondary Navigation Links -->
			<div class="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8 text-sm">
				<a href="{base}/about" class="text-gray-400 hover:text-gray-300 transition-colors duration-200 flex items-center space-x-2">
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
					</svg>
					<span>About</span>
				</a>
				<div class="hidden sm:block text-gray-600">•</div>
				<a href="{base}/help" class="text-gray-400 hover:text-gray-300 transition-colors duration-200 flex items-center space-x-2">
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
					</svg>
					<span>Help</span>
				</a>
				<div class="hidden sm:block text-gray-600">•</div>
				<a href="{base}/report-bug" class="text-gray-400 hover:text-gray-300 transition-colors duration-200 flex items-center space-x-2">
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"></path>
					</svg>
					<span>Report Bug</span>
				</a>
				<div class="hidden sm:block text-gray-600">•</div>
				<a href="{base}/known-bugs" class="text-gray-400 hover:text-gray-300 transition-colors duration-200 flex items-center space-x-2">
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
					</svg>
					<span>Known Bugs</span>
				</a>
			</div>
			
			<div class="flex justify-center space-x-8 text-sm text-gray-400">
				<span>© 2025 BruinPlan</span>
				<span>•</span>
				<span>UCLA Course Planning Tool</span>
			</div>
		</div>
	</div>
</footer>
