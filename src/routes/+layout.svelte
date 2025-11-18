<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { token } from '$lib/stores/auth';
	import { verifyAuth } from '$lib/auth';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
	const publicPaths = ['/login', '/signup'];

	$effect(() => {
		if (browser && !publicPaths.includes($page.url.pathname) && !$token) {
			goto('/login');
		}
	});

	onMount(async () => {
		if (!publicPaths.includes($page.url.pathname)) {
			const isAuthenticated = await verifyAuth();
			if (!isAuthenticated) {
				goto('/login?expired=true');
			}
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="m-5">
	{@render children()}
</div>
