import type { Major } from '../../../lib/types.js';
import { loadMajor, majorIdToDisplayName } from '../../../lib/services/data/loadMajors.js';
import { error } from '@sveltejs/kit';

export const load = async ({ params, fetch }: { params: { majorId: string }, fetch: typeof globalThis.fetch }) => {
	const { majorId } = params;
	
	if (!majorId) {
		throw error(400, 'Major ID is required');
	}
	
	try {
		const major = await loadMajor(majorId, fetch);
		
		if (!major) {
			const displayName = majorIdToDisplayName(majorId);
			throw error(404, `Major "${displayName}" not found`);
		}
		
		return {
			major,
			majorId
		};
	} catch (err) {
		console.error('Error loading major:', err);
		if (err instanceof Error && 'status' in err) {
			throw err; // Re-throw SvelteKit errors
		}
		throw error(500, 'Failed to load major data');
	}
};
