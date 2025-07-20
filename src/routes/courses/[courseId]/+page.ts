export const load = ({ params, url }: { params: { courseId: string }, url: URL }) => {
  // Convert URL format (MATH156) to course ID format (MATH 156) by inserting a space before the digits
  const courseId = params.courseId.replace(/([A-Z]+)(\d+)/, '$1 $2');
  
  // Get query parameters to determine what prerequisites to show
  const showWarnings = url.searchParams.get('warnings') !== 'false';
  
  return {
    courseId: courseId,
    showWarnings
  };
};