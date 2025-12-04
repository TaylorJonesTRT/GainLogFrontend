import { apiRequest } from '@/api';

export interface Workout {
    id: number;
    title: string | null;
    created_at: string;
    updated_at: string;
    completed_at: string | null;
    workout_sets?: WorkoutSet[];
}

export interface WorkoutSet {
    id: number;
    workout_id: number;
    exercise_id: number;
    weight: number | null;
    reps: number | null;
    set_order: number;
    notes: string | null;
    rest_time: number | null;
    exercise?: Exercise;
}

export interface Exercise {
    id?: number;
    name: string;
    category?: string;
}

export interface PaginationMeta {
    current_page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
    has_next_page: boolean;
    has_prev_page: boolean;
}

export interface PaginatedWorkoutsResponse {
    workouts: Workout[];
    pagination: PaginationMeta;
}

export interface PaginationParams {
    page?: number;
    per_page?: number;
}

export const workoutService = {
    async getAll(params?: PaginationParams): Promise<PaginatedWorkoutsResponse> {
        const queryParams = new URLSearchParams();
        if (params?.page) {
            queryParams.append('page', params.page.toString());
        }
        if (params?.per_page) {
            queryParams.append('per_page', params.per_page.toString());
        }
        const queryString = queryParams.toString();
        const url = `workouts${queryString ? `?${queryString}` : ''}`;

        const response = await apiRequest(url, 'GET');

        if (response.ok) {
            return await response.json();
        }

        throw new Error('Failed to fetch workouts');
    },

    async getRecent(limit: number = 6): Promise<Workout[]> {
        const response = await apiRequest(`workouts?limit=${limit}`, 'GET');

        if (!response.ok) {
            throw new Error('Failed to fetch recent workouts');
        }

        return response.json();
    },

    async getById(id: string | number): Promise<Workout> {
        const response = await apiRequest(`workouts/${id}`, 'GET');

        if (response.ok) {
            return await response.json();
        }

        throw new Error('Failed to fetch workout');
    },

    async create(exerciseIds: number[]): Promise<Workout> {
        const response = await apiRequest('workouts', 'POST', {
            workout: {
                exercise_ids: exerciseIds,
                date: new Date().toISOString().split('T')[0]
            }
        });
        if (response.ok) {
            return await response.json();
        }
        throw new Error('Failed to create workout');
    },

    async update(id: number, data: Partial<Workout>): Promise<Workout> {
        const response = await apiRequest(`workouts/${id}`, 'PATCH', {
            workout: data
        });
        if (response.ok) {
            return await response.json();
        }
        throw new Error('Failed to update workout');
    },

    async complete(id: number): Promise<Workout> {
        return this.update(id, { completed_at: new Date().toISOString() });
    },

    async delete(id: number): Promise<void> {
        const response = await apiRequest(`workouts/${id}`, 'DELETE');
        if (!response.ok) {
            throw new Error('Failed to delete workout');
        }
    }
};
