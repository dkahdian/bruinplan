/**
 * Constants used throughout the BruinPlan application
 * This centralizes magic numbers, strings, and repeated values for better maintainability
 */

// ============================================================================
// LOCAL STORAGE KEYS
// ============================================================================

export const STORAGE_KEYS = {
  courseSchedules: 'bruinplan_course_schedules',
  lastVisit: 'bruinplan_last_visit',
  legendState: 'bruinplan_legend_state'
} as const;

// ============================================================================
// QUARTER CODE CONSTANTS
// ============================================================================

// ============================================================================
// UI STYLING CONSTANTS
// ============================================================================

export const COLORS = {
  // Background colors for course status
  COMPLETED_BG: 'bg-green-50',
  COMPLETED_BG_HOVER: 'bg-green-100',
  COMPLETED_BG_ACTIVE: 'bg-green-200',
  COMPLETED_BORDER: 'border-green-200',
  
  PLANNED_BG: 'bg-purple-50',
  PLANNED_BG_HOVER: 'bg-purple-100',
  PLANNED_BG_ACTIVE: 'bg-purple-200',
  PLANNED_BORDER: 'border-purple-300',
  
  WARNING_BG: 'bg-orange-50',
  WARNING_BG_HOVER: 'bg-orange-100',
  WARNING_BG_ACTIVE: 'bg-orange-200',
  WARNING_BORDER: 'border-orange-200',
  
  ERROR_BG: 'bg-red-100',
  ERROR_BG_HOVER: 'bg-red-200',
  ERROR_BORDER: 'border-red-200',
  
  NEUTRAL_BG: 'bg-gray-50',
  NEUTRAL_BG_HOVER: 'bg-gray-100',
  NEUTRAL_BORDER: 'border-gray-200',
  NEUTRAL_BORDER_LIGHT: 'border-gray-100',
  
  // Text colors
  COMPLETED_TEXT: 'text-green-600',
  COMPLETED_TEXT_DARK: 'text-green-800',
  
  PLANNED_TEXT: 'text-purple-600',
  PLANNED_TEXT_LIGHT: 'text-purple-100',
  
  WARNING_TEXT: 'text-orange-600',
  
  ERROR_TEXT: 'text-red-600',
  ERROR_TEXT_DARK: 'text-red-800',
  
  NEUTRAL_TEXT: 'text-gray-600',
  NEUTRAL_TEXT_LIGHT: 'text-gray-400',
  NEUTRAL_TEXT_DARK: 'text-gray-700',
  
  // Button and interactive element colors
  BUTTON_PRIMARY_BG: 'bg-purple-600',
  BUTTON_PRIMARY_BG_HOVER: 'bg-purple-700',
  BUTTON_PRIMARY_TEXT: 'text-white',
  
  BUTTON_SECONDARY_BG: 'bg-gray-300',
  BUTTON_SECONDARY_BG_HOVER: 'bg-gray-400',
  
  // Focus and selection colors
  FOCUS_RING: 'focus:ring-2 focus:ring-purple-500 focus:border-purple-500',
  FOCUS_RING_BLUE: 'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
} as const;

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const DEFAULTS = {
  QUARTER_RANGE: 12, // Default number of quarters to display
  PERFORMANCE_WARNING_THRESHOLD: 12, // Show warning if quarter range exceeds this
  TOOLTIP_MAX_WIDTH: 'max-w-sm',
  TOOLTIP_HIDE_DELAY: 300,
  TOOLTIP_SHOW_DELAY: 1000
} as const;

// ============================================================================
// COMPONENT STYLES
// ============================================================================

export const COMPONENT_STYLES = {
  tooltip: {
    container: 'absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4',
    divider: 'mt-3 pt-3 border-t border-gray-100'
  },
  button: {
    primary: 'inline-flex items-center px-2 py-1 border border-purple-300 rounded text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors'
  }
} as const;

// ============================================================================
// END OF FILE
// ============================================================================
