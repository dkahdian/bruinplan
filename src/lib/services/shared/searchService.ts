import type { Course, CourseIndex, MajorIndex } from '../../types.js';
import { searchCourses as searchCourseIndex, getCourseById, searchMajors } from '../../data-layer/api.js';

export interface SearchResult {
	course: Course;
	similarity: number;
}

export interface SearchOptions {
	maxResults?: number;
	minSimilarity?: number;
	enableLogging?: boolean;
	useIndexFirst?: boolean; // Whether to try index search first (default: true)
}

/**
 * Fast search using the course index (for quick results)
 * This is much faster than loading full course data
 */
export async function searchCoursesIndex(
	query: string,
	options: SearchOptions = {}
): Promise<CourseIndex[]> {
	const { maxResults = 20 } = options;
	
	try {
		const results = await searchCourseIndex(query);
		return results.slice(0, maxResults);
	} catch (error) {
		console.error('Index search failed:', error);
		return [];
	}
}

/**
 * Fast search for majors using the major index
 */
export async function searchMajorsIndex(
	query: string,
	options: SearchOptions = {}
): Promise<MajorIndex[]> {
	const { maxResults = 20 } = options;
	
	try {
		const results = await searchMajors(query);
		return results.slice(0, maxResults);
	} catch (error) {
		console.error('Major index search failed:', error);
		return [];
	}
}

/**
 * Enhanced course search that first tries index search, then falls back to full search
 * This is the new recommended search function
 */
export async function searchCoursesNew(
	query: string,
	options: SearchOptions = {}
): Promise<Course[]> {
	const { 
		maxResults = 20, 
		enableLogging = false, 
		useIndexFirst = true 
	} = options;
	
	if (!query.trim()) return [];
	
	try {
		if (useIndexFirst) {
			// First try fast index search
			const indexResults = await searchCourseIndex(query);
			
			if (enableLogging) {
				console.log('🔍 Index search found:', indexResults.length, 'results');
			}
			
			// Convert index results to full course objects
			const courses: Course[] = [];
			for (const indexResult of indexResults.slice(0, maxResults)) {
				const course = await getCourseById(indexResult.id);
				if (course) {
					courses.push(course);
				}
			}
			
			if (enableLogging) {
				console.log('📋 Loaded full course data for:', courses.length, 'courses');
			}
			
			return courses;
		}
		
		// If not using index first, fall back to original search logic
		// This requires loading all courses first, which is less efficient
		console.warn('searchCoursesNew called with useIndexFirst=false - consider using the index search for better performance');
		return [];
		
	} catch (error) {
		console.error('Enhanced course search failed:', error);
		return [];
	}
}

// ============================================================================
// LEGACY SEARCH FUNCTIONS (for backward compatibility)
// These functions work with pre-loaded Course arrays
// For new code, use searchCoursesNew() or searchCoursesIndex() instead
// ============================================================================

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
	const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
	
	for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
	for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
	
	for (let j = 1; j <= str2.length; j++) {
		for (let i = 1; i <= str1.length; i++) {
			const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
			matrix[j][i] = Math.min(
				matrix[j][i - 1] + 1,     // deletion
				matrix[j - 1][i] + 1,     // insertion
				matrix[j - 1][i - 1] + indicator // substitution
			);
		}
	}
	
	return matrix[str2.length][str1.length];
}

/**
 * Calculate similarity score for fuzzy matching with improved course ID detection
 */
function calculateSimilarity(query: string, course: Course): number {
	const lowerQuery = query.toLowerCase();
	const courseId = course.id.toLowerCase();
	const courseTitle = course.title.toLowerCase();
	
	// Detect if query looks like a course ID (letters followed by numbers/spaces)
	const courseIdPattern = /^[a-z]+(\s*\d+[a-z]*)*$/i;
	const isCourseIdSearch = courseIdPattern.test(query.trim());
	
	// Exact matches get highest score
	if (courseId === lowerQuery || courseTitle === lowerQuery) return 10000;
	
	// For course ID searches, heavily prioritize course ID matches
	if (isCourseIdSearch) {
		// Course ID substring matches get massive priority
		if (courseId.includes(lowerQuery)) {
			// Calculate how close the match is (shorter = better)
			const lengthDiff = courseId.length - lowerQuery.length;
			return 5000 - (lengthDiff * 10); // Start at 5000, subtract points for extra chars
		}
		
		// Course ID Levenshtein distance for close matches
		const idDistance = levenshteinDistance(lowerQuery, courseId);
		if (idDistance <= 3) { // Only consider very close matches
			return 3000 - (idDistance * 100); // 3000, 2900, 2800, 2700 for distances 0,1,2,3
		}
		
		// For course ID searches, don't give much weight to title matches
		if (courseTitle.includes(lowerQuery)) {
			return 100; // Very low score for title matches in course ID searches
		}
		
		return 0; // No match for course ID search
	}
	
	// For non-course-ID searches (text searches), use the original algorithm
	// Substring matches get high scores
	if (courseId.includes(lowerQuery)) return 800;
	if (courseTitle.includes(lowerQuery)) return 700;
	
	// Word-based matching for titles
	const titleWords = courseTitle.split(/\s+/);
	const queryWords = lowerQuery.split(/\s+/);
	
	let wordMatchScore = 0;
	for (const queryWord of queryWords) {
		for (const titleWord of titleWords) {
			if (titleWord.startsWith(queryWord)) {
				wordMatchScore += 300;
			} else if (titleWord.includes(queryWord)) {
				wordMatchScore += 200;
			}
		}
	}
	
	if (wordMatchScore > 0) return wordMatchScore;
	
	// Levenshtein distance for fuzzy matching
	const maxLen = Math.max(lowerQuery.length, courseId.length, courseTitle.length);
	const idDistance = levenshteinDistance(lowerQuery, courseId);
	const titleDistance = levenshteinDistance(lowerQuery, courseTitle);
	
	const idSimilarity = Math.max(0, (maxLen - idDistance) / maxLen) * 1000;
	const titleSimilarity = Math.max(0, (maxLen - titleDistance) / maxLen) * 1000;
	
	return Math.max(idSimilarity, titleSimilarity);
}

/**
 * LEGACY: Search courses with fuzzy matching and intelligent scoring
 * This function requires pre-loaded Course arrays and is less efficient
 * For new code, use searchCoursesNew() instead
 */
export function searchCourses(
	courses: Course[], 
	query: string, 
	options: SearchOptions = {}
): Course[] {
	const {
		maxResults = 20,
		minSimilarity = 50,
		enableLogging = false
	} = options;

	if (!query.trim() || courses.length === 0) {
		return [];
	}

	const normalizedQuery = query.toLowerCase().trim();
	
	if (enableLogging) {
		console.log('🔍 Searching for:', normalizedQuery);
	}
	
	// First, get exact and substring matches
	const exactMatches = courses.filter(course => 
		course.id.toLowerCase().includes(normalizedQuery) || 
		course.title.toLowerCase().includes(normalizedQuery)
	);
	
	if (enableLogging) {
		console.log('✅ Exact matches found:', exactMatches.length);
	}
	
	// If we have fewer than maxResults exact matches, add fuzzy matches
	if (exactMatches.length < maxResults) {
		// Get all courses with similarity scores
		const scoredCourses = courses
			.filter(course => !exactMatches.some(exact => exact.id === course.id)) // Exclude already matched
			.map(course => ({
				course,
				similarity: calculateSimilarity(normalizedQuery, course)
			}))
			.filter(item => {
				const included = item.similarity > minSimilarity;
				if (included && enableLogging) {
					console.log(`📊 Course ${item.course.id}: similarity = ${item.similarity.toFixed(2)}`);
				}
				return included;
			}) // Only include reasonable matches
			.sort((a, b) => b.similarity - a.similarity) // Sort by similarity descending
			.slice(0, maxResults - exactMatches.length) // Fill up to maxResults total results
			.map(item => item.course);
		
		if (enableLogging) {
			console.log('🎯 Fuzzy matches found:', scoredCourses.length);
		}
		
		const results = [...exactMatches, ...scoredCourses].slice(0, maxResults);
		
		if (enableLogging) {
			console.log('📋 Total results:', results.length);
		}
		
		return results;
	} else {
		const results = exactMatches.slice(0, maxResults);
		
		if (enableLogging) {
			console.log('📋 Total results:', results.length);
		}
		
		return results;
	}
}

/**
 * Search courses with detailed scoring information (for debugging)
 */
export function searchCoursesWithScores(
	courses: Course[], 
	query: string, 
	options: SearchOptions = {}
): SearchResult[] {
	const {
		maxResults = 20,
		minSimilarity = 50,
		enableLogging = false
	} = options;

	if (!query.trim() || courses.length === 0) {
		return [];
	}

	const normalizedQuery = query.toLowerCase().trim();
	
	// Get all courses with similarity scores
	const allScoredCourses = courses
		.map(course => ({
			course,
			similarity: calculateSimilarity(normalizedQuery, course)
		}))
		.filter(item => item.similarity > minSimilarity)
		.sort((a, b) => b.similarity - a.similarity)
		.slice(0, maxResults);

	if (enableLogging) {
		console.log('🔍 Search results with scores:');
		allScoredCourses.forEach(item => {
			console.log(`📊 ${item.course.id}: ${item.similarity.toFixed(2)}`);
		});
	}

	return allScoredCourses;
}
