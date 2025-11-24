import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { apiRequest } from '@/api';

export const ssr = false;

export const load: PageLoad = async ({ params }) => {
    try {
        const response = await apiRequest(`workouts/${params.id}`)

        if (!response.ok) {
            if (response.status === 404) {
                throw error(404, 'Workout not found');
            }
            throw error(response.status, 'Failed to load workout');
        }

        const workout = await response.json();

        return {
            workout
        };
    } catch (err) {
        if (err instanceof Error && 'status' in err) {
            throw err; // Re-throw SvelteKit errors
        }
        throw error(500, 'Failed to load workout');
    }
};
