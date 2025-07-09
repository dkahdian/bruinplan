<script lang="ts">
  import cytoscape from 'cytoscape';
  import GraphLegend from './GraphLegend.svelte';
  import { createCytoscapeInstance, type GraphNode, type GraphEdge } from '../../services/prerequisiteGraph.js';
  import type { TooltipConfig, TooltipManager } from '../../services/shared/tooltipService.js';

  export let nodes: GraphNode[];
  export let edges: GraphEdge[];
  export let enableTooltips: boolean = true;
  export let graphWidthPercent: number;
  export let showWarnings: boolean;
  export let showRecommended: boolean;
  export let showCompletedCourses: boolean;
  export let userCompletedCourses: Set<string>;
  export let onCourseSelect: (course: any) => void;
  export let onBackgroundClick: () => void;

  let container: HTMLDivElement;
  let cy: cytoscape.Core;
  let tooltipManager: TooltipManager | undefined;

  // Export the Cytoscape instance for parent component access
  export function getCytoscapeInstance(): cytoscape.Core | undefined {
    return cy;
  }

  // Initialize graph when nodes/edges change
  $: if (container && nodes.length > 0) {
    initializeGraph();
  }

  function initializeGraph() {
    if (!container) return;

    // Configure tooltips if enabled
    const tooltipConfig: Partial<TooltipConfig> | undefined = enableTooltips ? {
      showOnHover: true,
      showOnClick: false,
      hideDelay: 300,
      maxWidth: 'max-w-sm',
      position: 'top'
    } : undefined;

    const result = createCytoscapeInstance(container, nodes, edges, undefined, undefined, tooltipConfig);
    cy = result.cy;
    tooltipManager = result.tooltipManager;
    
    // Add click event handler for course selection
    setupCourseClickHandler();
    
    // Only setup basic event handlers if tooltips are disabled
    if (!enableTooltips) {
      setupBasicEventHandlers();
    }
  }

  // Setup click handler for course selection
  function setupCourseClickHandler() {
    if (!cy) return;
    
    cy.on('tap', 'node[type="course"]', (event) => {
      const node = event.target;
      const course = node.data('course');
      
      if (course) {
        // Select the new course
        cy.nodes().removeClass('selected');
        node.addClass('selected');
        onCourseSelect(course);
      }
    });

    // Click on background to reset to main course
    cy.on('tap', (event) => {
      if (event.target === cy) {
        cy.nodes().removeClass('selected');
        onBackgroundClick();
      }
    });
  }

  // Setup basic event handlers for when tooltips are disabled
  function setupBasicEventHandlers() {
    if (!cy) return;
    
    // Add basic hover effects
    cy.on('mouseover', 'node[type="course"]', (event) => {
      const node = event.target;
      const course = node.data('course');
      if (course) {
        node.style('background-color', '#f0f8ff');
        console.log(`${course.title} - ${course.units} units`);
      }
    });

    // Reset background color when mouse leaves
    cy.on('mouseout', 'node[type="course"]', (event) => {
      const node = event.target;
      node.style('background-color', 'white');
    });
  }
</script>

<div class="border border-gray-300 rounded-l-lg shadow-md bg-gray-50 flex-shrink-0 relative"
     style="width: {graphWidthPercent}%">
  <div bind:this={container} class="w-full h-full"></div>
  
  <!-- Legend -->
  <GraphLegend 
    bind:showWarnings
    bind:showRecommended
    bind:showCompletedCourses
    {userCompletedCourses}
  />
</div>
