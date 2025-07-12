/**
 * Major Graph Service
 * Builds graph nodes and edges from major requirement data using compound nodes
 * Leverages the modular graph infrastructure for consistency
 */

import type { Major, MajorRequirement, MajorSection } from '../../types.js';
import type { GraphNode, GraphEdge, GraphBuildOptions, GraphBuildResult } from '../graph/types.js';
import { loadCourses } from '../data/loadCourses.js';
import { schedulingService } from '../shared/schedulingService.js';
import { shouldShowCourse } from '../graph/utils.js';

interface MajorGraphOptions extends Partial<GraphBuildOptions> {
	// Additional options specific to major graphs
	groupSectionsByColor?: boolean;
	showSectionHeaders?: boolean;
	layoutBySections?: boolean;
	compoundNodeState?: Map<string, boolean>;
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
): Promise<GraphBuildResult & { parentChildMap: Map<string, string[]> }> {
	console.log('buildMajorGraph called with major:', major.name);
	
	const {
		showWarnings = true,
		showRecommended = true,
		userCompletedCourses = new Set(),
		showCompletedCourses = true,
		groupSectionsByColor = true,
		showSectionHeaders = true,
		layoutBySections = true,
		compoundNodeState = new Map()
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
	
	// Track parent-child relationships
	const parentChildMap = new Map<string, string[]>();

	// Track unique courses to avoid duplicates
	const seenCourses = new Set<string>();
	let nodeCounter = 0;
	
	// We'll calculate prerequisites dynamically based on which courses are actually visible
	// No more global prerequisite calculation

	console.log('Processing', major.sections.length, 'sections');

	// Process each section as a compound node
	major.sections.forEach((section, sectionIndex) => {
		console.log(`Processing section ${sectionIndex}: ${section.title}`);
		const sectionColor = sectionColors[sectionIndex];
		const sectionId = `section-${section.id}`;
		const isOpen = compoundNodeState.get(sectionId) ?? true;
		
		// Create compound node for the section with expand/collapse indicator
		const sectionNode: GraphNode = {
			data: {
				id: sectionId,
				type: 'section',
				label: isOpen ? `▼ ${section.title}` : `▶ ${section.title}`,
				sectionId: section.id,
				isOpen,
				backgroundColor: `rgba(${hexToRgb(sectionColor)}, 0.2)`,
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
			nodeCounter,
			isOpen,
			compoundNodeState,
			parentChildMap
		);

		nodes.push(...sectionNodes.nodes);
		edges.push(...sectionNodes.edges);
		nodeCounter = sectionNodes.nodeCounter;
	});

	console.log('Graph building complete. Total nodes:', nodes.length, 'Total edges:', edges.length);
	
	// Add prerequisite courses from closed sections if they're needed by visible courses
	console.log('Adding required prerequisite courses...');
	console.log('Compound node state:', Object.fromEntries(compoundNodeState));
	const prerequisiteNodes = addRequiredPrerequisiteCourses(
		nodes, 
		major,
		courseMap, 
		compoundNodeState,
		userCompletedCourses,
		showCompletedCourses,
		seenCourses
	);
	nodes.push(...prerequisiteNodes);
	
	// Add prerequisite edges between courses in the major
	console.log('Adding prerequisite edges...');
	const prerequisiteEdges = addPrerequisiteEdges(nodes, courseMap, userCompletedCourses, {
		showWarnings,
		showRecommended,
		showCompletedCourses
	});
	edges.push(...prerequisiteEdges);
	
	console.log('Final graph with prerequisites. Total nodes:', nodes.length, 'Total edges:', edges.length);
	
	return {
		nodes,
		edges,
		parentChildMap
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
	startNodeCounter: number,
	isOpen: boolean,
	compoundNodeState: Map<string, boolean>,
	parentChildMap: Map<string, string[]>
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
			
			// Always show courses when the section is open
			// When section is closed, we'll determine later if this course should be shown
			// based on whether it's needed as a prerequisite for visible courses
			if (!isOpen) {
				// For now, don't show courses when section is closed
				// The prerequisite logic will add them back if needed
				return;
			}
			
			seenCourses.add(courseId);

			const course = courseMap.get(courseId);
			const isCompleted = schedulingService.getCompletedCourseSource(courseId) !== null;
			
			// Skip completed courses if showCompletedCourses is false
			if (!shouldShowCourse(courseId, showCompletedCourses, (id) => schedulingService.getCompletedCourseSource(id) !== null)) {
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
						const isCompleted = schedulingService.getCompletedCourseSource(courseId) !== null;
						if (shouldShowCourse(courseId, showCompletedCourses, (id) => schedulingService.getCompletedCourseSource(id) !== null)) {
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
			
			// Check if this group should be open or closed
			// If not already in state, determine default state
			let isOpen = compoundNodeState.get(groupId);
			if (isOpen === undefined) {
				isOpen = !shouldGroupBeClosedByDefault(requirement);
				compoundNodeState.set(groupId, isOpen);
			}
			
			// Create label: use title if available, otherwise just the count
			const baseLabel = requirement.title 
				? `${requirement.title}: Select ${requirement.needs}`
				: `Select ${requirement.needs}`;
			const groupLabel = isOpen ? `▼ ${baseLabel}` : `▶ ${baseLabel}`;
			
			const groupNode: GraphNode = {
				data: {
					id: groupId,
					type: 'group',
					label: groupLabel,
					options: requirement.options,
					sectionId: section.id,
					isOpen,
					isCompoundGroup: true, // Flag to maintain rectangle shape when collapsed
					parent: parentNodeId, // Set parent for compound structure
					backgroundColor: `rgba(${hexToRgb(sectionColor)}, 0.1)`,
					borderColor: sectionColor
				}
			};

			nodes.push(groupNode);
			
			// Track parent-child relationship
			if (!parentChildMap.has(parentNodeId)) {
				parentChildMap.set(parentNodeId, []);
			}
			parentChildMap.get(parentNodeId)!.push(groupId);

			// Only process group options if the group is open
			if (isOpen) {
				// Process group options with the group as parent
				requirement.options.forEach((option, optionIndex) => {
					processRequirement(option, groupId, depth + 1, optionIndex);
				});
			}
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
	options: { showWarnings: boolean, showRecommended: boolean, showCompletedCourses: boolean } = { showWarnings: true, showRecommended: true, showCompletedCourses: true }
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
				courseMap,
				courseToParentMap,
				options.showCompletedCourses,
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
	courseMap: Map<string, any>,
	courseToParentMap: Map<string, string>,
	showCompletedCourses: boolean,
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
			// Check if this would be a cross-category edge with a completed course
			const sourceParent = courseToParentMap.get(requisite.course);
			const targetParent = courseToParentMap.get(targetCourseId);
			const shouldHide = sourceParent && targetParent && sourceParent !== targetParent && 
							  (userCompletedCourses.has(requisite.course) || userCompletedCourses.has(targetCourseId));
			
			if (!shouldHide) {
				const edgeType: 'enforced' | 'warning' | 'recommended' = 
					requisite.level === 'Enforced' ? 'enforced' : 
					requisite.level === 'Warning' ? 'warning' : 'recommended';
				
				edges.push({
					data: {
						id: `${requisite.course}-${targetCourseId}`,
						source: requisite.course,
						target: targetCourseId,
						type: edgeType
					}
				});
			} else {
				console.log(`Hiding cross-category edge: ${requisite.course} -> ${targetCourseId}`);
			}
		}
	} else if (requisite.type === 'Group') {
		// Handle prerequisite groups using sophisticated satisfaction logic from prerequisite graph
		const validOptions = requisite.options?.filter((option: any) => {
			if (option.type === 'Group') return false; // Skip nested groups for now
			
			const isValidOption = (option.type === 'Requisite' && 
				(option.level === 'Enforced' || (showWarnings && option.level === 'Warning'))) ||
				(showRecommended && option.type === 'Recommended');
				
			if (!isValidOption || !majorCourseIds.has(option.course)) return false;
			
			// Filter out cross-category options with completed courses
			const sourceParent = courseToParentMap.get(option.course);
			const targetParent = courseToParentMap.get(targetCourseId);
			const shouldHide = sourceParent && targetParent && sourceParent !== targetParent && 
							  (userCompletedCourses.has(option.course) || userCompletedCourses.has(targetCourseId));
			
			if (shouldHide) {
				console.log(`Filtering out cross-category group option: ${option.course} -> ${targetCourseId}`);
				return false;
			}
			
			return true;
		});
		
		if (validOptions && validOptions.length > 0) {
			const groupId = `prereq-group-${groupCounter++}`;
			const group = { needs: requisite.needs || 1, options: validOptions };
			
			// Check for completed courses and equivalent handling
			const actuallyCompletedCourses: any[] = [];
			
			validOptions.forEach((option: any) => {
				if (userCompletedCourses.has(option.course)) {
					actuallyCompletedCourses.push(option);
				}
			});

			// Check if group contains equivalent courses
			let hasEquivalentCourses = false;
			if (actuallyCompletedCourses.length > 0) {
				for (let i = 0; i < validOptions.length && !hasEquivalentCourses; i++) {
					const courseA = courseMap.get(validOptions[i].course);
					if (courseA?.equivalentCourses) {
						for (let j = i + 1; j < validOptions.length; j++) {
							if (courseA.equivalentCourses.includes(validOptions[j].course)) {
								hasEquivalentCourses = true;
								break;
							}
						}
					}
				}
			}

			const remainingNeeds = Math.max(0, group.needs - actuallyCompletedCourses.length);

			// If group contains equivalent courses, handle specially
			if (hasEquivalentCourses && actuallyCompletedCourses.length > 0) {
				if (remainingNeeds === 0) {
					// Group fully satisfied, no diamond needed
					// Connect completed courses directly to target if showCompletedCourses
					if (showCompletedCourses) {
						actuallyCompletedCourses.forEach(option => {
							const edgeType: 'enforced' | 'warning' | 'recommended' = 
								option.type === 'Recommended' ? 'recommended' :
								option.level === 'Enforced' ? 'enforced' : 'warning';
							
							edges.push({
								data: {
									id: `${option.course}-${targetCourseId}`,
									source: option.course,
									target: targetCourseId,
									type: edgeType,
									fromCompleted: true
								}
							});
						});
					}
					return { edges, nodes, groupCounter };
				} else {
					// Group partially satisfied, show incomplete non-equivalent courses
					const incompleteCourses: any[] = [];
					
					validOptions.forEach((option: any) => {
						if (userCompletedCourses.has(option.course)) return;
						
						// Check if this course is equivalent to any completed course
						let isEquivalentToCompleted = false;
						for (const completedOption of actuallyCompletedCourses) {
							const completedCourse = courseMap.get(completedOption.course);
							if (completedCourse?.equivalentCourses?.includes(option.course)) {
								isEquivalentToCompleted = true;
								break;
							}
							const optionCourse = courseMap.get(option.course);
							if (optionCourse?.equivalentCourses?.includes(completedOption.course)) {
								isEquivalentToCompleted = true;
								break;
							}
						}
						
						if (!isEquivalentToCompleted) {
							incompleteCourses.push(option);
						}
					});

					if (incompleteCourses.length === 0) {
						return { edges, nodes, groupCounter };
					}

					// Determine group color based on incomplete courses
					let groupColor: 'enforced' | 'warning' | 'recommended' = 'recommended';
					for (const option of incompleteCourses) {
						if (option.type === 'Requisite') {
							if (option.level === 'Enforced') {
								groupColor = 'enforced';
								break;
							} else if (option.level === 'Warning' && showWarnings) {
								groupColor = 'warning';
							}
						}
					}

					// Create group node for remaining requirements
					const groupNode: GraphNode = {
						data: {
							id: groupId,
							type: 'group',
							label: `Needs: ${remainingNeeds}`,
							groupColor: groupColor,
							options: incompleteCourses,
							isCompoundGroup: false,
							parent: targetCourseParent
						}
					};
					nodes.push(groupNode);

					// Connect group to target course
					edges.push({
						data: {
							id: `${groupId}-${targetCourseId}`,
							source: groupId,
							target: targetCourseId,
							type: groupColor
						}
					});

					// Connect incomplete courses to group
					incompleteCourses.forEach(option => {
						const edgeType: 'enforced' | 'warning' | 'recommended' = 
							option.type === 'Recommended' ? 'recommended' :
							option.level === 'Enforced' ? 'enforced' : 'warning';
						
						edges.push({
							data: {
								id: `${option.course}-${groupId}`,
								source: option.course,
								target: groupId,
								type: edgeType
							}
						});
					});

					// Connect completed courses directly to target if showCompletedCourses
					if (showCompletedCourses) {
						actuallyCompletedCourses.forEach(option => {
							const edgeType: 'enforced' | 'warning' | 'recommended' = 
								option.type === 'Recommended' ? 'recommended' :
								option.level === 'Enforced' ? 'enforced' : 'warning';
							
							edges.push({
								data: {
									id: `${option.course}-${targetCourseId}`,
									source: option.course,
									target: targetCourseId,
									type: edgeType,
									fromCompleted: true
								}
							});
						});
					}

					return { edges, nodes, groupCounter };
				}
			}

			// Normal group processing (no equivalent courses or no completed courses)
			const completedCourses: any[] = [];
			const incompleteCourses: any[] = [];
			
			validOptions.forEach((option: any) => {
				if (userCompletedCourses.has(option.course)) {
					completedCourses.push(option);
				} else {
					incompleteCourses.push(option);
				}
			});

			const finalRemainingNeeds = Math.max(0, group.needs - completedCourses.length);
			
			if (finalRemainingNeeds === 0) {
				// Group fully satisfied, connect completed courses directly
				if (showCompletedCourses) {
					completedCourses.forEach(option => {
						const edgeType: 'enforced' | 'warning' | 'recommended' = 
							option.type === 'Recommended' ? 'recommended' :
							option.level === 'Enforced' ? 'enforced' : 'warning';
						
						edges.push({
							data: {
								id: `${option.course}-${targetCourseId}`,
								source: option.course,
								target: targetCourseId,
								type: edgeType,
								fromCompleted: true
							}
						});
					});
				}
				return { edges, nodes, groupCounter };
			}

			// Group not fully satisfied, create diamond group
			const allCoursesToShow = showCompletedCourses ? 
				[...completedCourses, ...incompleteCourses] : 
				incompleteCourses;
			
			if (allCoursesToShow.length === 0) {
				return { edges, nodes, groupCounter };
			}

			// Determine group color based on incomplete courses
			let groupColor: 'enforced' | 'warning' | 'recommended' = 'recommended';
			for (const option of incompleteCourses) {
				if (option.type === 'Requisite') {
					if (option.level === 'Enforced') {
						groupColor = 'enforced';
						break;
					} else if (option.level === 'Warning' && showWarnings) {
						groupColor = 'warning';
					}
				}
			}

			// Create group node
			const groupNode: GraphNode = {
				data: {
					id: groupId,
					type: 'group',
					label: `Needs: ${finalRemainingNeeds}`,
					groupColor: groupColor,
					options: validOptions,
					isCompoundGroup: false,
					parent: targetCourseParent
				}
			};
			nodes.push(groupNode);

			// Connect group to target course
			edges.push({
				data: {
					id: `${groupId}-${targetCourseId}`,
					source: groupId,
					target: targetCourseId,
					type: groupColor
				}
			});

			// Connect incomplete courses to group
			incompleteCourses.forEach(option => {
				const edgeType: 'enforced' | 'warning' | 'recommended' = 
					option.type === 'Recommended' ? 'recommended' :
					option.level === 'Enforced' ? 'enforced' : 'warning';
				
				edges.push({
					data: {
						id: `${option.course}-${groupId}`,
						source: option.course,
						target: groupId,
						type: edgeType
					}
				});
			});

			// Connect completed courses to group if showCompletedCourses
			if (showCompletedCourses) {
				completedCourses.forEach(option => {
					const edgeType: 'enforced' | 'warning' | 'recommended' = 
						option.type === 'Recommended' ? 'recommended' :
						option.level === 'Enforced' ? 'enforced' : 'warning';
					
					edges.push({
						data: {
							id: `${option.course}-${groupId}`,
							source: option.course,
							target: groupId,
							type: edgeType,
							fromCompleted: true
						}
					});
				});
			}
		}
	}
	
	return { edges, nodes, groupCounter };
}

/**
 * Collect all course IDs from a major section
 */
function collectCoursesFromSection(section: MajorSection, courseSet: Set<string>): void {
	function collectFromRequirement(requirement: MajorRequirement): void {
		if (requirement.type === 'course') {
			courseSet.add(requirement.courseId);
		} else if (requirement.type === 'group') {
			requirement.options.forEach(option => collectFromRequirement(option));
		}
	}
	
	section.requirements.forEach(requirement => collectFromRequirement(requirement));
}

/**
 * Collect prerequisite course IDs from course requirements (recursive - gets entire dependency chain)
 */
function collectPrerequisiteCourses(requisites: any[], courseSet: Set<string>): void {
	function collectFromRequisite(requisite: any): void {
		if (requisite.type === 'Group') {
			requisite.options.forEach((option: any) => collectFromRequisite(option));
		} else if (requisite.course) {
			courseSet.add(requisite.course);
		}
	}
	
	requisites.forEach(requisite => collectFromRequisite(requisite));
}

/**
 * Add prerequisite courses from closed sections if they're needed by visible courses
 */
function addRequiredPrerequisiteCourses(
	currentNodes: GraphNode[],
	major: Major,
	courseMap: Map<string, any>,
	compoundNodeState: Map<string, boolean>,
	userCompletedCourses: Set<string>,
	showCompletedCourses: boolean,
	seenCourses: Set<string>
): GraphNode[] {
	console.log('Finding prerequisites for visible courses...');
	
	// Get all currently visible course nodes
	const visibleCourses = currentNodes
		.filter(node => node.data.type === 'course')
		.map(node => node.data.id);
	
	console.log('Visible courses:', visibleCourses);
	
	// Collect immediate prerequisites for all visible courses
	const requiredPrerequisites = new Set<string>();
	
	for (const courseId of visibleCourses) {
		const course = courseMap.get(courseId);
		if (course && course.requisites) {
			collectImmediatePrerequisiteCourses(course.requisites, requiredPrerequisites);
		}
	}
	
	console.log('Required prerequisites:', Array.from(requiredPrerequisites));
	
	// Find which prerequisites are not already visible
	const missingPrerequisites = Array.from(requiredPrerequisites)
		.filter(prereqId => !seenCourses.has(prereqId));
	
	console.log('Missing prerequisites that need to be added:', missingPrerequisites);
	
	// Create nodes for missing prerequisites
	const prerequisiteNodes: GraphNode[] = [];
	
	for (const prereqId of missingPrerequisites) {
		const course = courseMap.get(prereqId);
		if (!course) {
			console.warn(`Course ${prereqId} not found in course map`);
			continue;
		}
		
		// Check if we should show this course based on completion status
		if (!shouldShowCourse(prereqId, showCompletedCourses, (id) => schedulingService.getCompletedCourseSource(id) !== null)) {
			continue;
		}
		
		// Find which section this course belongs to
		const parentSection = findCourseSection(major, prereqId);
		if (!parentSection) {
			console.warn(`Could not find section for course ${prereqId}`);
			continue;
		}
		
		const sectionId = `section-${parentSection.id}`;
		const isCompleted = schedulingService.getCompletedCourseSource(prereqId) !== null;
		
		// Enhancement: When showCompletedCourses is true, don't show completed prerequisites 
		// from collapsed sections as "critical" - they're not actionable
		if (showCompletedCourses && isCompleted) {
			const isSectionClosed = compoundNodeState.get(sectionId) === false;
			if (isSectionClosed) {
				console.log(`Skipping completed prerequisite ${prereqId} from closed section ${parentSection.id}`);
				continue;
			}
		}
		
		// Create the prerequisite course node
		const prereqNode: GraphNode = {
			data: {
				id: prereqId,
				type: 'course',
				label: prereqId,
				course: course,
				sectionId: parentSection.id,
				parent: sectionId // Attach to the section even if it's closed
			}
		};
		
		// Only set completed attribute if the course is actually completed
		if (isCompleted) {
			prereqNode.data.completed = true;
		}
		
		prerequisiteNodes.push(prereqNode);
		seenCourses.add(prereqId);
	}
	
	console.log(`Added ${prerequisiteNodes.length} prerequisite nodes`);
	return prerequisiteNodes;
}

/**
 * Find which section a course belongs to in the major
 */
function findCourseSection(major: Major, courseId: string): MajorSection | null {
	for (const section of major.sections) {
		if (doesSectionContainCourse(section.requirements, courseId)) {
			return section;
		}
	}
	return null;
}

/**
 * Check if a section's requirements contain a specific course
 */
function doesSectionContainCourse(requirements: MajorRequirement[], courseId: string): boolean {
	for (const req of requirements) {
		if (req.type === 'course' && req.courseId === courseId) {
			return true;
		} else if (req.type === 'group') {
			if (doesSectionContainCourse(req.options, courseId)) {
				return true;
			}
		}
	}
	return false;
}

/**
 * Collect IMMEDIATE prerequisite course IDs only (non-recursive)
 */
function collectImmediatePrerequisiteCourses(requisites: any[], courseSet: Set<string>): void {
	function collectFromRequisite(requisite: any): void {
		if (requisite.type === 'Group') {
			requisite.options.forEach((option: any) => collectFromRequisite(option));
		} else if (requisite.course) {
			courseSet.add(requisite.course);
			// Do NOT recursively collect prerequisites of this course
		}
	}
	
	requisites.forEach(requisite => collectFromRequisite(requisite));
}

/**
 * Helper function to convert hex color to RGB values
 * @param hex - Hex color string (e.g., "#3b82f6")
 * @returns RGB values as string (e.g., "59, 130, 246")
 */
function hexToRgb(hex: string): string {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	if (!result) {
		return '0, 0, 0'; // Default to black if parsing fails
	}
	
	const r = parseInt(result[1], 16);
	const g = parseInt(result[2], 16);
	const b = parseInt(result[3], 16);
	
	return `${r}, ${g}, ${b}`;
}

/**
 * Determines if a group should be closed by default
 */
function shouldGroupBeClosedByDefault(group: any): boolean {
	// Close groups with many options (more than 8 items) by default
	if (group.options && group.options.length > 8) {
		return true;
	}
	
	// Close groups with "elective" in the title (case insensitive)
	if (group.title && group.title.toLowerCase().includes('elective')) {
		return true;
	}
	
	// Keep other groups open by default
	return false;
}
