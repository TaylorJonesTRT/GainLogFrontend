<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { cn } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		title: string;
		description: string;
		children: Snippet;
	}

	let { class: className, title, description, children, ...restProps }: Props = $props();
</script>

<div class={cn('flex flex-col gap-6', className)} {...restProps}>
	<Card.Root class="overflow-hidden p-0">
		<Card.Content class="grid p-0 md:grid-cols-2">
			<div class="p-6 md:p-8">
				<div class="mb-6 flex flex-col items-center gap-2 text-center">
					<h1 class="text-2xl font-bold">{title}</h1>
					<p class="text-balance text-muted-foreground">{description}</p>
				</div>

				{@render children()}
			</div>

			<div class="relative hidden bg-muted md:block">
				<enhanced:img
					src="../assets/gym_image.webp"
					alt="Gym"
					class="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
				/>
			</div>
		</Card.Content>
	</Card.Root>
</div>
