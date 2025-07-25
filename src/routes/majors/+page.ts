import { getMajorsList } from '../../lib/data-layer/api.js';
import { error } from '@sveltejs/kit';

export const load = async ({ fetch }: { fetch: typeof globalThis.fetch }) => {
	try {
		const majors = await getMajorsList(fetch);
		
		return {
			majors
		};
	} catch (err) {
		console.error('Error loading majors list:', err);
		throw error(500, 'Failed to load majors list');
	}
};
