<script lang="ts">
	import { apiRequest } from '@/api';
	import Button from '@/components/ui/button/button.svelte';
	import ExerciseSelector from '$lib/components/ExerciseSelector.svelte';
	import { Check } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	let items: Array<{ id: number; name: string }> = $state([]);
	let isOpen = $state(false);
	let isLoading = $state(false);
	let isDrawerOpen = $state(false);
	let isCreatingWorkout = $state(false);

	async function handleExercisesSelected(exerciseIds: number[]) {
		if (exerciseIds.length === 0) return;

		isCreatingWorkout = true;

		const requestBody = {
			workout: {
				exercise_ids: exerciseIds,
				date: new Date().toISOString().split('T')[0]
			}
		};

		try {
			const response = await apiRequest('workouts', 'POST', requestBody);

			if (response.ok) {
				const workout = await response.json();
				goto(`/workout/${workout.id}`);
			} else {
				console.error('Failed to create workout');
			}
		} catch (error) {
			console.error('Error creating workout:', error);
		} finally {
			isCreatingWorkout = false;
		}
	}
</script>

<div class="flex flex-col">
	<h1 class="text-3xl font-bold">GainLog</h1>

	<div class="mt-10">
		<h2 class="text-xl font-semibold">Quickstart</h2>
		<Button onclick={() => (isDrawerOpen = true)} disabled={isCreatingWorkout} class="mt-5 w-full">
			Start an empty workout
		</Button>
	</div>

	<div class="mt-10">
		<h2 class="text-xl font-semibold">Most Recent Workouts</h2>
	</div>

	<ExerciseSelector
		bind:open={isDrawerOpen}
		onConfirm={handleExercisesSelected}
		title="Select Exercises"
		description="Choose exercises for your workout"
		confirmText="Start Workout"
	/>
</div>
