// Data layer API for BruinPlan
import type { CourseIndex, MajorIndex, Course, Major, CourseRequirement, MajorRequirement } from '../types.js';

// In-memory caches
let courseIndex: CourseIndex[] | null = null;
let majorIndex: MajorIndex[] | null = null;
const subjectCourses = new Map<string, Course[]>();
const majors = new Map<string, Major>();

// API Functions

// Course Index
export async function getCourseIndex(fetchFn?: typeof globalThis.fetch): Promise<CourseIndex[]> {
	if (courseIndex !== null) return courseIndex;
	
	const fetchToUse = fetchFn || fetch;
	const response = await fetchToUse('/course_index.json');
	if (!response.ok) throw new Error(`Failed to load course index: ${response.status}`);
	courseIndex = await response.json();
	return courseIndex!; // Non-null assertion since we just assigned it
}

export async function searchCourses(query: string, fetchFn?: typeof globalThis.fetch): Promise<CourseIndex[]> {
	const index = await getCourseIndex(fetchFn);
	const lowerQuery = query.toLowerCase();
	return index.filter(course => 
		course.id.toLowerCase().includes(lowerQuery) || 
		course.title.toLowerCase().includes(lowerQuery)
	);
}

export async function getCourseSummaryById(courseId: string, fetchFn?: typeof globalThis.fetch): Promise<CourseIndex | undefined> {
	const index = await getCourseIndex(fetchFn);
	return index.find(course => course.id === courseId);
}

// Major Index
export async function getMajorIndex(fetchFn?: typeof globalThis.fetch): Promise<MajorIndex[]> {
	if (majorIndex !== null) return majorIndex;
	
	const fetchToUse = fetchFn || fetch;
	const response = await fetchToUse('/major_index.json');
	if (!response.ok) throw new Error(`Failed to load major index: ${response.status}`);
	majorIndex = await response.json();
	return majorIndex!; // Non-null assertion since we just assigned it
}

export async function searchMajors(query: string, fetchFn?: typeof globalThis.fetch): Promise<MajorIndex[]> {
	const index = await getMajorIndex(fetchFn);
	const lowerQuery = query.toLowerCase();
	return index.filter(major =>
		major.name.toLowerCase().includes(lowerQuery) ||
		major.school.toLowerCase().includes(lowerQuery)
	);
}

// Course Data
export async function getSubjectCourses(subjectCode: string, fetchFn?: typeof globalThis.fetch): Promise<Course[]> {
	
	if (subjectCourses.has(subjectCode)) {
		return subjectCourses.get(subjectCode)!;
	}
	
	const fetchToUse = fetchFn || fetch;
	// Don't URL encode the filename for static file serving
	// The Vite dev server expects the actual filename, not URL-encoded
	
	const url = `/courses/${subjectCode}.json`;
	const response = await fetchToUse(url);
	
	if (!response.ok) {
		console.error(`Failed to fetch courses for subject ${subjectCode}: ${response.status} ${response.statusText}`);
		throw new Error(`Subject ${subjectCode} not found: ${response.status}`);
	}

	const courses: Course[] = await response.json();
	subjectCourses.set(subjectCode, courses);
	return courses;
}

export async function getCourseById(courseId: string, fetchFn?: typeof globalThis.fetch): Promise<Course | undefined> {
	// First get the subject code from the index
	const courseSummary = await getCourseSummaryById(courseId, fetchFn);
	if (!courseSummary) {
		return undefined;
	}

	// Load the subject courses
	const courses = await getSubjectCourses(courseSummary.subject, fetchFn);
	const foundCourse = courses.find(course => course.id === courseId);

	return foundCourse;
}

// Major Data
export async function getMajorByName(majorName: string, fetchFn?: typeof globalThis.fetch): Promise<Major | undefined> {
	if (majors.has(majorName)) {
		return majors.get(majorName)!;
	}
	
	const fetchToUse = fetchFn || fetch;
	// URL encode the major name to handle spaces and special characters
	const encodedMajorName = encodeURIComponent(majorName);
	const response = await fetchToUse(`/majors/${encodedMajorName}.json`);
	if (!response.ok) throw new Error(`Major ${majorName} not found: ${response.status}`);
	
	const major: Major = await response.json();
	majors.set(majorName, major);
	return major;
}

export function majorNameToId(majorName: string): string {
	return majorName.replace(/\s+/g, '-').toLowerCase();
}

export function majorIdToDisplayName(majorId: string): string {
	return majorId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export async function loadMajor(majorId: string, fetchFn?: typeof globalThis.fetch): Promise<Major | null> {
	const majorName = majorIdToDisplayName(majorId);
	const major = await getMajorByName(majorName, fetchFn);
	return major || null;
}

export async function loadMajorByName(majorName: string, fetchFn?: typeof globalThis.fetch): Promise<Major | null> {
	const major = await getMajorByName(majorName, fetchFn);
	return major || null;
}

export async function getMajorsList(fetchFn?: typeof globalThis.fetch): Promise<{ name: string; id: string; college: string; department: string; degreeLevel: string; degreeObjective: string; }[]> {
	const index = await getMajorIndex(fetchFn);
	return index.map(major => ({
		name: major.name,
		id: majorNameToId(major.name),
		college: major.school || 'Unknown',
		department: major.department || 'Unknown',
		degreeLevel: major.name.includes('BS') ? 'Bachelor of Science' : 
			         major.name.includes('BA') ? 'Bachelor of Arts' :
			         major.name.includes('BFA') ? 'Bachelor of Fine Arts' : 'Bachelor',
		degreeObjective: major.name.includes('BS') ? 'Bachelor of Science' : 
			            major.name.includes('BA') ? 'Bachelor of Arts' :
			            major.name.includes('BFA') ? 'Bachelor of Fine Arts' : 'Bachelor'
	}));
}

export function getAllMajorCourses(major: Major): string[] {
	const courses: string[] = [];
	
	function extractCourses(requirements: MajorRequirement[]) {
		for (const req of requirements) {
			if (req.type === 'course') {
				courses.push(req.courseId);
			} else if (req.type === 'group') {
				extractCourses(req.options);
			}
		}
	}
	
	for (const section of major.sections) {
		extractCourses(section.requirements);
	}
	
	return [...new Set(courses)]; // Remove duplicates
}

export async function loadMajorCourses(major: Major, fetchFn?: typeof globalThis.fetch): Promise<Map<string, Course>> {
	const courseIds = getAllMajorCourses(major);
	const courseMap = new Map<string, Course>();
	
	// Load all courses
	for (const courseId of courseIds) {
		const course = await getCourseById(courseId, fetchFn);
		if (course) {
			courseMap.set(courseId, course);
		}
	}
	
	return courseMap;
}

export function calculateRequiredCourseCount(major: Major): number {
	let total = 0;
	
	for (const section of major.sections) {
		total += calculateSectionRequiredCount(section.requirements);
	}
	
	return total;
}

export function calculateSectionRequiredCount(requirements: MajorRequirement[]): number {
	let count = 0;
	
	for (const req of requirements) {
		if (req.type === 'course') {
			count += 1;
		} else if (req.type === 'group') {
			count += req.needs;
		}
	}
	
	return count;
}

// Dependency/Tree Utilities
export async function getCoursePrerequisites(courseId: string): Promise<Course[]> {
	const course = await getCourseById(courseId);
	if (!course || !course.requisites) return [];
	
	const prerequisites: Course[] = [];
	const visited = new Set<string>(); // Prevent infinite loops
	
	await collectPrerequisitesRecursively(course.requisites, prerequisites, visited);
	
	return prerequisites;
}

// Helper function to recursively collect prerequisites
async function collectPrerequisitesRecursively(
	requirements: CourseRequirement[], 
	prerequisites: Course[], 
	visited: Set<string>
): Promise<void> {
	for (const requirement of requirements) {
		if (requirement.type === 'requisite') {
			// Single course prerequisite
			const courseId = requirement.course;
			if (!visited.has(courseId)) {
				visited.add(courseId);
				const prereqCourse = await getCourseById(courseId);
				if (prereqCourse) {
					prerequisites.push(prereqCourse);
					// Recursively collect prerequisites of this prerequisite
					await collectPrerequisitesRecursively(prereqCourse.requisites, prerequisites, visited);
				}
			}
		} else if (requirement.type === 'group') {
			// Group of prerequisite options - collect all possible prerequisites
			await collectPrerequisitesRecursively(requirement.options, prerequisites, visited);
		}
	}
}

export async function getMajorDependencies(majorName: string): Promise<string[]> {
	const major = await getMajorByName(majorName);
	if (!major) return [];
	
	const subjects = new Set<string>();
	
	// Parse major sections and requirements to extract course IDs
	// and determine their subject codes
	for (const section of major.sections) {
		await extractSubjectsFromRequirements(section.requirements, subjects);
	}
	
	return Array.from(subjects);
}

// Helper function to recursively extract subjects from requirements
async function extractSubjectsFromRequirements(requirements: MajorRequirement[], subjects: Set<string>): Promise<void> {
	for (const req of requirements) {
		if (req.type === 'course') {
			// Single course requirement
			const courseSummary = await getCourseSummaryById(req.courseId);
			if (courseSummary) {
				subjects.add(courseSummary.subject);
			}
		} else if (req.type === 'group') {
			// Group requirement - recursively process options
			await extractSubjectsFromRequirements(req.options, subjects);
		}
	}
}

// Cache/State Management
export function clearCache(): void {
	courseIndex = null;
	majorIndex = null;
	subjectCourses.clear();
	majors.clear();
}

export function isLoaded(type: 'subject' | 'major' | 'index', key: string): boolean {
	switch (type) {
		case 'index':
			return key === 'course' ? courseIndex !== null : majorIndex !== null;
		case 'subject':
			return subjectCourses.has(key);
		case 'major':
			return majors.has(key);
		default:
			return false;
	}
}
