<script lang="ts">
	import { browser } from '$app/environment';
	import { verifyAuth } from '$lib/auth';
	import { redirect } from '@sveltejs/kit';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	export async function load({ url }) {
		if (browser) {
			const publicPaths = ['/login', '/signup'];

			if (!publicPaths.includes(url.pathname)) {
				const isAuthenticated = await verifyAuth();

				if (!isAuthenticated) {
					throw redirect(302, '/login?expired=true');
				}
			}
		}

		return {};
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
