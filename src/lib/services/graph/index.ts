// Graph services exports for easy importing

export * from './types.js';
export * from './utils.js';
export * from './cytoscapeConfig.js';
export * from './graphBuilder.js';
export * from './graphInteractions.js';

// Re-export legacy functions for backward compatibility
export { buildPrerequisiteGraph, buildPrerequisiteGraphAsync } from './graphBuilder.js';
export { handlePrerequisiteClick } from './graphInteractions.js';
