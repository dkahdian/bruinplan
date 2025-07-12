<script lang="ts">
	import { onMount } from 'svelte';
	import { 
		quarterLimitsStore, 
		schedulingService, 
		formatQuarterCode, 
		getCurrentQuarterCode,
		initializeSchedulingService
	} from '../../lib/services/shared/schedulingService.js';
	
	let quarterLimits = $quarterLimitsStore;
	let showAddQuarterDropdown = false;
	let selectedQuarterCode = '';
	
	// Subscribe to store changes and auto-sync
	quarterLimitsStore.subscribe(value => {
		quarterLimits = value;
	});
	
	onMount(() => {
		// Initialize scheduling service to load localStorage data
		initializeSchedulingService();
	});
	
	// Generate list of available quarters for dropdown
	$: availableQuarters = generateAvailableQuarters();
	
	function generateAvailableQuarters() {
		const quarters = [];
		const currentQuarter = getCurrentQuarterCode();
		let quarterCode = currentQuarter;
		
		// Generate next 20 quarters (5 years)
		for (let i = 0; i < 20; i++) {
			// Skip if already has a specific limit set
			if (!quarterLimits.quarterly[quarterCode]) {
				quarters.push({
					code: quarterCode,
					name: formatQuarterCode(quarterCode)
				});
			}
			quarterCode = getNextQuarterCode(quarterCode);
		}
		
		return quarters;
	}
	
	function getNextQuarterCode(quarterCode: number): number {
		const year = Math.floor(quarterCode / 10);
		const season = quarterCode % 10;

		switch (season) {
			case 1: return year * 10 + 2; // Winter → Spring
			case 2: return year * 10 + 3; // Spring → Summer
			case 3: return year * 10 + 4; // Summer → Fall
			case 4: return (year + 1) * 10 + 1; // Fall → Winter (next year)
			default: return quarterCode + 1;
		}
	}
	
	function updateDefaultSummer(value: number) {
		schedulingService.setDefaultLimit('summer', value);
		// Force a reactive update
		quarterLimits = { ...quarterLimits };
	}
	
	function updateDefaultNonSummer(value: number) {
		schedulingService.setDefaultLimit('nonSummer', value);
		// Force a reactive update
		quarterLimits = { ...quarterLimits };
	}
	
	function updateQuarterLimit(quarterCode: number, value: number) {
		schedulingService.setQuarterLimit(quarterCode, value);
		// Force a reactive update
		quarterLimits = { ...quarterLimits };
	}
	
	function addQuarterLimit() {
		if (selectedQuarterCode) {
			const code = parseInt(selectedQuarterCode);
			const defaultLimit = code % 10 === 3 ? quarterLimits.defaultSummer : quarterLimits.defaultNonSummer;
			schedulingService.setQuarterLimit(code, defaultLimit);
			selectedQuarterCode = '';
			showAddQuarterDropdown = false;
		}
	}
	
	function removeQuarterLimit(quarterCode: number) {
		// Remove the quarter-specific limit by updating the store
		quarterLimitsStore.update(limits => {
			const newLimits = { ...limits };
			delete newLimits.quarterly[quarterCode];
			
			// Save the updated limits to localStorage
			if (typeof window !== 'undefined') {
				try {
					localStorage.setItem('bruinplan_quarter_limits', JSON.stringify(newLimits));
				} catch (error) {
					console.error('Error saving quarter limits:', error);
				}
			}
			
			return newLimits;
		});
	}
	
	function resetToDefaults() {
		if (confirm('Reset all unit limits to default values? This cannot be undone.')) {
			// Reset all limits
			schedulingService.setDefaultLimit('summer', 0);
			schedulingService.setDefaultLimit('nonSummer', 18);
			
			// Clear all quarterly overrides
			Object.keys(quarterLimits.quarterly).forEach(quarterCode => {
				removeQuarterLimit(parseInt(quarterCode));
			});
		}
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
					value={quarterLimits.defaultSummer}
					on:input={(e) => updateDefaultSummer(parseInt((e.target as HTMLInputElement)?.value) || 0)}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
				<p class="text-xs text-gray-500 mt-1">Default: 0 units (enjoy your summer break!)</p>
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
					value={quarterLimits.defaultNonSummer}
					on:input={(e) => updateDefaultNonSummer(parseInt((e.target as HTMLInputElement)?.value) || 18)}
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
				on:click={() => showAddQuarterDropdown = !showAddQuarterDropdown}
			>
				{showAddQuarterDropdown ? 'Cancel' : 'Add Quarter Override'}
			</button>
		</div>
		
		<!-- Add Quarter Dropdown -->
		{#if showAddQuarterDropdown}
			<div class="mb-4 p-4 bg-blue-50 rounded-lg">
				<h3 class="font-medium mb-2">Add Quarter Override</h3>
				<div class="flex items-center gap-3">
					<div class="flex-1">
						<select
							bind:value={selectedQuarterCode}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="">Select a quarter...</option>
							{#each availableQuarters as quarter}
								<option value={quarter.code}>{quarter.name}</option>
							{/each}
						</select>
					</div>
					<button
						type="button"
						class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
						disabled={!selectedQuarterCode}
						on:click={addQuarterLimit}
					>
						Add Override
					</button>
				</div>
			</div>
		{/if}
		
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
						</div>
						<div class="flex items-center gap-2">
							<input
								type="number"
								min="0"
								max="30"
								value={limit}
								on:input={(e) => updateQuarterLimit(parseInt(quarterCode), parseInt((e.target as HTMLInputElement)?.value) || 0)}
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
			<span class="text-sm text-gray-600">
				<svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
				</svg>
				Changes auto-saved
			</span>
		</div>
	</div>
</div>
