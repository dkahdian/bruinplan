// Graph-specific type definitions
// These interfaces define the structure of graph nodes and edges for Cytoscape.js

import type { Course } from '../../types.js';

export interface GraphNode {
  data: {
    id: string;
    label: string;
    type: 'course' | 'group' | 'section-header';
    // Type of node: course, group, or section header (for major graphs)
    
    // Course-specific properties
    course?: Course;
    completed?: boolean; // Track completion status for courses
    
    // Group-specific properties
    groupColor?: 'enforced' | 'warning' | 'recommended';
    options?: any[]; // For groups, include the options for tooltip display
    
    // Section-specific properties (for major graphs)
    section?: string; // Which major section this belongs to
    sectionId?: string; // Section identifier
    
    // Parent reference for compound nodes
    parent?: string;
  };
}

export interface GraphEdge {
  data: {
    id: string;
    source: string;
    target: string;
    type: 'enforced' | 'warning' | 'recommended';
    fromCompleted?: boolean; // Whether this edge is from a completed course
  };
}

// Options for building prerequisite graphs
export interface GraphBuildOptions {
  showWarnings?: boolean;
  showRecommended?: boolean;
  userCompletedCourses?: Set<string>;
  showCompletedCourses?: boolean;
}

// Result of building a graph
export interface GraphBuildResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// Graph interaction event handlers
export interface GraphEventHandlers {
  onCourseSelect?: (course: Course) => void;
  onBackgroundClick?: () => void;
  onNodeHover?: (nodeId: string) => void;
}

// Configuration for graph rendering
export interface GraphRenderConfig {
  container: HTMLElement;
  nodes: GraphNode[];
  edges: GraphEdge[];
  styles?: any[]; // Cytoscape styles
  layoutOptions?: any;
  tooltipConfig?: any;
  eventHandlers?: GraphEventHandlers;
}
