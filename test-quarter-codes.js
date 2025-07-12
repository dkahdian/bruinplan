// Quick test to verify quarter code functionality
// This is just a demonstration of the quarter code logic - July 11, 2025 should be Summer 2025 (code 325)

const QUARTER_TRANSITIONS = {
  WINTER_START: { month: 0, day: 1 }, // Jan 1
  SPRING_START: { month: 2, day: 25 }, // Mar 25
  SUMMER_START: { month: 5, day: 17 }, // Jun 17
  FALL_START: { month: 8, day: 20 }   // Sep 20
};

function isAfterTransition(date, transition) {
  const transitionDate = new Date(date.getFullYear(), transition.month, transition.day);
  return date >= transitionDate;
}

function getCurrentQuarterCode() {
  const now = new Date();
  const year = now.getFullYear();
  const yearSuffix = year % 100; // 2025 → 25
  
  // Check which quarter we're currently in
  if (isAfterTransition(now, QUARTER_TRANSITIONS.FALL_START)) {
    return 400 + yearSuffix; // Fall: 4XX
  } else if (isAfterTransition(now, QUARTER_TRANSITIONS.SUMMER_START)) {
    return 300 + yearSuffix; // Summer: 3XX
  } else if (isAfterTransition(now, QUARTER_TRANSITIONS.SPRING_START)) {
    return 200 + yearSuffix; // Spring: 2XX
  } else if (isAfterTransition(now, QUARTER_TRANSITIONS.WINTER_START)) {
    return 100 + yearSuffix; // Winter: 1XX
  } else {
    // Before Winter start, so we're in previous year's Fall
    const prevYear = year - 1;
    return 400 + (prevYear % 100);
  }
}

function formatQuarterCode(quarterCode) {
  if (quarterCode === 0) return 'Completed';
  
  const season = Math.floor(quarterCode / 100);
  const year = 2000 + (quarterCode % 100);
  
  const seasonNames = {
    1: 'Winter',
    2: 'Spring', 
    3: 'Summer',
    4: 'Fall'
  };
  
  return `${seasonNames[season]} ${year}`;
}

console.log('Current date:', new Date().toLocaleDateString());
console.log('Current quarter code:', getCurrentQuarterCode());
console.log('Formatted:', formatQuarterCode(getCurrentQuarterCode()));
console.log('Sample formats:');
console.log('- Winter 2025:', formatQuarterCode(125));
console.log('- Spring 2025:', formatQuarterCode(225));
console.log('- Summer 2025:', formatQuarterCode(325));
console.log('- Fall 2025:', formatQuarterCode(425));
console.log('- Completed:', formatQuarterCode(0));
