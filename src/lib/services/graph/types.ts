// Graph-specific type definitions
// These interfaces define the structure of graph nodes and edges for Cytoscape.js

import type { Course } from '../../types.js';

export interface GraphNode {
  data: {
    id: string;
    label: string;
    type: 'course' | 'group' | 'section-header' | 'section';
    // Type of node: course, group, section header (for major graphs), or section (compound)
    
    // Course-specific properties
    course?: Course;
    completed?: boolean; // Track completion status for courses
    
    // Group-specific properties
    groupColor?: 'enforced' | 'warning' | 'recommended';
    options?: any[]; // For groups, include the options for tooltip display
    isCompoundGroup?: boolean; // Flag to maintain rectangle shape when collapsed
    
    // Section-specific properties (for major graphs)
    section?: string; // Which major section this belongs to
    sectionId?: string; // Section identifier
    isOpen?: boolean; // Whether the section is open or closed (for section nodes)
    backgroundColor?: string; // For compound nodes
    borderColor?: string; // For compound nodes
    
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
  // Animation options
  enableAnimations?: boolean;
  animationDuration?: number;
  animationEasing?: string;
}

// Configuration for graph animations
export interface GraphAnimationConfig {
  enabled: boolean;
  duration: number; // Animation duration in milliseconds
  easing: string; // CSS easing function (e.g., 'ease-out', 'cubic-bezier(0.25, 0.46, 0.45, 0.94)')
  preserveCompletedPositions?: boolean; // Whether to try to keep completed courses in same positions
}

// Stored position data for animations
export interface NodePosition {
  x: number;
  y: number;
}

export interface StoredPositions {
  [nodeId: string]: NodePosition;
}

// Result of building a graph
export interface GraphBuildResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
