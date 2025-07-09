// Cytoscape.js configuration and styling
// Contains default styles, layout options, and Cytoscape instance creation

import cytoscape from 'cytoscape';
import type { GraphNode, GraphEdge, GraphRenderConfig } from './types.js';
import { addTooltipsToCytoscape, type TooltipConfig } from '../shared/tooltipService.js';

// Default styles for the graph visualization
export const defaultGraphStyles: cytoscape.StylesheetStyle[] = [
  {
    selector: 'node[type="course"]',
    style: {
      'shape': 'round-rectangle',
      'background-color': 'white',
      'border-color': 'black',
      'border-width': 2,
      'label': 'data(label)',
      'text-valign': 'center',
      'text-halign': 'center',
      'width': 80,
      'height': 40,
      'font-size': '12px'
    }
  },
  {
    selector: 'node[type="course"][completed]',
    style: {
      'background-color': '#dcfce7',  // Light green background
      'border-color': '#22c55e',      // Green border
      'color': '#15803d'              // Dark green text
    }
  },
  {
    selector: 'node[type="course"].selected',
    style: {
      'background-color': '#dbeafe',  // Light blue background
      'border-color': '#3b82f6',      // Blue border
      'color': '#1e40af'              // Blue text
    }
  },
  {
    selector: 'node[type="course"][completed].selected',
    style: {
      'background-color': '#bbf7d0',  // Slightly darker green background for selected completed courses
      'border-color': '#16a34a'       // Darker green border
    }
  },
  {
    selector: 'node[type="group"]',
    style: {
      'shape': 'diamond',
      'width': 60,
      'height': 60,
      'label': 'data(label)',
      'text-valign': 'center',
      'text-halign': 'center',
      'font-size': '10px',
      'text-wrap': 'wrap',
      'text-max-width': '50px'
    }
  },
  {
    selector: 'node[type="group"][groupColor="enforced"]',
    style: {
      'background-color': '#fecaca',  // Pink background
      'border-color': 'red',
      'border-width': 2
    }
  },
  {
    selector: 'node[type="group"][groupColor="warning"]',
    style: {
      'background-color': '#fef3c7',  // Light yellow background
      'border-color': 'orange',
      'border-width': 2
    }
  },
  {
    selector: 'node[type="group"][groupColor="recommended"]',
    style: {
      'background-color': '#fef3c7',  // Light yellow background
      'border-color': 'orange',
      'border-width': 2,
      'border-style': 'dashed'
    }
  },
  {
    selector: 'edge[type="enforced"]',
    style: {
      'line-color': 'red',
      'target-arrow-color': 'red',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      'arrow-scale': 1.2
    }
  },
  {
    selector: 'edge[type="warning"]',
    style: {
      'line-color': 'orange',
      'target-arrow-color': 'orange',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      'arrow-scale': 1.2
    }
  },
  {
    selector: 'edge[type="recommended"]',
    style: {
      'line-color': 'orange',
      'target-arrow-color': 'orange',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      'arrow-scale': 1.2,
      'line-style': 'dashed'
    }
  },
  {
    selector: 'edge[fromCompleted]',
    style: {
      'line-color': '#22c55e',        // Green for edges from completed courses
      'target-arrow-color': '#22c55e',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      'arrow-scale': 1.2,
      'opacity': 0.8
    }
  }
];

// Default layout options for the graph
export const defaultLayoutOptions = {
  name: 'dagre',
  rankDir: 'TB', // Top to bottom layout
  spacingFactor: 1.5,
  nodeDimensionsIncludeLabels: true
};

// Major graph specific styles (for compound nodes/sections)
export const majorGraphStyles: any[] = [
  ...defaultGraphStyles,
  {
    selector: 'node[type="section-header"]',
    style: {
      'shape': 'rectangle',
      'background-color': '#f9fafb',
      'border-color': '#d1d5db',
      'border-width': 2,
      'label': 'data(label)',
      'text-valign': 'top',
      'text-halign': 'center',
      'font-size': '14px',
      'font-weight': 'bold',
      'padding': '10px'
    }
  },
  {
    selector: ':parent',
    style: {
      'background-opacity': 0.1,
      'background-color': '#e5e7eb',
      'border-width': 2,
      'border-color': '#9ca3af',
      'border-style': 'dashed'
    }
  }
];

/**
 * Creates and configures a Cytoscape instance with the provided configuration
 * @param config - Graph rendering configuration
 * @returns Object containing the Cytoscape instance and optional TooltipManager
 */
export function createCytoscapeInstance(
  config: GraphRenderConfig
): { cy: cytoscape.Core; tooltipManager?: import('../shared/tooltipService.js').TooltipManager } {
  const {
    container,
    nodes,
    edges,
    styles = defaultGraphStyles,
    layoutOptions = defaultLayoutOptions,
    tooltipConfig,
    eventHandlers = {}
  } = config;

  console.log(`Creating Cytoscape instance with ${nodes.length} nodes and ${edges.length} edges`);
  
  const cy = cytoscape({
    container,
    elements: [...nodes, ...edges],
    style: styles,
    layout: layoutOptions
  });

  // Add tooltips if configuration is provided
  let tooltipManager;
  if (tooltipConfig !== undefined) {
    tooltipManager = addTooltipsToCytoscape(cy, container, tooltipConfig);
  }

  // Add event handlers
  if (eventHandlers.onCourseSelect) {
    setupCourseSelectHandler(cy, eventHandlers.onCourseSelect);
  }

  if (eventHandlers.onBackgroundClick) {
    setupBackgroundClickHandler(cy, eventHandlers.onBackgroundClick);
  }

  if (eventHandlers.onNodeHover) {
    setupNodeHoverHandler(cy, eventHandlers.onNodeHover);
  }
  
  return { cy, tooltipManager };
}

/**
 * Sets up course selection event handler
 */
function setupCourseSelectHandler(cy: cytoscape.Core, onCourseSelect: (course: any) => void) {
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
}

/**
 * Sets up background click event handler
 */
function setupBackgroundClickHandler(cy: cytoscape.Core, onBackgroundClick: () => void) {
  cy.on('tap', (event) => {
    if (event.target === cy) {
      cy.nodes().removeClass('selected');
      onBackgroundClick();
    }
  });
}

/**
 * Sets up node hover event handler
 */
function setupNodeHoverHandler(cy: cytoscape.Core, onNodeHover: (nodeId: string) => void) {
  cy.on('mouseover', 'node', (event) => {
    const node = event.target;
    onNodeHover(node.id());
  });
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use createCytoscapeInstance with GraphRenderConfig instead
 */
export function createCytoscapeInstanceLegacy(
  container: HTMLElement,
  nodes: GraphNode[],
  edges: GraphEdge[],
  styles: cytoscape.StylesheetStyle[] = defaultGraphStyles,
  layoutOptions = defaultLayoutOptions,
  tooltipConfig?: Partial<TooltipConfig>
): { cy: cytoscape.Core; tooltipManager?: import('../shared/tooltipService.js').TooltipManager } {
  return createCytoscapeInstance({
    container,
    nodes,
    edges,
    styles,
    layoutOptions,
    tooltipConfig
  });
}
