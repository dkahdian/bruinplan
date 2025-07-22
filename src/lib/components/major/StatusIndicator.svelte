<!--
	StatusIndicator Component
	Smart status display for course requirements with conditional formatting
-->
<script lang="ts">
	export let completedCount: number;
	export let plannedCount: number; // This should be total planned (completed + scheduled)
	export let requiredCount: number;
	export let size: 'small' | 'medium' = 'medium';
	
	// Calculate actual scheduled count (planned but not completed)
	$: scheduledCount = Math.max(0, plannedCount - completedCount);
	
	// Apply group limits - don't show more than required
	$: displayCompleted = Math.min(completedCount, requiredCount);
	$: displayScheduled = Math.min(scheduledCount, Math.max(0, requiredCount - displayCompleted));
	
	// Calculate what to display
	$: hasCompleted = displayCompleted > 0;
	$: hasScheduled = displayScheduled > 0;
	$: hasNeither = !hasCompleted && !hasScheduled;
	
	// Size classes
	$: textSize = size === 'small' ? 'text-xs' : 'text-sm';
	$: barHeight = size === 'small' ? 'h-1.5' : 'h-2';
	$: barWidth = size === 'small' ? 'w-12' : 'w-16';
</script>

<div class="{textSize} text-gray-600 text-right">
	<div class="font-medium">
		{#if hasNeither}
			<!-- No progress at all - show black 0/[x] -->
			<span class="text-gray-800 font-semibold">0/{requiredCount}</span>
		{:else if hasCompleted && !hasScheduled}
			<!-- Only completed courses - show green [n]/[z] -->
			<span class="text-green-600 font-semibold">{displayCompleted}/{requiredCount}</span>
		{:else if !hasCompleted && hasScheduled}
			<!-- Only scheduled courses - show purple [n]/[z] -->
			<span class="text-purple-600 font-semibold">{displayScheduled}/{requiredCount}</span>
		{:else}
			<!-- Both completed and scheduled - show the bar format -->
			<span class="text-green-600 font-semibold">{displayCompleted}/{requiredCount}</span> <span class="text-purple-600">|</span> <span class="text-purple-600 font-semibold">{displayScheduled}/{Math.max(0, requiredCount - displayCompleted)}</span>
		{/if}
	</div>
	<div class="{barWidth} {barHeight} bg-gray-200 rounded-full overflow-hidden relative">
		<!-- Completed courses (green) - always present for smooth transitions -->
		<div 
			class="absolute left-0 top-0 h-full bg-green-500 transition-all duration-1000 ease-in-out"
			style="width: {(hasCompleted && requiredCount > 0) ? (displayCompleted / requiredCount) * 100 : 0}%"
		></div>
		<!-- Scheduled courses (purple) - always present for smooth transitions -->
		<div 
			class="absolute top-0 h-full bg-purple-400 transition-all duration-1000 ease-in-out"
			style="left: {(hasCompleted && requiredCount > 0) ? (displayCompleted / requiredCount) * 100 : 0}%; width: {(hasScheduled && requiredCount > 0) ? (displayScheduled / requiredCount) * 100 : 0}%"
		></div>
	</div>
</div>
