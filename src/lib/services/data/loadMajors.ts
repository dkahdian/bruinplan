/**
 * Major data loading service - updated to use new data layer API
 * Provides compatibility layer for components that still expect the old interface
 */

import type { Major, MajorCache, MajorInfo, MajorSection, MajorRequirement, Course } from '../../types.js';
import { getMajorIndex, getMajorByName, getCourseById } from '../../data-layer/api.js';

// Cache for loaded majors
const majorCache: MajorCache = {};

/**
 * Transform a major display name into a URL-friendly ID using standard URL encoding
 * This handles all edge cases and special characters robustly
 * Examples:
 * - "Mathematics BS" -> "Mathematics%20BS"
 * - "Computer Science and Engineering BS" -> "Computer%20Science%20and%20Engineering%20BS"
 * - "Mathematics/Economics BS" -> "Mathematics%2FEconomics%20BS"
 * - "Women's Studies BA" -> "Women's%20Studies%20BA"
 */
export function majorNameToId(majorName: string): string {
	return encodeURIComponent(majorName);
}

/**
 * Transform a major ID back to a display name format
 * Since IDs are now URL-encoded, we just decode them
 */
export function majorIdToDisplayName(majorId: string): string {
	return decodeURIComponent(majorId);
}

/**
 * Get the degree type from a major name
 * Examples: "Mathematics BS" -> "BS", "Music Performance BM" -> "BM"
 */
export function extractDegreeType(majorName: string): string {
	// Look for common degree patterns at the end of the major name
	const patterns = [
		/\b(BS|BA|BM|BFA|BSN)\b$/i,
		/\bBachelor of (Science|Arts|Music|Fine Arts|Science in Nursing)\b$/i,
		/\b(MS|MA|MBA|PhD|EdD|JD|MD)\b$/i
	];
	
	for (const pattern of patterns) {
		const match = majorName.match(pattern);
		if (match) {
			return match[1].toUpperCase();
		}
	}
	
	return 'BA'; // Default to BA if no match
}

/**
 * Load a major by its ID using the new data layer API
 */
export async function loadMajor(majorId: string, fetchFn?: typeof globalThis.fetch): Promise<Major | null> {
	// Check local cache first
	if (majorCache[majorId]) {
		return majorCache[majorId];
	}

	try {
		// Convert ID back to display name for data layer lookup
		const displayName = majorIdToDisplayName(majorId);
		
		// Use the new data layer API
		const major = await getMajorByName(displayName, fetchFn);
		
		if (!major) {
			console.warn(`Major not found: ${displayName}`);
			return null;
		}

		// Validate the major data structure
		if (!validateMajor(major)) {
			console.error(`Invalid major data structure for ${majorId}`, major);
			return null;
		}

		// Cache the result
		majorCache[majorId] = major;
		return major;
	} catch (error) {
		console.error(`Error loading major ${majorId}:`, error);
		return null;
	}
}

/**
 * Get a list of all available majors using the new data layer API
 */
export async function getMajorsList(fetchFn?: typeof globalThis.fetch): Promise<MajorInfo[]> {
	try {
		// Use the new data layer API to get major index
		const majorIndex = await getMajorIndex(fetchFn);
		
		// Transform index data to MajorInfo format
		return majorIndex.map(major => ({
			id: majorNameToId(major.name),
			name: major.name,
			college: major.school, // The index uses 'school' field
			department: major.department || 'Unknown',
			degreeLevel: 'Undergraduate', // Default since not in index
			degreeObjective: extractDegreeType(major.name)
		}));
	} catch (error) {
		console.error('Error loading majors list:', error);
		return [];
	}
}

/**
 * Load major by display name (convenience function)
 */
export async function loadMajorByName(majorName: string, fetchFn?: typeof globalThis.fetch): Promise<Major | null> {
	const majorId = majorNameToId(majorName);
	return loadMajor(majorId, fetchFn);
}

/**
 * Get all course IDs required by a major (flattened from all sections and groups)
 */
export function getAllMajorCourses(major: Major): string[] {
	const courses = new Set<string>();
	
	for (const section of major.sections) {
		collectCoursesFromRequirements(section.requirements, courses);
	}
	
	return Array.from(courses);
}

/**
 * Load all courses required for a specific major using the data layer API
 * Returns a Map of courseId -> Course for efficient lookups
 */
export async function loadMajorCourses(major: Major, fetchFn?: typeof globalThis.fetch): Promise<Map<string, Course>> {
	const courseIds = getAllMajorCourses(major);
	const courseMap = new Map<string, Course>();
	
	// Load courses in parallel for better performance
	const coursePromises = courseIds.map(async (courseId) => {
		try {
			const course = await getCourseById(courseId, fetchFn);
			if (course) {
				courseMap.set(courseId, course);
			}
		} catch (error) {
			// Reduced logging for production - only log if it's an unexpected error
			if (error instanceof Error && !error.message.includes('not found')) {
				console.warn(`Failed to load course ${courseId} for major ${major.name}:`, error);
			}
		}
	});
	
	await Promise.all(coursePromises);
	
	return courseMap;
}

/**
 * Calculate the actual number of courses required to complete a major
 * This accounts for group requirements (select X from Y) properly
 */
export function calculateRequiredCourseCount(major: Major): number {
	let totalRequired = 0;
	
	for (const section of major.sections) {
		totalRequired += calculateSectionRequiredCount(section.requirements);
	}
	
	return totalRequired;
}

/**
 * Calculate the required course count for a specific section
 */
export function calculateSectionRequiredCount(requirements: MajorRequirement[]): number {
	let required = 0;
	
	for (const req of requirements) {
		if (req.type === 'course') {
			required += 1;
		} else if (req.type === 'group') {
			// For groups, count the minimum required courses (needs)
			required += req.needs;
		}
	}
	
	return required;
}

/**
 * Recursively collect course IDs from requirements (handles nested groups)
 */
function collectCoursesFromRequirements(requirements: MajorRequirement[], courses: Set<string>): void {
	for (const req of requirements) {
		if (req.type === 'course') {
			courses.add(req.courseId);
		} else if (req.type === 'group') {
			collectCoursesFromRequirements(req.options, courses);
		}
	}
}

/**
 * Validate a major data structure against our schema
 */
function validateMajor(major: any): major is Major {
	if (!major || typeof major !== 'object') return false;
	
	// Check required fields from our new interface
	const requiredStringFields = ['name', 'overview', 'college', 'department', 'degreeLevel', 'degreeObjective'];
	for (const field of requiredStringFields) {
		if (typeof major[field] !== 'string' || !major[field].trim()) {
			console.warn(`Major validation failed: missing or invalid ${field}`);
			return false;
		}
	}
	
	// Validate sections array
	if (!Array.isArray(major.sections) || major.sections.length === 0) {
		console.warn('Major validation failed: sections must be a non-empty array');
		return false;
	}
	
	// Validate each section
	for (const section of major.sections) {
		if (!validateSection(section)) return false;
	}
	
	return true;
}

/**
 * Validate a section data structure
 */
function validateSection(section: any): boolean {
	if (!section || typeof section !== 'object') return false;
	
	// Check required fields from our MajorSection interface
	const requiredStringFields = ['id', 'title', 'description'];
	for (const field of requiredStringFields) {
		if (typeof section[field] !== 'string' || !section[field].trim()) {
			console.warn(`Section validation failed: missing or invalid ${field}`);
			return false;
		}
	}
	
	// Validate requirements array
	if (!Array.isArray(section.requirements)) {
		console.warn('Section validation failed: requirements must be an array');
		return false;
	}
	
	// Validate each requirement
	for (const req of section.requirements) {
		if (!validateRequirement(req)) return false;
	}
	
	return true;
}

/**
 * Validate a requirement (can be course or group)
 */
function validateRequirement(req: any): boolean {
	if (!req || typeof req !== 'object') return false;
	
	if (req.type === 'course') {
		// Validate course requirement
		if (typeof req.courseId !== 'string' || !req.courseId.trim()) {
			console.warn('Course requirement validation failed: missing or invalid courseId');
			return false;
		}
		return true;
	} else if (req.type === 'group') {
		// Validate group requirement
		const requiredStringFields = ['title', 'description'];
		for (const field of requiredStringFields) {
			if (typeof req[field] !== 'string' || !req[field].trim()) {
				console.warn(`Group requirement validation failed: missing or invalid ${field}`);
				return false;
			}
		}
		
		if (typeof req.needs !== 'number' || req.needs <= 0) {
			console.warn('Group requirement validation failed: needs must be a positive number');
			return false;
		}
		
		if (!Array.isArray(req.options)) {
			console.warn('Group requirement validation failed: options must be an array');
			return false;
		}
		
		// Allow empty options arrays for now - this might be valid in some cases
		// (Reduced logging for production)
		if (req.options.length === 0) {
			// Silent for now - empty groups may be placeholders
		}
		
		// Recursively validate options
		for (const option of req.options) {
			if (!validateRequirement(option)) return false;
		}
		
		return true;
	}
	
	console.warn(`Unknown requirement type: ${req.type}`);
	return false;
}

/**
 * Clear the major cache (useful for development/testing)
 */
export function clearMajorCache(): void {
	// Clear local cache
	for (const key in majorCache) {
		delete majorCache[key];
	}
	
	// Also clear the data layer cache
	import('../../data-layer/api.js').then(({ clearCache }) => {
		clearCache();
	});
}
