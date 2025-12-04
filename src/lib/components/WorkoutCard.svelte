<script lang="ts">
	import { goto } from '$app/navigation';
	import { Check, Clock, Calendar } from 'lucide-svelte';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';

	interface Props {
		workout: {
			id: number;
			title: string | null;
			created_at: string;
			completed_at: string | null;
			workout_sets?: Array<{
				exercise?: {
					name: string;
				};
			}>;
		};
	}

	let { workout }: Props = $props();

	let isCompleted = $derived(Boolean(workout.completed_at));

	let displayDate = $derived(workout.completed_at || workout.created_at);

	let exerciseNames = $derived.by(() => {
		if (!workout.workout_sets) return [];
		const uniqueExercises = new Set(
			workout.workout_sets.map((s) => s.exercise?.name).filter(Boolean)
		);
		return Array.from(uniqueExercises);
	});

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		const now = new Date();
		const diffTime = Math.abs(now.getTime() - date.getTime());
		const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

		if (diffDays === 0) return 'Today';
		if (diffDays === 1) return 'Yesterday';
		if (diffDays < 7) return `${diffDays} days ago`;

		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
		});
	}

	function handleClick() {
		goto(`/workouts/${workout.id}`);
	}
</script>

<Card.Root
	class="cursor-pointer transition-all hover:shadow-md {isCompleted
		? 'border-green-200 bg-green-50/50'
		: 'border-blue-200 bg-blue-50/50'}"
	onclick={handleClick}
>
	<Card.Header class="pb-3">
		<div class="flex items-start justify-between gap-2">
			<Card.Title class="flex-1 truncate text-lg font-bold text-slate-900">
				{workout.title || 'Untitled Workout'}
			</Card.Title>

			{#if isCompleted}
				<Badge variant="outline" class="shrink-0 border-green-500 bg-green-100 text-green-700">
					<Check size={14} class="mr-1" />
					Complete
				</Badge>
			{:else}
				<Badge variant="outline" class="shrink-0 border-blue-500 bg-blue-100 text-blue-700">
					<Clock size={14} class="mr-1" />
					In Progress
				</Badge>
			{/if}
		</div>
	</Card.Header>

	<Card.Content class="space-y-2">
		{#if exerciseNames.length > 0}
			<div class="flex flex-wrap gap-1.5">
				{#each exerciseNames as exercise}
					<span class="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
						{exercise}
					</span>
				{/each}
			</div>
		{:else}
			<p class="text-sm text-slate-500 italic">No exercises</p>
		{/if}

		<div class="flex items-center gap-1.5 text-sm text-slate-500">
			<Calendar size={14} />
			<span>{formatDate(displayDate)}</span>
		</div>
	</Card.Content>
</Card.Root>
