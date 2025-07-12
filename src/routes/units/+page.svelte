<script lang="ts">
	import { 
		quarterLimitsStore, 
		schedulingService, 
		formatQuarterCode, 
		getCurrentQuarterCode 
	} from '../../lib/services/shared/schedulingService.js';
	
	let quarterLimits = $quarterLimitsStore;
	let hasUnsavedChanges = false;
	
	// Subscribe to store changes
	quarterLimitsStore.subscribe(value => {
		quarterLimits = value;
	});
	
	function handleDefaultChange() {
		hasUnsavedChanges = true;
	}
	
	function handleQuarterlyChange() {
		hasUnsavedChanges = true;
	}
	
	function saveChanges() {
		// Save default limits
		schedulingService.setDefaultLimit('summer', quarterLimits.defaultSummer);
		schedulingService.setDefaultLimit('nonSummer', quarterLimits.defaultNonSummer);
		
		// Save quarterly limits
		Object.entries(quarterLimits.quarterly).forEach(([quarterCode, limit]) => {
			schedulingService.setQuarterLimit(parseInt(quarterCode), limit);
		});
		
		hasUnsavedChanges = false;
		
		// Show success message
		alert('Unit limits saved successfully!');
	}
	
	function resetToDefaults() {
		if (confirm('Reset all unit limits to default values? This cannot be undone.')) {
			quarterLimits = {
				defaultSummer: 0,
				defaultNonSummer: 18,
				quarterly: {}
			};
			hasUnsavedChanges = true;
		}
	}
	
	function addQuarterLimit() {
		const currentQuarter = getCurrentQuarterCode();
		const quarterCode = prompt(`Enter quarter code (e.g., ${currentQuarter}):`);
		
		if (quarterCode) {
			const code = parseInt(quarterCode);
			if (!isNaN(code) && code > 0) {
				quarterLimits.quarterly[code] = 18;
				hasUnsavedChanges = true;
			} else {
				alert('Invalid quarter code. Please enter a valid number.');
			}
		}
	}
	
	function removeQuarterLimit(quarterCode: number) {
		delete quarterLimits.quarterly[quarterCode];
		quarterLimits = { ...quarterLimits };
		hasUnsavedChanges = true;
	}
</script>

<svelte:head>
	<title>Unit Limits Management - BruinPlan</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-4xl">
	<div class="mb-8">
		<nav class="text-sm breadcrumbs mb-4">
			<a href="/" class="text-blue-600 hover:text-blue-800">← Back to BruinPlan</a>
		</nav>
		
		<h1 class="text-3xl font-bold mb-4">Unit Limits Management</h1>
		<p class="text-gray-600">Configure your unit limits for different quarters and seasons.</p>
	</div>
	
	<!-- Default Limits -->
	<div class="bg-white rounded-lg shadow-sm border p-6 mb-6">
		<h2 class="text-xl font-semibold mb-4">Default Unit Limits</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div>
				<label for="summer-limit" class="block text-sm font-medium text-gray-700 mb-2">
					Summer Quarters
				</label>
				<input
					id="summer-limit"
					type="number"
					min="0"
					max="30"
					bind:value={quarterLimits.defaultSummer}
					on:input={handleDefaultChange}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
				<p class="text-xs text-gray-500 mt-1">Default: 0 units (typically no courses)</p>
			</div>
			<div>
				<label for="non-summer-limit" class="block text-sm font-medium text-gray-700 mb-2">
					Non-Summer Quarters
				</label>
				<input
					id="non-summer-limit"
					type="number"
					min="0"
					max="30"
					bind:value={quarterLimits.defaultNonSummer}
					on:input={handleDefaultChange}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
				<p class="text-xs text-gray-500 mt-1">Default: 18 units (Fall, Winter, Spring)</p>
			</div>
		</div>
	</div>
	
	<!-- Quarter-Specific Limits -->
	<div class="bg-white rounded-lg shadow-sm border p-6 mb-6">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-xl font-semibold">Quarter-Specific Limits</h2>
			<button
				type="button"
				class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
				on:click={addQuarterLimit}
			>
				Add Quarter Override
			</button>
		</div>
		
		{#if Object.keys(quarterLimits.quarterly).length === 0}
			<p class="text-gray-500 text-center py-8">
				No quarter-specific limits set. Default limits will be used for all quarters.
			</p>
		{:else}
			<div class="space-y-3">
				{#each Object.entries(quarterLimits.quarterly) as [quarterCode, limit]}
					<div class="flex items-center gap-4 p-3 bg-gray-50 rounded-md">
						<div class="flex-1">
							<span class="font-medium">{formatQuarterCode(parseInt(quarterCode))}</span>
							<span class="text-sm text-gray-600 ml-2">(Code: {quarterCode})</span>
						</div>
						<div class="flex items-center gap-2">
							<input
								type="number"
								min="0"
								max="30"
								bind:value={limit}
								on:input={handleQuarterlyChange}
								class="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
							<span class="text-sm text-gray-600">units</span>
							<button
								type="button"
								class="text-red-600 hover:text-red-700 transition-colors"
								on:click={() => removeQuarterLimit(parseInt(quarterCode))}
								title="Remove this override"
								aria-label="Remove {formatQuarterCode(parseInt(quarterCode))} override"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
								</svg>
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
	
	<!-- Action Buttons -->
	<div class="flex items-center justify-between">
		<button
			type="button"
			class="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
			on:click={resetToDefaults}
		>
			Reset to Defaults
		</button>
		
		<div class="flex items-center gap-3">
			{#if hasUnsavedChanges}
				<span class="text-sm text-orange-600">● Unsaved changes</span>
			{/if}
			<button
				type="button"
				class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
				on:click={saveChanges}
				disabled={!hasUnsavedChanges}
			>
				Save Changes
			</button>
		</div>
	</div>
</div>
