/**
 * Quarter utility functions for UCLA quarter system
 */
import type { CourseSchedule } from '../../types.js';

// UCLA Quarter Calendar Implementation
const QUARTER_TRANSITIONS = {
  // January 1st: Fall → Winter
  WINTER_START: { month: 0, day: 1 }, // Jan 1
  
  // March 25th: Winter → Spring  
  SPRING_START: { month: 2, day: 25 }, // Mar 25
  
  // June 17th: Spring → Summer
  SUMMER_START: { month: 5, day: 17 }, // Jun 17
  
  // September 20th: Summer → Fall
  FALL_START: { month: 8, day: 20 }   // Sep 20
};

/**
 * Check if a date is after a specific transition
 */
function isAfterTransition(date: Date, transition: { month: number, day: number }): boolean {
  const transitionDate = new Date(date.getFullYear(), transition.month, transition.day);
  return date >= transitionDate;
}

/**
 * Get the current quarter code based on the current date
 */
export function getCurrentQuarterCode(): number {
  const now = new Date();
  const year = now.getFullYear() % 100; // 2025 → 25
  let quarter = 4;
  if (isAfterTransition(now, QUARTER_TRANSITIONS.FALL_START)) {
    quarter = 4;
  } else if (isAfterTransition(now, QUARTER_TRANSITIONS.SUMMER_START)) {
    quarter = 3;
  } else if (isAfterTransition(now, QUARTER_TRANSITIONS.SPRING_START)) {
    quarter = 2;
  } else if (isAfterTransition(now, QUARTER_TRANSITIONS.WINTER_START)) {
    quarter = 1;
  } else {
    // Before Winter start (Jan 1), so we're in previous year's Fall
    return (year - 1) * 10 + 4;
  }
  return year * 10 + quarter;
}

/**
 * Check if a quarter is in the past
 */
export function isPastQuarter(quarterCode: number): boolean {
  return quarterCode < getCurrentQuarterCode() && quarterCode !== 0;
}

/**
 * Format a quarter code into a readable string
 */
export function formatQuarterCode(quarterCode: number): string {
  if (quarterCode === 0) return 'Not scheduled';
  if (quarterCode === 1) return 'Completed';
  const year = Math.floor(quarterCode / 10);
  const season = quarterCode % 10;
  const seasonNames = {
    1: 'Winter',
    2: 'Spring', 
    3: 'Summer',
    4: 'Fall'
  };
  return `${seasonNames[season as keyof typeof seasonNames]} 20${year.toString().padStart(2, '0')}`;
}

/**
 * Get smart default quarter range based on existing schedules
 */
export function getSmartQuarterRange(courseSchedules: CourseSchedule): number {
  const scheduledQuarters = Object.values(courseSchedules)
    .filter((quarterCode): quarterCode is number => quarterCode > 1) // Exclude completed courses (0 or 1)
    .sort((a, b) => a - b); // Sort ascending
  if (scheduledQuarters.length === 0) {
    return 3; // Default range
  }
  const lastQuarter = scheduledQuarters[scheduledQuarters.length - 1];
  const currentQuarter = getCurrentQuarterCode();
  // Compute the range: split into year and quarter values
  const currentYear = Math.floor(currentQuarter / 10);
  const lastYear = Math.floor(lastQuarter / 10);
  const currentSeason = currentQuarter % 10;
  const lastSeason = lastQuarter % 10;
  // Calculate the difference in years and seasons
  const yearDifference = lastYear - currentYear;
  const seasonDifference = lastSeason - currentSeason;
  return 4 * yearDifference + seasonDifference + 1; // +1 to include the last quarter
}
