<script lang="ts">
  import cytoscape from 'cytoscape';
  import GraphLegend from './GraphLegend.svelte';
  import { createCytoscapeInstance, type GraphNode, type GraphEdge, defaultGraphStyles, defaultLayoutOptions } from '../../services/graph/index.js';
  import type { TooltipConfig, TooltipManager } from '../../services/shared/tooltipService.js';
  import type { GraphAnimationConfig, StoredPositions, NodePosition } from '../../services/graph/types.js';
  import { schedulingService, courseCompletionService } from '../../services/schedulingServices.js';

  export let nodes: GraphNode[];
  export let edges: GraphEdge[];
  export let enableTooltips: boolean = true;
  export let graphWidthPercent: number;
  export let showWarnings: boolean;
  export let showCompletedCourses: boolean;
  export let userCompletedCourses: Set<string>;
  export let onCourseSelect: (course: any) => void;
  export let onSectionToggle: ((sectionId: string) => void) | undefined = undefined;
  export let onBackgroundClick: () => void;
  export let customStyles: cytoscape.StylesheetStyle[] = defaultGraphStyles;
  export let layoutOptions: any = defaultLayoutOptions;
  export let animationConfig: GraphAnimationConfig = {
    enabled: true,
    duration: 800, // Slightly longer duration for smoother animations
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Custom cubic-bezier for smooth easing
    preserveCompletedPositions: true
  };

  let container: HTMLDivElement;
  let cy: cytoscape.Core;
  let tooltipManager: TooltipManager | undefined;
  let storedPositions: StoredPositions = {};
  let isFirstLoad = true;

  // Export the Cytoscape instance for parent component access
  export function getCytoscapeInstance(): cytoscape.Core | undefined {
    return cy;
  }

  // Export method to close any open tooltips
  export function closeTooltips(): void {
    if (tooltipManager) {
      tooltipManager.hideTooltip();
    }
  }

  // Export method to update node completion status without rebuilding
  export function updateNodeCompletionStatus(nodeId: string, isCompleted: boolean): void {
    if (!cy) return;
    
    const node = cy.getElementById(nodeId);
    if (node.length > 0) {
      if (isCompleted) {
        node.data('completed', true);
      } else {
        node.removeData('completed');
      }
    }
  }

  // Export method to update all nodes' completion status
  export function updateAllNodeCompletionStatus(completedCourses: Set<string>): void {
    if (!cy) return;
    
    cy.nodes('[type="course"]').forEach(node => {
      const courseId = node.id();
      if (completedCourses.has(courseId)) {
        node.data('completed', true);
      } else {
        node.removeData('completed');
      }
    });
  }

  /**
   * Update the graph incrementally by adding/removing nodes and edges
   * This avoids a full rebuild and maintains node positions
   */
  export function updateGraphIncrementally(newNodes: GraphNode[], newEdges: GraphEdge[]): void {
    if (!cy) return;

    // Get current nodes and edges
    const currentNodeIds = new Set(cy.nodes().map(node => node.id()));
    const currentEdgeIds = new Set(cy.edges().map(edge => edge.id()));
    
    const newNodeIds = new Set(newNodes.map(node => node.data.id));
    const newEdgeIds = new Set(newEdges.map(edge => edge.data.id));

    // Find nodes to add and remove
    const nodesToAdd = newNodes.filter(node => !currentNodeIds.has(node.data.id));
    const nodesToRemove = Array.from(currentNodeIds).filter(id => !newNodeIds.has(id));
    
    // Find edges to add and remove
    const edgesToAdd = newEdges.filter(edge => !currentEdgeIds.has(edge.data.id));
    const edgesToRemove = Array.from(currentEdgeIds).filter(id => !newEdgeIds.has(id));

    // Remove elements first
    if (nodesToRemove.length > 0) {
      cy.remove(cy.nodes().filter(node => nodesToRemove.includes(node.id())));
    }
    if (edgesToRemove.length > 0) {
      cy.remove(cy.edges().filter(edge => edgesToRemove.includes(edge.id())));
    }

    // Update existing nodes' data first (for completion status changes)
    newNodes.forEach(newNode => {
      const existingNode = cy.getElementById(newNode.data.id);
      if (existingNode.length > 0) {
        // Update node data to reflect current state
        Object.entries(newNode.data).forEach(([key, value]) => {
          if (key !== 'id') { // Don't update the id
            existingNode.data(key, value);
          }
        });
      }
    });

    // Add new elements
    if (nodesToAdd.length > 0) {
      const addedNodes = cy.add(nodesToAdd);
      // Position new nodes near related nodes to avoid sudden appearance
      addedNodes.forEach(node => {
        const connectedEdges = cy.edges().filter(`[source="${node.id()}"], [target="${node.id()}"]`);
        if (connectedEdges.length > 0) {
          // Position near connected nodes
          const connectedNode = connectedEdges[0].source().id() === node.id() 
            ? connectedEdges[0].target() 
            : connectedEdges[0].source();
          const pos = connectedNode.position();
          node.position({ x: pos.x + Math.random() * 100 - 50, y: pos.y + Math.random() * 100 - 50 });
        }
      });
    }
    if (edgesToAdd.length > 0) {
      cy.add(edgesToAdd);
    }

    // Run a quick layout for only the new nodes if any were added
    if (nodesToAdd.length > 0) {
      const layout = cy.layout({
        name: 'dagre',
        animate: true,
        animationDuration: 400,
        animationEasing: 'ease-out',
        fit: false,
        spacingFactor: 1.5,
        nodeDimensionsIncludeLabels: true,
        stop: () => {
          if (cy) {
            cy.animate({
              fit: {
                eles: cy.elements(),
                padding: 20
              }
            }, {
              duration: 400,
              easing: 'ease-out'
            });
          }
        }
      } as any);
      layout.run();
    } else {
      cy.animate({
        fit: {
          eles: cy.elements(),
          padding: 20
        }
      }, {
        duration: 300,
        easing: 'ease-out'
      });
    }
  }

  /**
   * Check if the graph change only involves showing/hiding elements
   * Returns true if this can be handled incrementally
   */
  function canUpdateIncrementally(newNodes: GraphNode[], newEdges: GraphEdge[]): boolean {
    if (!cy) return false;
    
    // For now, handle simple cases where we're just adding/removing warning or recommended edges
    const currentNodes = cy.nodes().map(node => node.id()).sort();
    const newNodesList = newNodes.map(node => node.data.id).sort();
    
    // If the core nodes haven't changed significantly, we can update incrementally
    const nodesSimilar = currentNodes.length > 0 && 
      Math.abs(currentNodes.length - newNodesList.length) <= 3; // Allow small changes
    
    return nodesSimilar;
  }

  /**
   * Store current node positions for animation purposes
   */
  function storeCurrentPositions(): void {
    if (!cy || !animationConfig.enabled) return;
    
    storedPositions = {};
    cy.nodes().forEach(node => {
      const position = node.position();
      storedPositions[node.id()] = { x: position.x, y: position.y };
    });
  }

  /**
   * Restore node positions from stored positions and animate to new layout
   */
  function animateToNewLayout(): void {
    if (!cy || !animationConfig.enabled || isFirstLoad) {
      isFirstLoad = false;
      return;
    }

    // First, store the new layout positions
    const newPositions: StoredPositions = {};
    cy.nodes().forEach(node => {
      const position = node.position();
      newPositions[node.id()] = { x: position.x, y: position.y };
    });

    // Restore old positions for nodes that existed before
    cy.nodes().forEach(node => {
      const nodeId = node.id();
      const oldPosition = storedPositions[nodeId];
      
      if (oldPosition) {
        // For completed courses, optionally preserve their positions more aggressively
        if (animationConfig.preserveCompletedPositions && node.data('completed')) {
          // Keep completed courses much closer to their original positions
          const newPos = newPositions[nodeId];
          const preservedX = oldPosition.x + (newPos.x - oldPosition.x) * 0.1;
          const preservedY = oldPosition.y + (newPos.y - oldPosition.y) * 0.1;
          node.position({ x: preservedX, y: preservedY });
        } else {
          // For regular nodes, start from a position closer to the target to reduce travel distance
          const newPos = newPositions[nodeId];
          const intermediateX = oldPosition.x + (newPos.x - oldPosition.x) * 0.3;
          const intermediateY = oldPosition.y + (newPos.y - oldPosition.y) * 0.3;
          node.position({ x: intermediateX, y: intermediateY });
        }
      }
    });

    // Animate to new positions with proper completion handling
    const animationPromises: Promise<void>[] = [];
    
    cy.nodes().forEach(node => {
      const nodeId = node.id();
      const targetPosition = newPositions[nodeId];
      
      if (targetPosition) {
        const animationPromise = new Promise<void>((resolve) => {
          node.animate(
            {
              position: targetPosition
            },
            {
              duration: animationConfig.duration,
              easing: 'ease-out',
              complete: () => {
                resolve();
              }
            }
          );
        });
        animationPromises.push(animationPromise);
      }
    });

    // Fit the graph after all animations complete
    Promise.all(animationPromises).then(() => {
      if (cy) {
        cy.animate({
          fit: {
            eles: cy.elements(),
            padding: 20
          }
        }, {
          duration: 400,
          easing: 'ease-out'
        });
      }
    });

    isFirstLoad = false;
  }

  // Initialize graph when nodes/edges change
  $: if (container && nodes.length > 0) {
    // Check if we can update incrementally
    if (cy && canUpdateIncrementally(nodes, edges)) {
      // Use incremental update
      updateGraphIncrementally(nodes, edges);
      
      // No automatic fitting for incremental updates - let the individual update logic handle it
    } else {
      // Store positions before rebuilding if animations are enabled
      if (cy && animationConfig.enabled && !isFirstLoad) {
        storeCurrentPositions();
      }
      initializeGraph();
    }
  }

  // Handle container resize - ensure Cytoscape redraws properly
  $: if (cy && graphWidthPercent) {
    // Use setTimeout to ensure DOM has updated before resize
    setTimeout(() => {
      if (cy) {
        cy.resize();
        cy.animate({
          fit: {
            eles: cy.elements(),
            padding: 20
          }
        }, {
          duration: 400,
          easing: 'ease-out'
        });
      }
    }, 100);
  }

  // Watch for completion changes and update node styling without rebuilding
  $: if (cy && userCompletedCourses) {
    updateAllNodeCompletionStatus(userCompletedCourses);
  }

  function initializeGraph() {
    if (!container) return;

    // Configure tooltips if enabled
    const tooltipConfig: Partial<TooltipConfig> | undefined = enableTooltips ? {
      showOnHover: true,
      showOnClick: false,
      hideDelay: 300,
      maxWidth: 'max-w-sm',
      position: 'top',
      onCourseCompletionToggle: (courseId: string) => {
        // Update the node data immediately for graph styling
        if (cy) {
          const node = cy.getElementById(courseId);
          if (node.length > 0) {
            const completionSource = courseCompletionService.getCompletedCourseSource(courseId);
            const isCompleted = completionSource !== null;
            
            if (isCompleted) {
              node.data('completed', true);
            } else {
              node.removeData('completed');
            }
          }
        }
        
        // Hide tooltip after a short delay to allow user to see the switch change
        setTimeout(() => {
          if (tooltipManager) {
            tooltipManager.hideTooltip();
          }
        }, 800);
      }
    } : undefined;

    // Create layout options with controlled fitting
    const animatedLayoutOptions = {
      ...layoutOptions,
      animate: false, // We'll handle animations manually
      fit: true, // Always fit
      ready: () => {
        if (animationConfig.enabled && !isFirstLoad) {
          // For subsequent loads, just animate to new positions
          setTimeout(() => {
            animateToNewLayout();
          }, 50);
        } else {
          // First load - mark as complete and fit
          isFirstLoad = false;
          if (cy) {
            cy.animate({
              fit: {
                eles: cy.elements(),
                padding: 20
              }
            }, {
              duration: 600,
              easing: 'ease-out'
            });
          }
        }
      }
    };

    const result = createCytoscapeInstance(container, nodes, edges, customStyles, animatedLayoutOptions, tooltipConfig);
    cy = result.cy;
    tooltipManager = result.tooltipManager;
    
    // Add click event handler for course selection
    setupCourseClickHandler();
    
    // Only setup basic event handlers if tooltips are disabled
    if (!enableTooltips) {
      setupBasicEventHandlers();
    }
  }

  // Setup click handler for course selection and section toggling
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
    
    // Handle section node clicks for toggling open/closed state
    if (onSectionToggle) {
      cy.on('tap', 'node[type="section"]', (event) => {
        const node = event.target;
        const sectionId = node.data('sectionId');
        
        if (sectionId) {
          onSectionToggle(`section-${sectionId}`);
        }
      });
      
      // Handle group node clicks for toggling open/closed state
      cy.on('tap', 'node[type="group"]', (event) => {
        const node = event.target;
        const groupId = node.data('id');
        
        if (groupId) {
          onSectionToggle(groupId);
        }
      });
    }

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

<div class="border border-gray-300 rounded-l-lg shadow-md bg-gray-50 flex-shrink-0 relative h-full"
     style="width: {graphWidthPercent}%">
  <div bind:this={container} class="w-full h-full"></div>
  
  <!-- Legend -->
  <GraphLegend 
    bind:showWarnings
    bind:showCompletedCourses
    {userCompletedCourses}
  />
</div>
