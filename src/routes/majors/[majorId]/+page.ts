import { loadMajor, majorIdToDisplayName } from '../../../lib/data-layer/api.js';
import { error } from '@sveltejs/kit';

export const load = async ({ params, fetch }: { params: { majorId: string }, fetch: typeof globalThis.fetch }) => {
	const { majorId } = params;
	
	if (!majorId) {
		throw error(400, 'Major ID is required');
	}
	
	try {
		const major = await loadMajor(majorId, fetch);		
		if (!major) {
			throw error(404, 'That major doesn\'t exist!');
		}
		
		return {
			major,
			majorId
		};
	} catch (err) {
		console.error('Error loading major:', err);
		// Check if it's a SvelteKit HttpError
		if (err && typeof err === 'object' && 'status' in err && 'body' in err) {
			throw err; // Re-throw SvelteKit errors (HttpError)
		}
		throw error(500, 'Failed to load major data');
	}
};
