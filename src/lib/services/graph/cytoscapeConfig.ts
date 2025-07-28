// Cytoscape.js configuration and styling
// Contains styles, layout options, and Cytoscape instance creation

import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
// @ts-ignore
import fcose from 'cytoscape-fcose';
import type { GraphNode, GraphEdge } from './types.js';
import { addTooltipsToCytoscape, type TooltipConfig } from '../shared/tooltip.js';

// Register the layout extensions
// @ts-ignore
cytoscape.use(dagre);
// @ts-ignore
cytoscape.use(fcose);

// Base course node styles - shared between graph types
const baseCourseStyles: cytoscape.StylesheetStyle[] = [
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
    selector: 'node[type="course"][inPlan]',
    style: {
      'background-color': '#f3e8ff',  // Light purple background
      'border-color': '#a855f7',      // Purple border
      'color': '#7c3aed'              // Purple text
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
      'background-color': '#bbf7d0',  // Slightly darker green background
      'border-color': '#16a34a'       // Darker green border
    }
  },
  {
    selector: 'node[type="course"][inPlan].selected',
    style: {
      'background-color': '#e9d5ff',  // Slightly darker purple background
      'border-color': '#9333ea'       // Darker purple border
    }
  },
  // Warning indicator for courses with validation issues
  {
    selector: 'node[type="course"][hasWarnings]',
    style: {
      'background-color': '#fef3c7',  // Yellow background for warnings
      'border-color': '#f59e0b',      // Yellow/amber border for warnings
      'border-width': 3,
      'border-style': 'solid'
    }
  }
];

// Base group node styles - shared between graph types  
const baseGroupStyles: cytoscape.StylesheetStyle[] = [
  // Default group nodes (light yellow background with orange border)
  {
    selector: 'node[type="group"]',
    style: {
      'background-color': '#fef3c7',  // Light yellow background
      'border-color': '#f97316',      // Orange border
      'border-width': 2
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
  }
];

// Base edge styles - shared between graph types
const baseEdgeStyles: cytoscape.StylesheetStyle[] = [
  // Default prerequisite edges (orange solid line with triangle arrow)
  {
    selector: 'edge',
    style: {
      'line-color': '#f97316',        // Orange for prerequisites
      'target-arrow-color': '#f97316',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      'arrow-scale': 1.2,
      'width': 2
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
      'line-color': '#22c55e',        // Light green for edges from completed courses
      'target-arrow-color': '#22c55e',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      'arrow-scale': 1.2,
      'opacity': 0.8,
      'width': 2
    }
  },
  {
    selector: 'edge[fromInPlan]',
    style: {
      'line-color': '#a855f7',        // Purple for edges from in-plan courses  
      'target-arrow-color': '#a855f7',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      'arrow-scale': 1.2,
      'opacity': 0.8,
      'width': 2
    }
  },
  // Error edges for prerequisite validation issues
  {
    selector: 'edge[validationError]',
    style: {
      'line-color': '#dc2626',        // Red for validation errors
      'target-arrow-color': '#dc2626',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      'arrow-scale': 1.2,
      'width': 3,                     // Thicker line for errors
      'line-style': 'solid'
    }
  }
];

// Default styles for regular prerequisite graphs
export const defaultGraphStyles: cytoscape.StylesheetStyle[] = [
  // Standard course node sizing (80x40px as per spec)
  {
    selector: 'node[type="course"]',
    style: {
      'width': 80,
      'height': 40
    }
  },
  
  // Standard group nodes (diamond shape, 60x60px as per spec)
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
      'text-max-width': '80px'
    }
  },
  
  ...baseCourseStyles,
  ...baseGroupStyles,
  ...baseEdgeStyles
];

/*
 * Layout Configuration Notes:
 * 
 * Dagre Layout (for course prerequisite graphs):
 * Ranker Options (determines how nodes are assigned to layers):
 * - 'network-simplex': Most optimal, slower. Best for general DAGs and prerequisite graphs.
 * - 'tight-tree': Balanced speed/quality. Good for tree-like structures.  
 * - 'longest-path': Fastest, best for hierarchical/compound graphs. Creates spread-out layouts.
 * 
 * Acyclicer Options (handles cycles in graphs):
 * - undefined: No cycle handling (only for true DAGs)
 * - 'greedy': Uses greedy heuristic to remove cycles (good for compound graphs)
 * 
 * fCoSE Layout (for major requirement graphs):
 * - Better compound node support with natural clustering
 * - Force-directed layout that respects hierarchical structure
 * - Configurable node separation and edge elasticity
 * - Built-in support for nested compound nodes (sections containing groups)
 */

// Default layout options for the graph
export const defaultLayoutOptions = {
  name: 'dagre',
  rankDir: 'TB', // Top to bottom layout
  spacingFactor: 1.5,
  nodeDimensionsIncludeLabels: true,
  // Use network-simplex for regular prerequisite graphs (optimal for general DAGs)
  ranker: 'tight-tree' // Best overall quality for course prerequisite graphs
};

// Styles for major requirement graphs with compound nodes


/**
 * Creates and configures a Cytoscape instance
 * @param container - HTML container element
 * @param nodes - Graph nodes
 * @param edges - Graph edges  
 * @param styles - Cytoscape styles (defaults to defaultGraphStyles)
 * @param layoutOptions - Layout configuration (defaults to defaultLayoutOptions)
 * @param tooltipConfig - Optional tooltip configuration
 * @returns Object containing the Cytoscape instance and optional TooltipManager
 */
export function createCytoscapeInstance(
  container: HTMLElement,
  nodes: GraphNode[],
  edges: GraphEdge[],
  styles: cytoscape.StylesheetStyle[] = defaultGraphStyles,
  layoutOptions = defaultLayoutOptions,
  tooltipConfig?: Partial<TooltipConfig>
): { cy: cytoscape.Core; tooltipManager?: import('../shared/tooltip.js').TooltipManager } {
  // Creating Cytoscape instance with ${nodes.length} nodes and ${edges.length} edges
  
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
  
  return { cy, tooltipManager };
}
