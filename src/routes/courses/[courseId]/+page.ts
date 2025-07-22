import { error } from '@sveltejs/kit';
import { getCourseIndex } from '../../../lib/data-layer/api.js';

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
  } catch (error) {
    // If course index fails to load, use the simple conversion
    courseId = params.courseId.replace(/([A-Z]+)(\d+)/, '$1 $2');
  }
  
  // Get query parameters to determine what prerequisites to show
  const showWarnings = url.searchParams.get('warnings') !== 'false';
  
  return {
    courseId: courseId,
    showWarnings
  };
};