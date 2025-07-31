import { writable } from 'svelte/store';

// Store for tracking the selected course for mobile scheduling
export const mobileSelectedCourseStore = writable<string | null>(null);

// Function to schedule a course and clear the selection
export function scheduleCourseMobile(courseId: string, quarterCode: number, schedulingService: any) {
	schedulingService.scheduleCourse(courseId, quarterCode);
	mobileSelectedCourseStore.set(null);
}
