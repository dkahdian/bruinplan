// Service to handle Tailwind-styled tooltips for Cytoscape graphs
// This service creates and manages HTML tooltips that appear on hover/click events

import type { Course, RequisiteGroup } from '../../types.js';
import type { GraphNode } from '../graph/types.js';

// Configuration for tooltip behavior
export interface TooltipConfig {
  showOnHover?: boolean;
  showOnClick?: boolean;
  hideDelay?: number; // Delay before hiding tooltip (ms)
  showDelay?: number; // Delay before showing tooltip (ms)
  maxWidth?: string; // Max width in Tailwind classes
  position?: 'top' | 'bottom' | 'left' | 'right';
}

// Default tooltip configuration
const defaultConfig: TooltipConfig = {
  showOnHover: true,
  showOnClick: false,
  hideDelay: 300,
  showDelay: 1000, // 1 second delay before showing
  maxWidth: 'max-w-sm',
  position: 'top'
};

// Tooltip manager class to handle tooltip lifecycle
export class TooltipManager {
  private tooltip: HTMLElement | null = null;
  private hideTimeout: number | null = null;
  private showTimeout: number | null = null;
  private config: TooltipConfig;
  private container: HTMLElement;
  private isDisabled: boolean = false; // New property to disable tooltips

  constructor(container: HTMLElement, config: Partial<TooltipConfig> = {}) {
    this.container = container;
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Disable tooltips temporarily
   */
  disable(): void {
    this.isDisabled = true;
    this.hideTooltip(); // Hide any currently visible tooltip
  }

  /**
   * Re-enable tooltips
   */
  enable(): void {
    this.isDisabled = false;
  }

  /**
   * Shows a tooltip for a course node
   */
  showCourseTooltip(course: Course, position: { x: number; y: number }): void {
    this.hideTooltip();
    this.cancelShowDelay();
    this.tooltip = this.createCourseTooltip(course, position);
    this.appendTooltip();
  }

  /**
   * Shows a tooltip for a course node with delay
   */
  showCourseTooltipDelayed(course: Course, position: { x: number; y: number }): void {
    if (this.isDisabled) return; // Don't show tooltips when disabled
    
    this.cancelShowDelay();
    
    if (this.config.showDelay && this.config.showDelay > 0) {
      this.showTimeout = window.setTimeout(() => {
        if (!this.isDisabled) { // Check again after delay
          this.showCourseTooltip(course, position);
        }
      }, this.config.showDelay);
    } else {
      this.showCourseTooltip(course, position);
    }
  }

  /**
   * Shows a tooltip for a group node
   */
  showGroupTooltip(groupData: { label: string; groupColor: string; options?: any[] }, position: { x: number; y: number }): void {
    this.hideTooltip();
    this.cancelShowDelay();
    this.tooltip = this.createGroupTooltip(groupData, position);
    this.appendTooltip();
  }

  /**
   * Shows a tooltip for a group node with delay
   */
  showGroupTooltipDelayed(groupData: { label: string; groupColor: string; options?: any[] }, position: { x: number; y: number }): void {
    if (this.isDisabled) return; // Don't show tooltips when disabled
    
    this.cancelShowDelay();
    
    if (this.config.showDelay && this.config.showDelay > 0) {
      this.showTimeout = window.setTimeout(() => {
        if (!this.isDisabled) { // Check again after delay
          this.showGroupTooltip(groupData, position);
        }
      }, this.config.showDelay);
    } else {
      this.showGroupTooltip(groupData, position);
    }
  }

  /**
   * Hides the current tooltip
   */
  hideTooltip(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }

    if (this.tooltip) {
      this.tooltip.remove();
      this.tooltip = null;
    }
  }

  /**
   * Hides the tooltip after a delay
   */
  hideTooltipDelayed(): void {
    if (this.config.hideDelay && this.config.hideDelay > 0) {
      this.hideTimeout = window.setTimeout(() => {
        this.hideTooltip();
      }, this.config.hideDelay);
    } else {
      this.hideTooltip();
    }
  }

  /**
   * Cancels a delayed hide operation (useful for hover events)
   */
  cancelHide(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  /**
   * Cancels a delayed show operation (useful for hover events)
   */
  cancelShowDelay(): void {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }
  }

  /**
   * Creates a tooltip for a course node
   */
  private createCourseTooltip(course: Course, position: { x: number; y: number }): HTMLElement {
    const tooltip = document.createElement('div');
    
    // Base tooltip styles with Tailwind classes
    const baseClasses = `
      absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 ${this.config.maxWidth}
      transform transition-opacity duration-200 opacity-0
    `;
    
    // Position-specific classes
    const positionClasses = this.getPositionClasses();
    
    tooltip.className = baseClasses + ' ' + positionClasses;
    
    // Set position
    this.setTooltipPosition(tooltip, position);
    
    // Build tooltip content
    tooltip.innerHTML = this.buildCourseContent(course);
    
    // Add hover events to keep tooltip visible
    this.addTooltipHoverEvents(tooltip);
    
    // Trigger fade-in animation
    requestAnimationFrame(() => {
      tooltip.classList.remove('opacity-0');
      tooltip.classList.add('opacity-100');
    });
    
    return tooltip;
  }

  /**
   * Creates a tooltip for a group node
   */
  private createGroupTooltip(groupData: { label: string; groupColor: string; options?: any[] }, position: { x: number; y: number }): HTMLElement {
    const tooltip = document.createElement('div');
    
    const baseClasses = `
      absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs
      transform transition-opacity duration-200 opacity-0
    `;
    
    const positionClasses = this.getPositionClasses();
    tooltip.className = baseClasses + ' ' + positionClasses;
    
    this.setTooltipPosition(tooltip, position);
    
    tooltip.innerHTML = this.buildGroupContent(groupData);
    
    this.addTooltipHoverEvents(tooltip);
    
    requestAnimationFrame(() => {
      tooltip.classList.remove('opacity-0');
      tooltip.classList.add('opacity-100');
    });
    
    return tooltip;
  }

  /**
   * Builds the HTML content for a course tooltip
   */
  private buildCourseContent(course: Course): string {
    const prerequisitesHtml = this.buildPrerequisitesSection(course.requisites);
    const equivalentsHtml = course.equivalentCourses.length > 0 
      ? `<div class="mt-3 pt-3 border-t border-gray-100">
           <h4 class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Equivalent Courses</h4>
           <p class="text-sm text-gray-700">${course.equivalentCourses.join(', ')}</p>
         </div>`
      : '';

    return `
      <div class="space-y-2">
        <div>
          <h3 class="font-bold text-lg text-gray-900 leading-tight">${course.id}</h3>
          <p class="text-gray-700 font-medium">${course.title}</p>
        </div>
        
        <div class="flex items-center space-x-2">
          <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            ${course.units} ${(typeof course.units === 'number' && course.units === 1) ? 'unit' : 'units'}
          </span>
        </div>
        
        ${prerequisitesHtml}
        ${equivalentsHtml}
      </div>
    `;
  }

  /**
   * Builds the HTML content for a group tooltip
   */
  private buildGroupContent(groupData: { label: string; groupColor: string; options?: any[] }): string {
    const colorClass = groupData.groupColor === 'enforced' 
      ? 'bg-red-100 text-red-800 border-red-200' 
      : 'bg-yellow-100 text-yellow-800 border-yellow-200';
    
    const typeText = groupData.groupColor === 'enforced' ? 'Enforced' : 'Warning';
    
    // Build options list if available
    const optionsHtml = groupData.options && groupData.options.length > 0 
      ? `<div class="mt-3 pt-3 border-t border-gray-100">
           <h4 class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Options</h4>
           <ul class="space-y-1">
             ${groupData.options.map(option => {
               const levelClass = option.level === 'Enforced' ? 'text-red-600' : 
                                 option.level === 'Warning' ? 'text-yellow-600' : 'text-blue-600';
               const levelText = option.type === 'Recommended' ? 'Recommended' : option.level;
               const gradeInfo = this.formatMinGrade(option.minGrade);
               return `<li class="text-sm"><span class="${levelClass} font-medium">${levelText}:</span> ${option.course}${gradeInfo}</li>`;
             }).join('')}
           </ul>
         </div>`
      : '<p class="text-xs text-gray-600 mt-2">Choose from the connected options</p>';
    
    return `
      <div class="text-center space-y-2">
        <div class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${colorClass}">
          ${typeText}
        </div>
        <p class="text-sm font-medium text-gray-900">${groupData.label}</p>
        ${optionsHtml}
      </div>
    `;
  }

  /**
   * Formats minimum grade for display if it's not a standard D- grade
   * @param minGrade - The minimum grade requirement
   * @returns Formatted grade string or empty string if standard
   */
  private formatMinGrade(minGrade?: string): string {
    if (!minGrade || minGrade === 'D-') return '';
    return ` (min: ${minGrade})`;
  }

  /**
   * Builds the prerequisites section for course tooltips
   */
  private buildPrerequisitesSection(requisites: any[]): string {
    if (requisites.length === 0) return '';

    const prereqItems = requisites.map(req => {
      if (req.type === 'Group') {
        // For groups, show the options as a comma-separated list with grades
        const optionsList = req.options && req.options.length > 0
          ? req.options.map((option: any) => `${option.course}${this.formatMinGrade(option.minGrade)}`).join(', ')
          : 'group options';
        return `<li class="text-sm text-gray-600">Choose ${req.needs} from: ${optionsList}</li>`;
      } else {
        const levelClass = req.level === 'Enforced' ? 'text-red-600' : 
                          req.level === 'Warning' ? 'text-yellow-600' : 'text-blue-600';
        const levelText = req.type === 'Recommended' ? 'Recommended' : req.level;
        const gradeInfo = this.formatMinGrade(req.minGrade);
        return `<li class="text-sm"><span class="${levelClass} font-medium">${levelText}:</span> ${req.course}${gradeInfo}</li>`;
      }
    }).join('');

    return `
      <div class="mt-3 pt-3 border-t border-gray-100">
        <h4 class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Prerequisites</h4>
        <ul class="space-y-1">
          ${prereqItems}
        </ul>
      </div>
    `;
  }

  /**
   * Gets Tailwind classes for tooltip positioning
   */
  private getPositionClasses(): string {
    switch (this.config.position) {
      case 'top':
        return '-translate-x-1/2 -translate-y-full mb-2 before:absolute before:top-full before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-white';
      case 'bottom':
        return '-translate-x-1/2 translate-y-2 mt-2 before:absolute before:bottom-full before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-b-white';
      case 'left':
        return '-translate-x-full -translate-y-1/2 mr-2 before:absolute before:top-1/2 before:left-full before:-translate-y-1/2 before:border-4 before:border-transparent before:border-l-white';
      case 'right':
        return 'translate-x-2 -translate-y-1/2 ml-2 before:absolute before:top-1/2 before:right-full before:-translate-y-1/2 before:border-4 before:border-transparent before:border-r-white';
      default:
        return '-translate-x-1/2 -translate-y-full mb-2';
    }
  }

  /**
   * Sets the tooltip position relative to the page
   */
  private setTooltipPosition(tooltip: HTMLElement, position: { x: number; y: number }): void {
    const containerRect = this.container.getBoundingClientRect();
    
    // Convert cytoscape position to absolute page coordinates
    // Cytoscape position is relative to the graph container, so we need to add the container's offset
    // Also account for page scroll position
    const absoluteX = containerRect.left + position.x + window.scrollX;
    const absoluteY = containerRect.top + position.y + window.scrollY;
    
    tooltip.style.left = `${absoluteX}px`;
    tooltip.style.top = `${absoluteY}px`;
  }

  /**
   * Adds hover events to keep tooltip visible when hovering over it
   */
  private addTooltipHoverEvents(tooltip: HTMLElement): void {
    tooltip.addEventListener('mouseenter', () => {
      this.cancelHide();
    });

    tooltip.addEventListener('mouseleave', () => {
      this.hideTooltipDelayed();
    });
  }

  /**
   * Appends the tooltip to the document body for proper positioning
   */
  private appendTooltip(): void {
    if (this.tooltip) {
      // Always append to body for consistent positioning with absolute coordinates
      document.body.appendChild(this.tooltip);
    }
  }

  /**
   * Cleanup method to remove all tooltips and clear timeouts
   */
  destroy(): void {
    this.cancelShowDelay();
    this.hideTooltip();
  }
}

/**
 * Adds tooltip functionality to a Cytoscape instance
 * @param cy - The Cytoscape instance
 * @param container - The container element for the graph
 * @param config - Optional tooltip configuration
 * @returns TooltipManager instance for manual control
 */
export function addTooltipsToCytoscape(
  cy: cytoscape.Core, 
  container: HTMLElement, 
  config: Partial<TooltipConfig> = {}
): TooltipManager {
  const tooltipManager = new TooltipManager(container, config);

  // Course node events
  if (config.showOnHover !== false) {
    cy.on('mouseover', 'node[type="course"]', (event) => {
      const node = event.target;
      const course = node.data('course');
      const position = node.renderedPosition();
      
      if (course) {
        tooltipManager.showCourseTooltipDelayed(course, position);
      }
    });

    cy.on('mouseout', 'node[type="course"]', () => {
      tooltipManager.cancelShowDelay();
      tooltipManager.hideTooltipDelayed();
    });
  }

  // Group node events
  if (config.showOnHover !== false) {
    cy.on('mouseover', 'node[type="group"]', (event) => {
      const node = event.target;
      const groupData = {
        label: node.data('label'),
        groupColor: node.data('groupColor'),
        options: node.data('options') // Pass group options if available
      };
      const position = node.renderedPosition();
      
      tooltipManager.showGroupTooltipDelayed(groupData, position);
    });

    cy.on('mouseout', 'node[type="group"]', () => {
      tooltipManager.cancelShowDelay();
      tooltipManager.hideTooltipDelayed();
    });
  }

  // Click events (if enabled)
  if (config.showOnClick) {
    cy.on('tap', 'node', (event) => {
      const node = event.target;
      const position = node.renderedPosition();
      
      if (node.data('type') === 'course') {
        const course = node.data('course');
        if (course) {
          tooltipManager.showCourseTooltip(course, position);
        }
      } else if (node.data('type') === 'group') {
        const groupData = {
          label: node.data('label'),
          groupColor: node.data('groupColor'),
          options: node.data('options')
        };
        tooltipManager.showGroupTooltip(groupData, position);
      }
    });

    // Hide on background click
    cy.on('tap', (event) => {
      if (event.target === cy) {
        tooltipManager.hideTooltip();
      }
    });
  }

  return tooltipManager;
}
