<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { apiRequest } from '@/api';
	import { workoutsStore } from '$lib/stores/workouts.svelte';
	import Button from '@/components/ui/button/button.svelte';
	import ExerciseSelector from '$lib/components/ExerciseSelector.svelte';
	import WorkoutCard from '@/components/WorkoutCard.svelte';

	let items: Array<{ id: number; name: string }> = $state([]);
	let isOpen = $state(false);
	let isLoading = $state(false);
	let isDrawerOpen = $state(false);
	let isCreatingWorkout = $state(false);

	// Get workouts from store reactively
	const recentWorkouts = $derived(workoutsStore.workouts);
	const isLoadingWorkouts = $derived(workoutsStore.isLoading);

	onMount(() => {
		workoutsStore.fetchRecent(6);
	});

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

<div class="flex flex-col pb-24">
	<h1 class="text-3xl font-bold">GainLog</h1>

	<div class="mt-10">
		<h2 class="text-xl font-semibold">Quickstart</h2>
		<Button
			onclick={() => (isDrawerOpen = true)}
			disabled={isCreatingWorkout}
			class="mt-5 w-full cursor-pointer"
		>
			Start an empty workout
		</Button>
	</div>

	<div>
		<div class="mt-10 mb-5">
			<h2 class="text-xl font-semibold">Most Recent Workouts</h2>
		</div>

		{#if isLoadingWorkouts}
			<div class="flex items-center justify-center py-8">
				<div class="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
			</div>
		{:else if recentWorkouts.length === 0}
			<p class="text-muted-foreground">No workouts yet. Start your first workout above!</p>
		{:else}
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				{#each recentWorkouts as workout (workout.id)}
					<WorkoutCard {workout} />
				{/each}
			</div>
		{/if}
	</div>

	<ExerciseSelector
		bind:open={isDrawerOpen}
		onConfirm={handleExercisesSelected}
		title="Select Exercises"
		description="Choose exercises for your workout"
		confirmText="Start Workout"
	/>
</div>
