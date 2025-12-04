<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { apiRequest } from '@/api';
	import { workoutsStore } from '$lib/stores/workouts.svelte';
	import { Trash2, Check, Circle } from 'lucide-svelte';
	import ExerciseSelector from '$lib/components/ExerciseSelector.svelte';

	let isAddExerciseOpen = $state(false);
	let isEditingTitle = $state(false);
	let titleInput = $state('');
	let savingStatus = $state<'saved' | 'saving' | null>(null);
	let savingTimeout: ReturnType<typeof setTimeout>;
	let recentlyDeleted = $state<{ set: any; timeout: any } | null>(null);
	let isCompletingWorkout = $state(false);

	let workout = $derived(workoutsStore.currentWorkout);
	let loading = $derived(workoutsStore.loading);
	let errorMessage = $derived(workoutsStore.error);

	let isCompleted = $derived.by(() => {
		return Boolean(workout?.completed_at);
	});

	let existingExerciseIds = $derived(
		workout?.workout_sets ? [...new Set(workout.workout_sets.map((s: any) => s.exercise_id))] : []
	);

	let groupedExercises = $derived.by(() => {
		if (!workout?.workout_sets) return [];

		const exerciseMap = new Map();

		workout.workout_sets.forEach((set: any) => {
			if (!exerciseMap.has(set.exercise_id)) {
				exerciseMap.set(set.exercise_id, {
					exercise: set.exercise,
					sets: []
				});
			}
			exerciseMap.get(set.exercise_id).sets.push(set);
		});

		exerciseMap.forEach((value) => {
			value.sets.sort((a: any, b: any) => a.set_order - b.set_order);
		});

		return Array.from(exerciseMap.values());
	});

	onMount(async () => {
		await workoutsStore.fetchById($page.params.id);
	});

	// Debounce helper
	function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
		let timeout: ReturnType<typeof setTimeout>;
		return function (...args: Parameters<T>) {
			clearTimeout(timeout);
			timeout = setTimeout(() => func(...args), wait);
		};
	}

	const saveSet = async (setId: number, updates: any) => {
		savingStatus = 'saving';
		clearTimeout(savingTimeout);

		const response = await apiRequest(`workout_sets/${setId}`, 'PATCH', {
			workout_set: updates
		});

		if (response.ok) {
			savingStatus = 'saved';
			savingTimeout = setTimeout(() => {
				savingStatus = null;
			}, 2000);
		}
	};

	const debouncedSave = debounce(saveSet, 500);

	function updateSet(setId: number, field: string, value: any) {
		if (!workout) return;

		const setIndex = workout.workout_sets.findIndex((s: any) => s.id === setId);
		if (setIndex !== -1) {
			const updatedSets = [...workout.workout_sets];
			updatedSets[setIndex] = { ...updatedSets[setIndex], [field]: value };
			workoutsStore.updateCurrentWorkoutSets(updatedSets);
		}
		debouncedSave(setId, { [field]: value });
	}

	async function deleteSet(set: any) {
		if (!workout) return;

		const updatedSets = workout.workout_sets.filter((s: any) => s.id !== set.id);
		workoutsStore.updateCurrentWorkoutSets(updatedSets);

		const timeout = setTimeout(async () => {
			await apiRequest(`workout_sets/${set.id}`, 'DELETE');
			recentlyDeleted = null;
		}, 5000);

		recentlyDeleted = { set, timeout };
	}

	function undoDelete() {
		if (recentlyDeleted && workout) {
			clearTimeout(recentlyDeleted.timeout);
			const updatedSets = [...workout.workout_sets, recentlyDeleted.set];
			workoutsStore.updateCurrentWorkoutSets(updatedSets);
			recentlyDeleted = null;
		}
	}

	async function addSet(exerciseId: number) {
		if (!workout) return;

		const sets = workout.workout_sets.filter((s: any) => s.exercise_id === exerciseId);
		const lastSet = sets[sets.length - 1];

		const response = await apiRequest(`workout_sets`, 'POST', {
			workout_set: {
				workout_id: workout.id,
				exercise_id: exerciseId,
				weight: lastSet?.weight || null,
				reps: lastSet?.reps || null,
				set_order: sets.length + 1
			}
		});

		if (response.ok) {
			const newSet = await response.json();
			const updatedSets = [...workout.workout_sets, newSet];
			workoutsStore.updateCurrentWorkoutSets(updatedSets);
		}
	}

	async function deleteExercise(exerciseId: number) {
		if (!workout) return;

		const setsToDelete = workout.workout_sets.filter((s: any) => s.exercise_id === exerciseId);
		const updatedSets = workout.workout_sets.filter((s: any) => s.exercise_id !== exerciseId);
		workoutsStore.updateCurrentWorkoutSets(updatedSets);

		try {
			await Promise.all(setsToDelete.map((set) => apiRequest(`workout_sets/${set.id}`, 'DELETE')));
		} catch (error) {
			console.error('Failed to delete exercise sets:', error);
			const revertedSets = [...updatedSets, ...setsToDelete];
			workoutsStore.updateCurrentWorkoutSets(revertedSets);
		}
	}

	async function handleAddExercises(exerciseIds: number[]) {
		if (!workout) return;

		for (const exerciseId of exerciseIds) {
			await apiRequest(`workout_sets`, 'POST', {
				workout_set: {
					workout_id: workout.id,
					exercise_id: exerciseId,
					weight: null,
					reps: null,
					set_order: 1
				}
			});
		}

		// Reload to get fresh data with exercises
		await workoutsStore.fetchById(workout.id);
	}

	// Title editing
	function startEditingTitle() {
		if (!workout || isCompleted) return;
		titleInput = workout.title || '';
		isEditingTitle = true;
	}

	async function saveTitle() {
		if (!workout) return;

		if (titleInput.trim() === '') {
			titleInput = workout.title || '';
			isEditingTitle = false;
			return;
		}

		savingStatus = 'saving';
		clearTimeout(savingTimeout);

		try {
			await workoutsStore.update(workout.id, { title: titleInput });
			isEditingTitle = false;

			savingStatus = 'saved';
			savingTimeout = setTimeout(() => {
				savingStatus = null;
			}, 2000);
		} catch (error) {
			console.error('Failed to save title:', error);
		}
	}

	function handleTitleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			saveTitle();
		} else if (e.key === 'Escape') {
			titleInput = workout?.title || '';
			isEditingTitle = false;
		}
	}

	// Complete workout
	async function completeWorkout() {
		if (!workout) return;

		const incompleteSets = workout.workout_sets.filter((s: any) => !s.weight || !s.reps);

		if (incompleteSets.length > 0) {
			const proceed = confirm(
				`You have ${incompleteSets.length} incomplete set(s). Complete workout anyway?`
			);
			if (!proceed) return;
		}

		isCompletingWorkout = true;

		try {
			await workoutsStore.complete(workout.id);
			setTimeout(() => {
				goto('/');
			}, 1500);
		} catch (error) {
			console.error('Failed to complete workout:', error);
		} finally {
			isCompletingWorkout = false;
		}
	}
</script>

<svelte:head>
	<title>{workout?.title || 'Workout'} - GainLog</title>
</svelte:head>

{#if loading}
	<div
		class="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100"
	>
		<div class="text-center">
			<div
				class="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
			></div>
			<p class="mt-4 text-lg text-slate-600">Loading workout...</p>
		</div>
	</div>
{:else if errorMessage}
	<div
		class="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100"
	>
		<div class="text-center">
			<p class="text-lg text-red-600">{errorMessage}</p>
		</div>
	</div>
{:else if workout}
	<div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 pb-32">
		<div class="mx-auto max-w-3xl">
			<div class="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
				<div class="mb-2">
					{#if isEditingTitle}
						<input
							type="text"
							bind:value={titleInput}
							onblur={saveTitle}
							onkeydown={handleTitleKeydown}
							placeholder="Enter workout title"
							class="w-full rounded-lg border-2 border-blue-400 bg-white px-3 py-2 text-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-100 sm:text-2xl lg:text-3xl"
							autofocus
						/>
					{:else}
						<button
							onclick={startEditingTitle}
							class="w-full text-left transition-colors hover:text-blue-600"
							disabled={isCompleted}
						>
							<h1 class="text-xl font-bold break-words text-slate-900 sm:text-2xl lg:text-3xl">
								{workout.title || 'Untitled Workout'}
							</h1>
						</button>
					{/if}
				</div>

				<div class="flex items-center justify-between">
					<p class="text-sm text-slate-500">
						{new Date(workout.created_at).toLocaleDateString('en-US', {
							weekday: 'long',
							year: 'numeric',
							month: 'long',
							day: 'numeric'
						})}
					</p>

					{#if isCompleted}
						<div
							class="flex items-center gap-2 rounded-lg bg-green-100 px-3 py-1.5 text-sm font-semibold text-green-700"
						>
							<Check size={16} />
							Completed
						</div>
					{/if}
				</div>
			</div>

			{#each groupedExercises as { exercise, sets }}
				{@const lastSet = sets[sets.length - 1]}

				<div
					class="group/exercise mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm {isCompleted
						? 'opacity-75'
						: ''}"
				>
					<div class="mb-6 flex items-center justify-between">
						<div class="flex-1">
							<h2 class="text-2xl font-bold text-slate-900">{exercise.name}</h2>
						</div>

						{#if !isCompleted}
							<button
								onclick={() => {
									if (confirm(`Remove ${exercise.name} from this workout?`)) {
										deleteExercise(exercise.id);
									}
								}}
								class="rounded-lg p-2 text-red-500 transition-all hover:bg-red-50 sm:opacity-0 sm:group-hover/exercise:opacity-100"
								aria-label="Delete exercise"
							>
								<Trash2 size={20} />
							</button>
						{/if}
					</div>

					<div
						class="mb-3 grid grid-cols-[50px_1fr_1fr_auto] gap-3 px-3 text-xs font-semibold tracking-wide text-slate-500 uppercase"
					>
						<span>Set</span>
						<span>Weight</span>
						<span>Reps</span>
						<span class="w-20"></span>
					</div>

					<div class="space-y-2">
						{#each sets as set, index (set.id)}
							{@const isComplete = set.weight && set.reps}

							<div
								class="group relative grid grid-cols-[40px_1fr_1fr_80px] gap-2 rounded-xl border-2 p-3 transition-all duration-200 sm:grid-cols-[50px_1fr_1fr_auto] sm:gap-3 {isComplete
									? 'border-green-300 bg-green-50'
									: 'border-slate-200 bg-white hover:border-slate-300'}"
							>
								<div class="flex items-center justify-center">
									<div
										class="flex h-6 w-6 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all sm:h-7 sm:w-7 {isComplete
											? 'border-green-500 bg-green-100 text-green-700'
											: 'border-slate-300 bg-white text-slate-500'}"
									>
										{index + 1}
									</div>
								</div>

								<input
									type="number"
									inputmode="decimal"
									value={set.weight || ''}
									oninput={(e) =>
										updateSet(set.id, 'weight', Number(e.currentTarget.value) || null)}
									placeholder="lbs"
									disabled={isCompleted}
									class="w-full rounded-lg border-2 px-3 py-2 text-base font-medium transition-all outline-none sm:px-4 sm:py-2.5 {!set.weight
										? 'border-red-200 bg-red-50 placeholder-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
										: 'border-slate-200 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100'} {isCompleted
										? 'cursor-not-allowed opacity-60'
										: ''}"
								/>

								<input
									type="number"
									inputmode="numeric"
									value={set.reps || ''}
									oninput={(e) => updateSet(set.id, 'reps', Number(e.currentTarget.value) || null)}
									placeholder="reps"
									disabled={isCompleted}
									class="w-full rounded-lg border-2 px-3 py-2 text-base font-medium transition-all outline-none sm:px-4 sm:py-2.5 {!set.reps
										? 'border-red-200 bg-red-50 placeholder-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
										: 'border-slate-200 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100'} {isCompleted
										? 'cursor-not-allowed opacity-60'
										: ''}"
								/>

								<div class="flex items-center justify-end gap-1 sm:gap-2">
									{#if !isCompleted}
										<button
											onclick={() => deleteSet(set)}
											class="rounded-lg p-1.5 text-red-500 transition-all hover:bg-red-50 sm:p-2 sm:opacity-0 sm:group-hover:opacity-100"
										>
											<Trash2 size={16} class="sm:h-[18px] sm:w-[18px]" />
										</button>
									{/if}
								</div>

								{#if !isComplete}
									<div class="col-span-4 flex items-center gap-1 text-xs text-slate-400">
										<Circle size={12} />
										Fill in weight and reps to complete this set
									</div>
								{/if}
							</div>
						{/each}
					</div>

					{#if !isCompleted}
						<button
							onclick={() => addSet(exercise.id)}
							class="mt-4 w-full rounded-xl border-2 border-dashed border-slate-300 px-4 py-3 font-medium text-slate-600 transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
						>
							{#if lastSet?.weight && lastSet?.reps}
								+ Add Set ({lastSet.weight}lbs × {lastSet.reps})
							{:else}
								+ Add New Set
							{/if}
						</button>
					{/if}
				</div>
			{/each}

			{#if !isCompleted}
				<button
					onclick={() => (isAddExerciseOpen = true)}
					class="mb-6 w-full rounded-xl border-2 border-dashed border-slate-300 px-4 py-4 font-medium text-slate-600 transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
				>
					+ Add Exercise
				</button>
			{/if}

			{#if isCompleted}
				<div class="rounded-xl border-2 border-green-200 bg-green-50 px-6 py-4 text-center">
					<div class="flex items-center justify-center gap-2 font-bold text-green-700">
						<Check size={20} />
						<span>Workout Completed</span>
					</div>
					<p class="mt-2 text-sm text-slate-600">
						Completed on {new Date(workout.completed_at).toLocaleDateString('en-US', {
							month: 'long',
							day: 'numeric',
							year: 'numeric',
							hour: 'numeric',
							minute: '2-digit'
						})}
					</p>
					<button
						onclick={() => goto('/')}
						class="mt-4 w-full rounded-lg bg-slate-600 px-6 py-3 font-semibold text-white transition-all hover:bg-slate-700"
					>
						Back to Home
					</button>
				</div>
			{:else}
				<button
					onclick={completeWorkout}
					disabled={isCompletingWorkout}
					class="w-full rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 font-bold text-white shadow-lg transition-all hover:from-blue-600 hover:to-blue-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
				>
					{isCompletingWorkout ? 'Completing...' : 'Complete Workout'}
				</button>
			{/if}
		</div>
	</div>

	<!-- Saving Toast -->
	{#if savingStatus}
		<div
			class="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg"
		>
			{#if savingStatus === 'saving'}
				<div
					class="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
				></div>
				<span class="text-sm font-medium text-slate-700">Saving...</span>
			{:else if savingStatus === 'saved'}
				<Check size={16} class="text-green-600" />
				<span class="text-sm font-medium text-slate-700">Saved</span>
			{/if}
		</div>
	{/if}

	<!-- Undo Toast -->
	{#if recentlyDeleted}
		<div
			class="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-xl bg-slate-800 px-6 py-4 text-white shadow-2xl"
		>
			<span class="font-medium">Set deleted</span>
			<button
				onclick={undoDelete}
				class="rounded-lg bg-white px-4 py-1.5 font-semibold text-slate-800 transition-colors hover:bg-slate-100"
			>
				Undo
			</button>
		</div>
	{/if}
{/if}

<ExerciseSelector
	bind:open={isAddExerciseOpen}
	onConfirm={handleAddExercises}
	excludeExerciseIds={existingExerciseIds}
	title="Add Exercises"
	description="Select exercises to add to this workout"
	confirmText="Add Exercises"
/>
