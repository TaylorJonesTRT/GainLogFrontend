<script lang="ts">
	import { onMount } from 'svelte';
	import { workoutsStore } from '$lib/stores/workouts.svelte';
	import WorkoutCard from '$lib/components/WorkoutCard.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-svelte';

	let currentPage = $state(1);
	let perPage = $state(10);

	const workouts = $derived(workoutsStore.workouts);
	const pagination = $derived(workoutsStore.pagination);
	const isLoading = $derived(workoutsStore.isLoading);

	onMount(() => {
		loadPage(1);
	});

	async function loadPage(page: number) {
		currentPage = page;
		await workoutsStore.fetchAll({ page, per_page: perPage });
	}

	async function goToFirstPage() {
		await loadPage(1);
	}

	async function goToPrevPage() {
		if (pagination?.has_prev_page) {
			await loadPage(currentPage - 1);
		}
	}

	async function goToNextPage() {
		if (pagination?.has_next_page) {
			await loadPage(currentPage + 1);
		}
	}

	async function goToLastPage() {
		if (pagination?.total_pages) {
			await loadPage(pagination.total_pages);
		}
	}

	async function changePerPage(newPerPage: number) {
		perPage = newPerPage;
		await loadPage(1); // Reset to first page when changing per page
	}

	// Generate page numbers to show
	const pageNumbers = $derived.by(() => {
		if (!pagination) return [];

		const total = pagination.total_pages;
		const current = pagination.current_page;
		const pages: (number | string)[] = [];

		if (total <= 7) {
			// Show all pages if 7 or fewer
			for (let i = 1; i <= total; i++) {
				pages.push(i);
			}
		} else {
			// Always show first page
			pages.push(1);

			if (current > 3) {
				pages.push('...');
			}

			// Show pages around current
			const start = Math.max(2, current - 1);
			const end = Math.min(total - 1, current + 1);

			for (let i = start; i <= end; i++) {
				pages.push(i);
			}

			if (current < total - 2) {
				pages.push('...');
			}

			// Always show last page
			pages.push(total);
		}

		return pages;
	});
</script>

<div class="container mx-auto px-4 py-8 pb-32">
	<div class="mb-8">
		<h1 class="mb-2 text-3xl font-bold">Workout History</h1>
		<p class="text-muted-foreground">
			{#if pagination}
				Showing {(pagination.current_page - 1) * pagination.per_page + 1}-{Math.min(
					pagination.current_page * pagination.per_page,
					pagination.total_count
				)} of {pagination.total_count} workouts
			{/if}
		</p>
	</div>

	<!-- Per page selector -->
	<div class="mb-6 flex items-center gap-2">
		<span class="text-sm text-muted-foreground">Show:</span>
		<div class="flex gap-1">
			{#each [10, 20, 50] as option}
				<Button
					variant={perPage === option ? 'default' : 'outline'}
					size="sm"
					onclick={() => changePerPage(option)}
				>
					{option}
				</Button>
			{/each}
		</div>
		<span class="text-sm text-muted-foreground">per page</span>
	</div>

	<!-- Loading state -->
	{#if isLoading}
		<div class="flex items-center justify-center py-12">
			<div class="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
		</div>
	{:else if workouts.length === 0}
		<div class="py-12 text-center">
			<p class="text-muted-foreground">No workouts found. Start your first workout!</p>
		</div>
	{:else}
		<!-- Workouts grid -->
		<div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each workouts as workout (workout.id)}
				<WorkoutCard {workout} />
			{/each}
		</div>

		<!-- Pagination controls -->
		{#if pagination && pagination.total_pages > 1}
			<div class="flex flex-col items-center justify-between gap-4 sm:flex-row">
				<!-- Page info -->
				<div class="text-sm text-muted-foreground">
					Page {pagination.current_page} of {pagination.total_pages}
				</div>

				<!-- Navigation buttons -->
				<div class="flex items-center gap-1">
					<!-- First page -->
					<Button
						variant="outline"
						size="icon"
						disabled={!pagination.has_prev_page}
						onclick={goToFirstPage}
					>
						<ChevronsLeft class="h-4 w-4" />
					</Button>

					<!-- Previous page -->
					<Button
						variant="outline"
						size="icon"
						disabled={!pagination.has_prev_page}
						onclick={goToPrevPage}
					>
						<ChevronLeft class="h-4 w-4" />
					</Button>

					<!-- Page numbers -->
					<div class="flex gap-1">
						{#each pageNumbers as pageNum}
							{#if pageNum === '...'}
								<div class="px-3 py-2 text-muted-foreground">...</div>
							{:else}
								<Button
									variant={pageNum === pagination.current_page ? 'default' : 'outline'}
									size="sm"
									onclick={() => loadPage(pageNum as number)}
								>
									{pageNum}
								</Button>
							{/if}
						{/each}
					</div>

					<!-- Next page -->
					<Button
						variant="outline"
						size="icon"
						disabled={!pagination.has_next_page}
						onclick={goToNextPage}
					>
						<ChevronRight class="h-4 w-4" />
					</Button>

					<!-- Last page -->
					<Button
						variant="outline"
						size="icon"
						disabled={!pagination.has_next_page}
						onclick={goToLastPage}
					>
						<ChevronsRight class="h-4 w-4" />
					</Button>
				</div>
			</div>
		{/if}
	{/if}
</div>
