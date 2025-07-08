#!/usr/bin/env node
/**
 * Test script to validate the major loading service
 * Run with: npm run test:majors
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { majorNameToId, majorIdToDisplayName, getAllMajorCourses } from '../src/lib/services/loadMajors.js';

// Import validation function - we'll need to make it public for testing
// For now, let's inline a simple validation

async function testMajorService() {
	console.log('🧪 Testing Major Loading Service...\n');

	// Test 1: URL encoding round-trip
	console.log('Test 1: URL Encoding Round-Trip');
	const testNames = [
		'Mathematics BS',
		'Computer Science and Engineering BS',
		'Mathematics/Economics BS',
		"Women's Studies BA",
		'Physics (B.S.)',
		'Music Performance & Recording Arts (B.M.)'
	];

	for (const name of testNames) {
		const id = majorNameToId(name);
		const backToName = majorIdToDisplayName(id);
		const passed = name === backToName;
		console.log(`  ${passed ? '✅' : '❌'} "${name}" -> "${id}" -> "${backToName}"`);
	}
	console.log();

	// Test 2: Load and validate Mathematics BS major from file
	console.log('Test 2: Load and Validate Mathematics BS Major');
	try {
		const majorFilePath = join(process.cwd(), 'static', 'majors', 'Mathematics BS.json');
		const majorData = JSON.parse(readFileSync(majorFilePath, 'utf-8'));
		
		console.log(`   ✅ Successfully loaded: ${majorData.name}`);
		console.log(`   College: ${majorData.college}`);
		console.log(`   Department: ${majorData.department}`);
		console.log(`   Degree: ${majorData.degreeObjective}`);
		console.log(`   Sections: ${majorData.sections.length}`);

		// Test section structure
		for (const section of majorData.sections) {
			console.log(`   Section: ${section.title} (${section.requirements.length} requirements)`);
			
			// Count course requirements vs groups
			let courseCount = 0;
			let groupCount = 0;
			
			for (const req of section.requirements) {
				if (req.type === 'course') {
					courseCount++;
				} else if (req.type === 'group') {
					groupCount++;
					console.log(`      Group "${req.title}": needs ${req.needs} from ${req.options.length} options`);
				}
			}
			
			console.log(`      Courses: ${courseCount}, Groups: ${groupCount}`);
		}

		// Test 3: Get all courses
		console.log('\nTest 3: Extract All Required Courses');
		const allCourses = getAllMajorCourses(majorData);
		console.log(`  Found ${allCourses.length} total course references:`);
		console.log(`  Sample: ${allCourses.slice(0, 5).join(', ')}...`);
		
	} catch (error) {
		console.log(`❌ Error loading major: ${error}`);
	}

	console.log('\nMajor service tests completed!');
}



testMajorService();
