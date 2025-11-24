<script lang="ts">
	import { apiRequest } from '@/api';
	import Button from '@/components/ui/button/button.svelte';
	import * as Drawer from '@/components/ui/drawer';
	import { Check } from 'lucide-svelte';

	interface Props {
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		onConfirm?: (selectedIds: number[]) => void;
		excludeExerciseIds?: number[]; // Add this
		title?: string;
		description?: string;
		confirmText?: string;
	}

	let {
		open = $bindable(false),
		onOpenChange,
		onConfirm,
		excludeExerciseIds = [], // Add this
		title = 'Select Exercises',
		description = 'Click on items to select or deselect them',
		confirmText = 'Confirm'
	}: Props = $props();

	let items: Array<{ id: number; name: string }> = $state([]);
	let isLoading = $state(false);
	let selectedIds: Set<number> = $state(new Set());

	// Filter out excluded exercises
	let filteredItems = $derived(items.filter((item) => !excludeExerciseIds.includes(item.id)));

	$effect(() => {
		if (open) {
			fetchItems();
		} else {
		}
	});

	async function fetchItems() {
		isLoading = true;

		try {
			const response = await apiRequest('exercises', 'GET');
			console.log('Resposne status: ', response.ok);

			if (response.ok) {
				items = await response.json();
			}
		} catch (error) {
			console.error('Error fetching exercises:', error);
		} finally {
			isLoading = false;
		}
	}

	function toggleItem(id: number) {
		const next = new Set(selectedIds);

		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}

		selectedIds = next;
	}

	function handleOpenChange(newOpen: boolean) {
		open = newOpen;
		if (newOpen) {
			fetchItems();
		}
		onOpenChange?.(newOpen);
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

<Drawer.Root bind:open onOpenChange={handleOpenChange}>
	<Drawer.Content>
		<Drawer.Header>
			<Drawer.Title>{title}</Drawer.Title>
			<Drawer.Description>{description}</Drawer.Description>
		</Drawer.Header>

		<div class="max-h-[60vh] overflow-y-auto px-4">
			{#if isLoading}
				<div class="py-8 text-center text-muted-foreground">Loading...</div>
			{:else if filteredItems.length === 0}
				<div class="py-8 text-center text-muted-foreground">
					{items.length === 0
						? 'No exercises found'
						: 'All exercises already added to this workout'}
				</div>
			{:else}
				<div class="space-y-2">
					{#each filteredItems as item (item.id)}
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
