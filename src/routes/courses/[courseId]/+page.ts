import { getCourseIndex, getCourseById } from '../../../lib/data-layer/api.js';
import { error } from '@sveltejs/kit';

export const load = async ({ params, fetch, url }: { 
  params: { courseId: string }, 
  fetch: typeof globalThis.fetch, 
  url: URL 
}) => {
  // Convert URL format (MATH156, AEROST130A) to course ID format (MATH 156, AERO ST 130A)
  let courseId = params.courseId;
  
  // Try to find the course in the index first (for courses with spaces or special chars in subject codes)
  try {
    const courseIndex = await getCourseIndex(fetch);
    // Find a course that matches when all non-alphanumeric characters are removed
    const compressedParam = params.courseId.replace(/[^A-Z0-9]/g, '');
    
    const matchingCourse = courseIndex.find((course: any) => 
      course.id.replace(/[^A-Z0-9]/g, '') === compressedParam
    );
    
    if (matchingCourse) {
      courseId = matchingCourse.id;
    } else {
      // Fallback to the simple conversion for cases not in the index
      courseId = params.courseId.replace(/([A-Z]+)(\d+)/, '$1 $2');
    }
  } catch {
    // If course index fails to load, use the simple conversion
    courseId = params.courseId.replace(/([A-Z]+)(\d+)/, '$1 $2');
  }
  
  // Now load the actual course data
  try {
    const course = await getCourseById(courseId, fetch);
    
    if (!course) {
      throw error(404, 'That course doesn\'t exist!');
    }
    
    // Get query parameters to determine what prerequisites to show
    const showWarnings = url.searchParams.get('warnings') !== 'false';
    
    return {
      course,
      courseId: courseId,
      showWarnings
    };
  } catch (err) {
    // Check if it's a SvelteKit HttpError
    if (err && typeof err === 'object' && 'status' in err && 'body' in err) {
      throw err; // Re-throw SvelteKit errors (HttpError)
    }
    throw error(500, 'Failed to load course data');
  }
};