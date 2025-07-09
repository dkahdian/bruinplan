/**
 * Major Graph Service
 * Builds graph nodes and edges from major requirement data using compound nodes
 * Leverages the modular graph infrastructure for consistency
 */

import type { Major, MajorRequirement, MajorSection } from '../../types.js';
import type { GraphNode, GraphEdge, GraphBuildOptions, GraphBuildResult } from '../graph/types.js';
import { loadCourses } from '../data/loadCourses.js';
import { isCourseEffectivelyCompleted, getCompletedCourseSource } from '../shared/completionService.js';
import { shouldShowCourse } from '../graph/utils.js';

interface MajorGraphOptions extends Partial<GraphBuildOptions> {
	// Additional options specific to major graphs
	groupSectionsByColor?: boolean;
	showSectionHeaders?: boolean;
	layoutBySections?: boolean;
}

/**
 * Builds a graph representation of a major's requirements using compound nodes
 * @param major - The major to build a graph for
 * @param options - Configuration options for graph building
 * @returns Promise resolving to graph nodes and edges
 */
export async function buildMajorGraph(
	major: Major, 
	options: MajorGraphOptions = {}
): Promise<GraphBuildResult> {
	console.log('buildMajorGraph called with major:', major.name);
	
	const {
		showWarnings = true,
		showRecommended = true,
		userCompletedCourses = new Set(),
		showCompletedCourses = true,
		groupSectionsByColor = true,
		showSectionHeaders = true,
		layoutBySections = true
	} = options;

	console.log('Loading courses...');
	// Load course data to get course details
	const coursesData = await loadCourses();
	console.log('Courses loaded:', coursesData.courses.length);
	
	const courseMap = new Map(coursesData.courses.map(course => [course.id, course]));
	console.log('Course map created with', courseMap.size, 'entries');

	const nodes: GraphNode[] = [];
	const edges: GraphEdge[] = [];
	const sectionColors = generateSectionColors(major.sections.length);

	// Track unique courses to avoid duplicates
	const seenCourses = new Set<string>();
	let nodeCounter = 0;

	console.log('Processing', major.sections.length, 'sections');

	// Process each section as a compound node
	major.sections.forEach((section, sectionIndex) => {
		console.log(`Processing section ${sectionIndex}: ${section.title}`);
		const sectionColor = sectionColors[sectionIndex];
		const sectionId = `section-${section.id}`;
		
		// Create compound node for the section
		const sectionNode: GraphNode = {
			data: {
				id: sectionId,
				type: 'section',
				label: section.title,
				sectionId: section.id,
				backgroundColor: sectionColor + '20', // Add transparency
				borderColor: sectionColor
			}
		};
		nodes.push(sectionNode);

		// Process requirements in this section
		const sectionNodes = processSectionRequirements(
			section,
			sectionId, // Pass section ID as parent
			sectionColor,
			courseMap,
			userCompletedCourses,
			showCompletedCourses,
			seenCourses,
			nodeCounter
		);

		nodes.push(...sectionNodes.nodes);
		edges.push(...sectionNodes.edges);
		nodeCounter = sectionNodes.nodeCounter;
	});

	console.log('Graph building complete. Total nodes:', nodes.length, 'Total edges:', edges.length);
	
	// Add prerequisite edges between courses in the major
	console.log('Adding prerequisite edges...');
	const prerequisiteEdges = addPrerequisiteEdges(nodes, courseMap, userCompletedCourses, {
		showWarnings,
		showRecommended
	});
	edges.push(...prerequisiteEdges);
	
	console.log('Final graph with prerequisites. Total nodes:', nodes.length, 'Total edges:', edges.length);
	
	return {
		nodes,
		edges
	};
}

/**
 * Process requirements within a major section using compound nodes
 */
function processSectionRequirements(
	section: MajorSection,
	parentId: string, // Section ID as parent
	sectionColor: string,
	courseMap: Map<string, any>,
	userCompletedCourses: Set<string>,
	showCompletedCourses: boolean,
	seenCourses: Set<string>,
	startNodeCounter: number
): { nodes: GraphNode[], edges: GraphEdge[], nodeCounter: number } {
	const nodes: GraphNode[] = [];
	const edges: GraphEdge[] = [];
	let nodeCounter = startNodeCounter;

	function processRequirement(
		requirement: MajorRequirement,
		parentNodeId: string, // Parent compound node ID
		depth = 0,
		indexInParent = 0
	): void {
		if (requirement.type === 'course') {
			const courseId = requirement.courseId;
			
			// Skip if we've already added this course to avoid duplicates
			if (seenCourses.has(courseId)) {
				return;
			}
			seenCourses.add(courseId);

			const course = courseMap.get(courseId);
			const isCompleted = getCompletedCourseSource(courseId) !== null;
			
			// Skip completed courses if showCompletedCourses is false
			if (!shouldShowCourse(courseId, showCompletedCourses, (id) => getCompletedCourseSource(id) !== null)) {
				return;
			}
			
			// Create course node with parent reference
			const courseNode: GraphNode = {
				data: {
					id: courseId,
					type: 'course',
					label: courseId, // Just show the course code
					course: course,
					sectionId: section.id,
					parent: parentNodeId // Set parent for compound structure
				}
			};

			// Only set completed attribute if the course is actually completed
			if (isCompleted) {
				courseNode.data.completed = true;
			}

			nodes.push(courseNode);

		} else if (requirement.type === 'group') {
			// First, determine which courses would be shown in this group
			const visibleOptions: MajorRequirement[] = [];
			
			function collectVisibleOptions(req: MajorRequirement): void {
				if (req.type === 'course') {
					const courseId = req.courseId;
					if (!seenCourses.has(courseId)) {
						const isCompleted = getCompletedCourseSource(courseId) !== null;
						if (shouldShowCourse(courseId, showCompletedCourses, (id) => getCompletedCourseSource(id) !== null)) {
							visibleOptions.push(req);
						}
					}
				} else if (req.type === 'group') {
					req.options.forEach(collectVisibleOptions);
				}
			}
			
			requirement.options.forEach(collectVisibleOptions);
			
			// Only create the group if it has visible options
			if (visibleOptions.length === 0) {
				return;
			}
			
			// Create a compound group node
			const groupId = `group-${nodeCounter++}`;
			
			// Create label: use title if available, otherwise just the count
			const groupLabel = requirement.title 
				? `${requirement.title}: Select ${requirement.needs}`
				: `Select ${requirement.needs}`;
			
			const groupNode: GraphNode = {
				data: {
					id: groupId,
					type: 'group',
					label: groupLabel,
					options: requirement.options,
					sectionId: section.id,
					parent: parentNodeId, // Set parent for compound structure
					backgroundColor: sectionColor + '10', // Light background
					borderColor: sectionColor
				}
			};

			nodes.push(groupNode);

			// Process group options with the group as parent
			requirement.options.forEach((option, optionIndex) => {
				processRequirement(option, groupId, depth + 1, optionIndex);
			});
		}
	}

	// Process all requirements in this section with section as parent
	section.requirements.forEach((requirement, reqIndex) => {
		processRequirement(requirement, parentId, 0, reqIndex);
	});

	return { nodes, edges, nodeCounter };
}

/**
 * Generate distinct colors for different sections
 */
function generateSectionColors(count: number): string[] {
	const colors = [
		'#3b82f6', // blue-500
		'#10b981', // emerald-500  
		'#f59e0b', // amber-500
		'#ef4444', // red-500
		'#8b5cf6', // violet-500
		'#06b6d4', // cyan-500
		'#84cc16', // lime-500
		'#f97316', // orange-500
		'#ec4899', // pink-500
		'#6366f1'  // indigo-500
	];

	// If we need more colors than we have, cycle through them
	const result: string[] = [];
	for (let i = 0; i < count; i++) {
		result.push(colors[i % colors.length]);
	}
	
	return result;
}

/**
 * Get all unique course IDs from a major's requirements
 * Useful for analysis and statistics
 */
export function getAllCoursesFromMajor(major: Major): string[] {
	const courseIds = new Set<string>();

	function extractCourses(requirement: MajorRequirement): void {
		if (requirement.type === 'course') {
			courseIds.add(requirement.courseId);
		} else if (requirement.type === 'group') {
			requirement.options.forEach(extractCourses);
		}
	}

	major.sections.forEach(section => {
		section.requirements.forEach(extractCourses);
	});

	return Array.from(courseIds);
}

/**
 * Calculate the minimum number of courses required for a major
 * Takes into account group requirements that allow selecting fewer than all options
 */
export function calculateMinimumCoursesRequired(major: Major): number {
	let total = 0;

	function countRequirement(requirement: MajorRequirement): number {
		if (requirement.type === 'course') {
			return 1;
		} else if (requirement.type === 'group') {
			// For groups, only count the required number (needs), not all options
			const optionCounts = requirement.options.map(countRequirement);
			optionCounts.sort((a, b) => a - b); // Sort ascending to take minimum courses
			return optionCounts.slice(0, requirement.needs).reduce((sum, count) => sum + count, 0);
		}
		return 0;
	}

	major.sections.forEach(section => {
		section.requirements.forEach(requirement => {
			total += countRequirement(requirement);
		});
	});

	return total;
}

/**
 * Add prerequisite edges between courses in the major graph
 * Supports enforced, warning, and recommended prerequisites with group nodes
 */
function addPrerequisiteEdges(
	nodes: GraphNode[],
	courseMap: Map<string, any>,
	userCompletedCourses: Set<string>,
	options: { showWarnings: boolean, showRecommended: boolean } = { showWarnings: true, showRecommended: true }
): GraphEdge[] {
	const edges: GraphEdge[] = [];
	const additionalNodes: GraphNode[] = [];
	let groupCounter = 0;
	
	// Create a map of course ID to its parent compound node for quick lookup
	const courseToParentMap = new Map<string, string>();
	nodes
		.filter(node => node.data.type === 'course')
		.forEach(node => {
			if (node.data.parent) {
				courseToParentMap.set(node.data.id, node.data.parent);
			}
		});
	
	// Get all course node IDs in the major
	const majorCourseIds = new Set(
		nodes
			.filter(node => node.data.type === 'course')
			.map(node => node.data.id)
	);
	
	console.log('Major course IDs:', Array.from(majorCourseIds));
	console.log('Course to parent map:', Array.from(courseToParentMap.entries()));
	
	// For each course in the major, check its prerequisites
	majorCourseIds.forEach(courseId => {
		const course = courseMap.get(courseId);
		if (!course || !course.requisites) return;
		
		const targetCourseParent = courseToParentMap.get(courseId);
		
		// Process each requisite
		course.requisites.forEach((requisite: any) => {
			const result = processRequisiteForEdges(
				requisite,
				courseId,
				targetCourseParent, // Pass the target course's parent
				majorCourseIds,
				userCompletedCourses,
				groupCounter,
				options.showWarnings,
				options.showRecommended
			);
			edges.push(...result.edges);
			additionalNodes.push(...result.nodes);
			groupCounter = result.groupCounter;
		});
	});
	
	// Add the new group nodes to the main nodes array
	nodes.push(...additionalNodes);
	
	console.log('Added', edges.length, 'prerequisite edges and', additionalNodes.length, 'group nodes');
	return edges;
}

/**
 * Process a course requisite to create edges for prerequisites
 * Supports all prerequisite types and creates group nodes when needed
 */
function processRequisiteForEdges(
	requisite: any,
	targetCourseId: string,
	targetCourseParent: string | undefined, // Parent compound node of the target course
	majorCourseIds: Set<string>,
	userCompletedCourses: Set<string>,
	startGroupCounter: number,
	showWarnings: boolean = true,
	showRecommended: boolean = true
): { edges: GraphEdge[], nodes: GraphNode[], groupCounter: number } {
	const edges: GraphEdge[] = [];
	const nodes: GraphNode[] = [];
	let groupCounter = startGroupCounter;
	
	if (requisite.type === 'Requisite') {
		// Handle single prerequisite course
		const shouldShow = requisite.level === 'Enforced' || 
						  (showWarnings && requisite.level === 'Warning') ||
						  (showRecommended && requisite.level === 'Recommended');
		
		if (shouldShow && majorCourseIds.has(requisite.course)) {
			const isCompleted = getCompletedCourseSource(requisite.course) !== null;
			const edgeType: 'enforced' | 'warning' | 'recommended' = 
				requisite.level === 'Enforced' ? 'enforced' : 
				requisite.level === 'Warning' ? 'warning' : 'recommended';
			
			edges.push({
				data: {
					id: `${requisite.course}-${targetCourseId}`,
					source: requisite.course,
					target: targetCourseId,
					type: edgeType
					// Remove fromCompleted to let the base edge color show through
				}
			});
		}
	} else if (requisite.type === 'Group') {
		// Handle prerequisite groups - create diamond nodes
		const validOptions = requisite.options?.filter((option: any) => {
			const shouldShow = option.type === 'Requisite' && (
				option.level === 'Enforced' || 
				(showWarnings && option.level === 'Warning') ||
				(showRecommended && option.type === 'Recommended')
			);
			return shouldShow && majorCourseIds.has(option.course);
		});
		
		if (validOptions && validOptions.length > 0) {
			const groupId = `prereq-group-${groupCounter++}`;
			
			// Determine group color based on the strictest requirement level
			let groupColor: 'enforced' | 'warning' | 'recommended' = 'recommended';
			if (validOptions.some((opt: any) => opt.level === 'Enforced')) {
				groupColor = 'enforced';
			} else if (validOptions.some((opt: any) => opt.level === 'Warning')) {
				groupColor = 'warning';
			}
			
			// Create group node with same parent as target course
			const groupNode: GraphNode = {
				data: {
					id: groupId,
					type: 'group',
					label: `Choose ${requisite.needs || 1}`,
					groupColor: groupColor,
					options: validOptions,
					parent: targetCourseParent // Set same parent as target course
				}
			};
			nodes.push(groupNode);
			
			// Connect group to target course
			const edgeType: 'enforced' | 'warning' | 'recommended' = groupColor;
			edges.push({
				data: {
					id: `${groupId}-${targetCourseId}`,
					source: groupId,
					target: targetCourseId,
					type: edgeType
				}
			});
			
			// Connect each option to the group
			validOptions.forEach((option: any) => {
				const isCompleted = getCompletedCourseSource(option.course) !== null;
				const optionEdgeType: 'enforced' | 'warning' | 'recommended' = 
					option.level === 'Enforced' ? 'enforced' : 
					option.level === 'Warning' ? 'warning' : 'recommended';
				
				edges.push({
					data: {
						id: `${option.course}-${groupId}`,
						source: option.course,
						target: groupId,
						type: optionEdgeType
						// Remove fromCompleted to let the base edge color show through
					}
				});
			});
		}
	}
	
	return { edges, nodes, groupCounter };
}
