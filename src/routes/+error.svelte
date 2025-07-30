<!--
	Error page for SvelteKit application
	Handles 404 and other errors with user-friendly messaging
-->
<script lang="ts">
	import { page } from '$app/stores';
	import { base } from '$app/paths';
	
	$: status = $page.status;
	$: message = $page.error?.message || 'Something went wrong';
	
	// Custom messages for common errors
	$: displayMessage = (() => {
		switch (status) {
			case 404:
				return 'The page you\'re looking for doesn\'t exist.';
			case 500:
				return 'Internal server error. Please try again later.';
			case 403:
				return 'You don\'t have permission to access this resource.';
			default:
				return message;
		}
	})();
	
	$: pageTitle = (() => {
		switch (status) {
			case 404:
				return 'Page Not Found';
			case 500:
				return 'Server Error';
			case 403:
				return 'Access Denied';
			default:
				return 'Error';
		}
	})();
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content="Error page for BruinPlan application" />
</svelte:head>

<div class="min-h-screen flex flex-col">
	<!-- Main Error Content -->
	<div class="flex-1 flex flex-col items-center justify-center px-4 py-8">
		<div class="text-center max-w-md mx-auto">
			<!-- Error Icon -->
			<div class="mb-6">
				<svg class="w-16 h-16 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.064 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"></path>
				</svg>
			</div>
			
			<!-- Error Message -->
			<h1 class="text-6xl font-bold text-gray-900 mb-2">{status}</h1>
			<h2 class="text-xl font-semibold text-gray-700 mb-3">{pageTitle}</h2>
			<p class="text-gray-600 mb-6 leading-relaxed">{displayMessage}</p>
			
			<!-- Action Buttons -->
			<div class="space-y-3">
				<a 
					href="{base}/"
					class="inline-flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
				>
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
					</svg>
					Go to Home
				</a>
				
				<div class="flex flex-col sm:flex-row gap-2 justify-center">
					<a 
						href="{base}/majors"
						class="inline-flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200 text-sm"
					>
						Browse Majors
					</a>
					
					<a 
						href="{base}/courses"
						class="inline-flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200 text-sm"
					>
						Browse Courses
					</a>
					
					<button 
						on:click={() => history.back()}
						class="inline-flex items-center px-3 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 text-sm"
					>
						Go Back
					</button>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	/* Ensure consistent styling */
	:global(body) {
		margin: 0;
		padding: 0;
	}
</style>
