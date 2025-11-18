<script>
	import Button from '@/components/ui/button/button.svelte';
	import * as Menubar from '@/components/ui/menubar/index.ts';
</script>

<div class="flex flex-col">
	<h1 class="text-3xl font-bold">Start Workout</h1>

	<div class="mt-10">
		<h2 class="text-xl font-semibold">Quickstart</h2>
		<Button class="mt-5 w-full">Start an empty workout</Button>
	</div>

	<div class="mt-10">
		<h2 class="text-xl font-semibold">Previous Workouts</h2>
	</div>
</div>

<div>
	<Menubar.Root>
		<Menubar.Menu>
			<Menubar.Trigger>File</Menubar.Trigger>
			<Menubar.Content>
				<Menubar.Item>Profile</Menubar.Item>
				<Menubar.Separator />
				<Menubar.Item>Test</Menubar.Item>
			</Menubar.Content>
		</Menubar.Menu>
	</Menubar.Root>
</div>
