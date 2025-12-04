<script lang="ts">
	import { apiRequest } from '@/api';
	import Button from '@/components/ui/button/button.svelte';
	import * as Drawer from '@/components/ui/drawer';
	import { Input } from '@/components/ui/input';
	import { Check, Search, X } from 'lucide-svelte';

	interface Exercise {
		id: number;
		name: string;
		category?: string;
	}

	interface Props {
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		onConfirm?: (selectedIds: number[]) => void;
		excludeExerciseIds?: number[];
		title?: string;
		description?: string;
		confirmText?: string;
	}

	let {
		open = $bindable(false),
		onOpenChange,
		onConfirm,
		excludeExerciseIds = [],
		title = 'Select Exercises',
		description = 'Click on items to select or deselect them',
		confirmText = 'Confirm'
	}: Props = $props();

	let items: Exercise[] = $state([]);
	let isLoading = $state(false);
	let selectedIds: Set<number> = $state(new Set());
	let searchQuery = $state('');

	// Fetch when drawer opens
	$effect(() => {
		if (open) {
			fetchItems();
			searchQuery = ''; // Reset search when opening
		}
	});

	async function fetchItems() {
		isLoading = true;

		try {
			const response = await apiRequest('exercises', 'GET');

			if (response.ok) {
				items = await response.json();
			}
		} catch (error) {
			console.error('Error fetching exercises:', error);
		} finally {
			isLoading = false;
		}
	}

	// Filter exercises
	let filteredItems = $derived.by(() => {
		let filtered = items.filter((item) => !excludeExerciseIds.includes(item.id));

		// Apply search filter
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(item) =>
					item.name.toLowerCase().includes(query) || item.category?.toLowerCase().includes(query)
			);
		}

		return filtered;
	});

	// Group by category and sort
	let groupedExercises = $derived.by(() => {
		const grouped = new Map<string, Exercise[]>();

		filteredItems.forEach((exercise) => {
			const category = exercise.category || 'Uncategorized';
			if (!grouped.has(category)) {
				grouped.set(category, []);
			}
			grouped.get(category)!.push(exercise);
		});

		// Sort each category's exercises alphabetically
		grouped.forEach((exercises) => {
			exercises.sort((a, b) => a.name.localeCompare(b.name));
		});

		// Convert to array and sort categories alphabetically (descending)
		return Array.from(grouped.entries())
			.sort((a, b) => b[0].localeCompare(a[0]))
			.map(([category, exercises]) => ({ category, exercises }));
	});

	function toggleItem(id: number) {
		const next = new Set(selectedIds);

		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}

		selectedIds = next;
	}

	function clearSearch() {
		searchQuery = '';
	}

	function handleConfirm() {
		const exerciseIds = Array.from(selectedIds);
		onConfirm?.(exerciseIds);
		selectedIds = new Set();
		open = false;
	}

	function handleCancel() {
		selectedIds = new Set();
		open = false;
	}
</script>

<Drawer.Root bind:open>
	<Drawer.Content>
		<Drawer.Header>
			<Drawer.Title>{title}</Drawer.Title>
			<Drawer.Description>{description}</Drawer.Description>
		</Drawer.Header>

		<!-- Search Bar -->
		<div class="px-4 pb-3">
			<div class="relative">
				<Search class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
				<Input
					type="text"
					placeholder="Search exercises..."
					bind:value={searchQuery}
					class="pr-9 pl-9"
				/>
				{#if searchQuery}
					<button
						onclick={clearSearch}
						class="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
						aria-label="Clear search"
					>
						<X class="h-4 w-4" />
					</button>
				{/if}
			</div>
		</div>

		<div class="max-h-[60vh] overflow-y-auto px-4">
			{#if isLoading}
				<div class="py-8 text-center text-muted-foreground">Loading...</div>
			{:else if filteredItems.length === 0}
				<div class="py-8 text-center text-muted-foreground">
					{items.length === 0
						? 'No exercises found'
						: searchQuery
							? 'No exercises match your search'
							: 'All exercises already added to this workout'}
				</div>
			{:else}
				<div class="space-y-6 pb-4">
					{#each groupedExercises as { category, exercises }}
						<div>
							<!-- Category Header -->
							<div class="sticky top-0 z-10 bg-white py-2">
								<h3 class="text-sm font-bold tracking-wide text-slate-700 uppercase">
									{category}
								</h3>
								<div class="mt-1 h-px bg-slate-200"></div>
							</div>

							<!-- Exercise List -->
							<div class="mt-2 space-y-2">
								{#each exercises as item (item.id)}
									<button
										type="button"
										class="flex w-full flex-row items-center justify-between rounded-lg border p-4 text-left transition-colors hover:bg-accent {selectedIds.has(
											item.id
										)
											? 'border-primary bg-accent'
											: 'border-border'}"
										onclick={() => toggleItem(item.id)}
									>
										<span class="font-medium">{item.name}</span>
										{#if selectedIds.has(item.id)}
											<Check class="h-5 w-5 text-primary" />
										{/if}
									</button>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<Drawer.Footer class="flex gap-2">
			<Button onclick={handleConfirm} class="flex-1" disabled={selectedIds.size === 0}>
				{confirmText} ({selectedIds.size} selected)
			</Button>
			<Button variant="outline" onclick={handleCancel} class="flex-1">Cancel</Button>
		</Drawer.Footer>
	</Drawer.Content>
</Drawer.Root>
