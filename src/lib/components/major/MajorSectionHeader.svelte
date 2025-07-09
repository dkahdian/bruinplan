<!--
	MajorSectionHeader Component
	Displays the title and description of a major section
-->
<script lang="ts">
	export let title: string;
	export let description: string;
	export let sectionId: string;
</script>

<div>
	<h2 class="text-2xl font-semibold mb-2" id="section-{sectionId}">
		{title}
	</h2>
	<p class="text-gray-700 leading-relaxed">
		{description}
	</p>
</div>

<style>
	/* Add any section-specific styling here */
</style>
