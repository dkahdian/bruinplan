/**
 * Drag and drop utilities for course scheduling
 */

/**
 * Create a standardized drag image for courses
 */
export function createCourseDragImage(courseId: string): HTMLElement {
  const dragImg = document.createElement('div');
  dragImg.className = 'bg-purple-600 text-purple-100 px-3 py-1 rounded text-sm font-medium shadow-lg border border-purple-700';
  dragImg.textContent = courseId;
  dragImg.style.position = 'absolute';
  dragImg.style.top = '-1000px';
  dragImg.style.left = '-1000px';
  dragImg.style.zIndex = '1000';
  return dragImg;
}

/**
 * Handle drag start for courses with standardized setup
 */
export function handleCourseDragStart(
  event: DragEvent, 
  courseId: string, 
  onDragStart?: (courseId: string) => void
): void {
  if (!event.dataTransfer) return;
  
  // Notify parent of drag start
  onDragStart?.(courseId);
  
  // Create and set drag image
  const dragImg = createCourseDragImage(courseId);
  document.body.appendChild(dragImg);
  
  // Set the custom drag image
  event.dataTransfer.setDragImage(dragImg, 20, 10);
  
  // Clean up the temporary drag image
  setTimeout(() => {
    if (document.body.contains(dragImg)) {
      document.body.removeChild(dragImg);
    }
  }, 0);
  
  // Set drag data
  event.dataTransfer.setData('text/plain', courseId);
  event.dataTransfer.setData('application/x-bruinplan-course', courseId);
  event.dataTransfer.effectAllowed = 'move';
}

/**
 * Handle drag end for courses with standardized cleanup
 */
export function handleCourseDragEnd(onDragEnd?: () => void): void {
  onDragEnd?.();
}
