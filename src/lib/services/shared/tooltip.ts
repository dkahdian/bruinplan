// Service to handle Tailwind-styled tooltips for Cytoscape graphs
// This service creates and manages HTML tooltips that appear on hover/click events

import type { Course, CourseRequirement } from '../../types.js';
import { schedulingService, courseCompletionService } from '../schedulingServices.js';
import { formatQuarterCode, getCurrentQuarterCode } from './quarterUtils.js';
import { validationService } from './validation.js';
import { COMPONENT_STYLES, DEFAULTS } from '../../constants.js';

// Configuration for tooltip behavior
export interface TooltipConfig {
  showOnHover?: boolean;
  showOnClick?: boolean;
  hideDelay?: number; // Delay before hiding tooltip (ms)
  showDelay?: number; // Delay before showing tooltip (ms)
  maxWidth?: string; // Max width in Tailwind classes
  position?: 'top' | 'bottom' | 'left' | 'right';
  onCourseCompletionToggle?: (_courseId: string) => void; // Callback for completion toggle
}

// Type for prerequisite group options
interface GroupOption {
  course: string;
  minGrade?: string;
}

// Type for group tooltip data
interface GroupTooltipData {
  label: string;
  groupColor: string;
  options?: GroupOption[];
}

// Default tooltip configuration
const defaultConfig: TooltipConfig = {
  showOnHover: true,
  showOnClick: false,
  hideDelay: DEFAULTS.TOOLTIP_HIDE_DELAY,
  showDelay: DEFAULTS.TOOLTIP_SHOW_DELAY,
  maxWidth: DEFAULTS.TOOLTIP_MAX_WIDTH,
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
  private completionToggleHandler: (_courseId: string) => void;

  constructor(container: HTMLElement, config: Partial<TooltipConfig> = {}) {
    this.container = container;
    this.config = { ...defaultConfig, ...config };
    
    // Set up the completion toggle handler
    this.completionToggleHandler = config.onCourseCompletionToggle || this.defaultToggleHandler.bind(this);
  }

  /**
   * Default completion toggle handler that updates the store and refreshes tooltips
   */
  private defaultToggleHandler(courseId: string): void {
    const completionSource = courseCompletionService.getCompletedCourseSource(courseId);
    const isCompleted = completionSource !== null;
    
    if (isCompleted) {
      schedulingService.markCourseIncomplete(courseId);
    } else {
      schedulingService.markCourseCompleted(courseId);
    }
    
    // Don't hide tooltip immediately - let the parent component handle the update
    // The graph will rebuild reactively due to store changes
  }

  /**
   * Public method to handle course completion toggle from global function
   */
  handleCourseToggle(courseId: string): void {
    // For simplicity, just trigger the callback for graph updates
    // The toggle function already handles updating the tooltip UI directly via DOM manipulation
    if (this.config.onCourseCompletionToggle) {
      this.config.onCourseCompletionToggle(courseId);
    }
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
  showGroupTooltip(groupData: GroupTooltipData, position: { x: number; y: number }): void {
    this.hideTooltip();
    this.cancelShowDelay();
    this.tooltip = this.createGroupTooltip(groupData, position);
    this.appendTooltip();
  }

  /**
   * Shows a tooltip for a group node with delay
   */
  showGroupTooltipDelayed(groupData: GroupTooltipData, position: { x: number; y: number }): void {
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
      ${COMPONENT_STYLES.tooltip.container} ${this.config.maxWidth}
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
  private createGroupTooltip(groupData: GroupTooltipData, position: { x: number; y: number }): HTMLElement {
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

    // Check if course is completed (ensure we get the most current state)
    const completionSource = courseCompletionService.getCompletedCourseSource(course.id);
    const isCompleted = completionSource !== null;
    const completedViaEquivalent = completionSource && completionSource !== course.id;

    // Get quarter planning info
    const quarterCode = courseCompletionService.getQuarterCode(course.id);
    const currentQuarterLabel = quarterCode && quarterCode > 1 ? formatQuarterCode(quarterCode) : null;

    // Build completion status text
    let completionStatusHtml = '';
    if (isCompleted) {
      if (completedViaEquivalent) {
        completionStatusHtml = `<span class="text-xs text-green-600">✓ Completed via ${completionSource}</span>`;
      } else {
        completionStatusHtml = `<span class="text-xs text-green-600">✓ Completed</span>`;
      }
    }

    // Build validation warnings
    const validationWarningsHtml = this.buildValidationWarningsSection(course.id);

    return `
      <div class="space-y-2">
        <div>
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <h3 class="font-bold text-lg text-gray-900 leading-tight">${course.id}</h3>
              <p class="text-gray-700 font-medium">${course.title}</p>
            </div>
            <div class="ml-3 flex flex-col items-end gap-1">
              ${!isCompleted ? `
                <!-- Quarter selector for tooltip -->
                <button
                  onclick="window.openQuarterSelector('${course.id}')"
                  class="inline-flex items-center px-2 py-1 border border-purple-300 rounded text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors"
                  type="button"
                  aria-label="Add to plan"
                >
                  ${currentQuarterLabel || 'plan'}
                  <svg class="ml-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              ` : ''}
              <div class="flex items-center gap-1">
                <span class="text-xs text-gray-600">Taken?</span>
                <button
                  onclick="window.toggleCourseCompletion('${course.id}')"
                  class="relative inline-flex h-4 w-7 items-center rounded-full ${
                    isCompleted 
                      ? 'bg-green-500' 
                      : 'bg-gray-300'
                  } transition-colors"
                  type="button"
                  aria-label="Toggle course completion"
                >
                  <span class="inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    isCompleted ? 'translate-x-3.5' : 'translate-x-0.5'
                  }"></span>
                </button>
              </div>
            </div>
          </div>
          ${completionStatusHtml ? `<div class="mt-1">${completionStatusHtml}</div>` : ''}
        </div>
        
        <div class="flex items-center space-x-2">
          <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            ${course.units} ${(typeof course.units === 'number' && course.units === 1) ? 'unit' : 'units'}
          </span>
        </div>
        
        ${validationWarningsHtml}
        ${prerequisitesHtml}
        ${equivalentsHtml}
      </div>
    `;
  }

  /**
   * Builds the HTML content for a group tooltip
   */
  private buildGroupContent(groupData: GroupTooltipData): string {
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
               // Since prerequisite levels are no longer supported, just show the course name
               const gradeInfo = this.formatMinGrade(option.minGrade);
               return `<li class="text-sm"><span class="text-orange-600 font-medium">Required:</span> ${option.course}${gradeInfo}</li>`;
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
  private buildPrerequisitesSection(requisites: CourseRequirement[]): string {
    if (requisites.length === 0) return '';

    const prereqItems = requisites.map(req => {
      if (req.type === 'group') {
        // For groups, show the options as a comma-separated list
        const optionsList = req.options && req.options.length > 0
          ? req.options.map(option => {
              if (option.type === 'requisite') {
                return option.course;
              }
              return 'nested group';
            }).join(', ')
          : 'group options';
        return `<li class="text-sm text-gray-600">Choose ${req.needs} from: ${optionsList}</li>`;
      } else {
        // For individual requisites, just show the course name
        return `<li class="text-sm"><span class="text-orange-600 font-medium">Required:</span> ${req.course}</li>`;
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
   * Builds the validation warnings section for course tooltips
   */
  private buildValidationWarningsSection(courseId: string): string {
    const courseErrors = validationService.validateCourse(courseId);
    
    if (courseErrors.length === 0) return '';

    const errorItems = courseErrors.map(error => {
      return `<div class="text-xs text-gray-700 bg-orange-100 px-2 py-1 rounded">⚠️ ${error.message}</div>`;
    }).join('');

    return `
      <div class="mt-3 pt-3 border-t border-gray-100">
        <h4 class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Warnings</h4>
        <div class="space-y-1">
          ${errorItems}
        </div>
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

  // Set global reference for tooltip toggle handling
  if (typeof window !== 'undefined') {
    window.currentTooltipManager = tooltipManager;
  }

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

  // Group node events - DISABLED to prevent undefined tooltips
  // No tooltip events for group nodes since they show "undefined":"undefined"
  
  // Section node events - DISABLED to prevent undefined tooltips  
  // No tooltip events for section nodes since they show "undefined":"undefined"

  // Click events (if enabled) - Only for course nodes
  if (config.showOnClick) {
    cy.on('tap', 'node[type="course"]', (event) => {
      const node = event.target;
      const position = node.renderedPosition();
      const course = node.data('course');
      
      if (course) {
        tooltipManager.showCourseTooltip(course, position);
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

// Global function to handle course completion toggle from tooltips
declare global {
  interface Window {
    toggleCourseCompletion: (_courseId: string) => void;
    openQuarterSelector: (_courseId: string) => void;
    selectQuarterFromDropdown: (_courseId: string, _quarterCode: number) => void;
    currentTooltipManager?: TooltipManager;
  }
}

// Set up the global function
if (typeof window !== 'undefined') {
  window.toggleCourseCompletion = function(courseId: string) {
    // Update completion state
    const completionSource = courseCompletionService.getCompletedCourseSource(courseId);
    const isCompleted = completionSource !== null;
    
    if (isCompleted) {
      schedulingService.markCourseIncomplete(courseId);
    } else {
      schedulingService.markCourseCompleted(courseId);
    }
    
    // Immediately update the switch appearance in the current tooltip
    const switchElement = document.querySelector(`button[onclick="window.toggleCourseCompletion('${courseId}')"]`);
    if (switchElement) {
      const newCompletionState = !isCompleted; // The new state after toggle
      const toggleCircle = switchElement.querySelector('span');
      
      if (newCompletionState) {
        // Course is now completed
        switchElement.className = switchElement.className.replace('bg-gray-300', 'bg-green-500');
        if (toggleCircle) {
          toggleCircle.className = toggleCircle.className.replace('translate-x-0.5', 'translate-x-3.5');
        }
      } else {
        // Course is now incomplete
        switchElement.className = switchElement.className.replace('bg-green-500', 'bg-gray-300');
        if (toggleCircle) {
          toggleCircle.className = toggleCircle.className.replace('translate-x-3.5', 'translate-x-0.5');
        }
      }
    }
    
    // Update completion status text if it exists
    const completionStatusElement = switchElement?.parentElement?.parentElement?.nextElementSibling;
    if (completionStatusElement && completionStatusElement.innerHTML.includes('✓ Completed')) {
      if (!isCompleted) {
        // Was incomplete, now completed
        completionStatusElement.innerHTML = '<span class="text-xs text-green-600">✓ Completed</span>';
      } else {
        // Was completed, now incomplete
        completionStatusElement.innerHTML = '';
      }
    }
    
    // Call the tooltip manager if available (for graph updates)
    if (window.currentTooltipManager) {
      window.currentTooltipManager.handleCourseToggle(courseId);
    }
  };

  window.openQuarterSelector = function(courseId: string) {
    // Create or show quarter dropdown
    const existingDropdown = document.getElementById('tooltip-quarter-dropdown');
    if (existingDropdown) {
      existingDropdown.remove();
    }
    
    // Generate quarters starting from the current quarter
    const quarters = [];
    const currentQuarter = getCurrentQuarterCode();
    
    // Generate next 12 quarters (3 years) starting from current quarter
    for (let i = 0; i < 12; i++) {
      const quarterCode = currentQuarter + i;
      const year = Math.floor(quarterCode / 10);
      const quarter = quarterCode % 10;
      
      let quarterName = '';
      switch (quarter) {
        case 1: quarterName = 'Winter'; break;
        case 2: quarterName = 'Spring'; break;
        case 3: quarterName = 'Summer'; break;
        case 4: quarterName = 'Fall'; break;
        default: continue; // Skip invalid quarters
      }
      
      quarters.push({ code: quarterCode, label: `${quarterName} ${year}` });
    }
    
    // Get the button that was clicked
    const button = document.querySelector(`button[onclick="window.openQuarterSelector('${courseId}')"]`);
    if (!button) return;
    
    // Create dropdown HTML
    const dropdown = document.createElement('div');
    dropdown.id = 'tooltip-quarter-dropdown';
    dropdown.className = 'absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50';
    dropdown.innerHTML = `
      <div class="py-1 max-h-48 overflow-y-auto">
        <button class="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100" onclick="window.selectQuarterFromDropdown('${courseId}', 0)">
          Remove from plan
        </button>
        <div class="border-t border-gray-100"></div>
        ${quarters.map(q => `
          <button class="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100" onclick="window.selectQuarterFromDropdown('${courseId}', ${q.code})">
            ${q.label}
          </button>
        `).join('')}
      </div>
    `;
    
    // Position the dropdown relative to the button
    button.parentElement!.style.position = 'relative';
    button.parentElement!.appendChild(dropdown);
    
    // Close dropdown when clicking outside
    const closeDropdown = (e: Event) => {
      if (!dropdown.contains(e.target as Node)) {
        dropdown.remove();
        document.removeEventListener('click', closeDropdown);
      }
    };
    setTimeout(() => document.addEventListener('click', closeDropdown), 0);
  };

  window.selectQuarterFromDropdown = function(courseId: string, quarterCode: number) {
    // Close dropdown
    const dropdown = document.getElementById('tooltip-quarter-dropdown');
    if (dropdown) dropdown.remove();
    
    // Update schedule
    schedulingService.scheduleCourse(courseId, quarterCode);
    
    // Update button text
    const button = document.querySelector(`button[onclick="window.openQuarterSelector('${courseId}')"]`);
    if (button) {
      if (quarterCode === 0) {
        button.textContent = 'Plan';
      } else {
        // Use formatQuarterCode utility function for consistent formatting
        const quarterLabel = formatQuarterCode(quarterCode);
        button.textContent = quarterLabel || 'Add to plan';
      }
    }
    
    // Call the tooltip manager if available (for graph updates)
    if (window.currentTooltipManager) {
      window.currentTooltipManager.handleCourseToggle(courseId);
    }
  };
}
