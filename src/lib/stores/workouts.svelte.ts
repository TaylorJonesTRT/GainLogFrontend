import { workoutService, type Workout, type WorkoutSet, type PaginationMeta, type PaginationParams } from '$lib/services/workouts';

class WorkoutsStore {
    workouts = $state<Workout[]>([]);
    currentWorkout = $state<Workout | null>(null);
    recentWorkouts = $state<Workout[]>([]);
    pagination = $state<PaginationMeta | null>(null);
    loading = $state(false);
    error = $state<string | null>(null);

    async fetchAll(params?: PaginationParams) {
        this.loading = true;
        this.error = null;

        try {
            const response = await workoutService.getAll(params);
            this.workouts = response.workouts;
            this.pagination = response.pagination;
        } catch (err) {
            this.error = err instanceof Error ? err.message : 'Failed to load workouts';
            console.error('Failed to load workouts:', err);
        } finally {
            this.loading = false;
        }
    }

    async fetchRecent(limit: number = 5) {
        this.loading = true;
        this.error = null;

        try {
            const response = await workoutService.getAll({ page: 1, per_page: limit });
            this.workouts = response.workouts;
        } catch (err) {
            this.error = err instanceof Error ? err.message : 'Failed to load workouts';
        } finally {
            this.loading = false;
        }
    }

    async fetchById(id: string | number) {
        this.loading = true;
        this.error = null;

        try {
            this.currentWorkout = await workoutService.getById(id);
        } catch (err) {
            this.error = err instanceof Error ? err.message : 'Failed to load workout';
            console.error('Failed to load workout:', err);
        } finally {
            this.loading = false;
        }
    }

    async create(title: string, exerciseIds: number[]) {
        this.loading = true;
        this.error = null;
        try {
            const workout = await workoutService.create(exerciseIds);
            this.workouts = [workout, ...this.workouts]; // Add to list
            return workout;
        } catch (err) {
            this.error = err instanceof Error ? err.message : 'Failed to create workout';
            console.error('Failed to create workout:', err);
            throw err;
        } finally {
            this.loading = false;
        }
    }

    async update(id: number, data: Partial<Workout>) {
        try {
            const updated = await workoutService.update(id, data);

            const index = this.workouts.findIndex(w => w.id === id);
            if (index !== -1) {
                this.workouts[index] = { ...this.workouts[index], ...updated };
            }

            if (this.currentWorkout?.id === id) {
                this.currentWorkout = { ...this.currentWorkout, ...updated };
            }

            return updated;
        } catch (err) {
            this.error = err instanceof Error ? err.message : 'Failed to update workout';
            console.error('Failed to update workout:', err);
            throw err;
        }
    }

    async complete(id: number) {
        try {
            const updated = await workoutService.complete(id);

            const index = this.workouts.findIndex(w => w.id === id);
            if (index !== -1) {
                this.workouts[index] = { ...this.workouts[index], completed_at: updated.completed_at };
            }

            if (this.currentWorkout?.id === id) {
                this.currentWorkout = { ...this.currentWorkout, completed_at: updated.completed_at };
            }

            return updated;
        } catch (err) {
            this.error = err instanceof Error ? err.message : 'Failed to complete workout';
            console.error('Failed to complete workout:', err);
            throw err;
        }
    }

    async delete(id: number) {
        try {
            await workoutService.delete(id);

            this.workouts = this.workouts.filter(w => w.id !== id);

            if (this.currentWorkout?.id === id) {
                this.currentWorkout = null;
            }
        } catch (err) {
            this.error = err instanceof Error ? err.message : 'Failed to delete workout';
            console.error('Failed to delete workout:', err);
            throw err;
        }
    }

    updateCurrentWorkoutSets(sets: any[]) {
        if (this.currentWorkout) {
            this.currentWorkout = {
                ...this.currentWorkout,
                workout_sets: sets
            };
        }
    }

    clearError() {
        this.error = null;
    }
}

export const workoutsStore = new WorkoutsStore();
