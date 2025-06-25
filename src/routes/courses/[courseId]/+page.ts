export const load = ({ params }: { params: { courseId: string } }) => {
  // Convert URL format (MATH156) to course ID format (MATH 156) by inserting a space before the digits
  const courseId = params.courseId.replace(/([A-Z]+)(\d+)/, '$1 $2');
  
  return {
    courseId: courseId
  };
};