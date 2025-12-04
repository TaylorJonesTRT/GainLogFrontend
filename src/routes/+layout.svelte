<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { token } from '$lib/stores/auth';
	import { handleLogout, verifyAuth } from '$lib/auth';
	import Button from '@/components/ui/button/button.svelte';
	import { Activity, PlusCircle, LogOut, User, List } from 'lucide-svelte';
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

	let activeTab = 'home';
	const navItems = [
		{ id: 'profile', label: 'Profile', icon: User, requiresAuth: true },
		{ id: 'history', label: 'History', icon: Activity, requiresAuth: true },
		{ id: '', label: 'Workout', icon: PlusCircle, requiresAuth: true },
		{ id: 'exercises', label: 'Exercises', icon: List, requiresAuth: true },
		{ id: 'logout', label: 'Logout', icon: LogOut, requiresAuth: true }
	];

	let visibleNavItems = $derived(navItems.filter((item) => !item.requiresAuth || $token));

	function handleNavClick(itemId: string) {
		if (itemId === 'logout') {
			handleLogout();
		} else {
			goto(`/${itemId}`);
		}
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="m-5">
	{@render children()}

	<nav class="fixed right-0 bottom-0 left-0 border-t bg-background">
		<div class="mx-auto flex max-w-screen-xl items-center justify-around">
			{#each visibleNavItems as item}
				<Button
					variant="ghost"
					class="flex h-auto flex-1 cursor-pointer flex-col items-center gap-1 rounded-none px-6 py-4 {activeTab ===
					item.id
						? 'text-primary'
						: 'text-muted-foreground'}"
					onclick={() => handleNavClick(item.id)}
				>
					<item.icon this={item.icon} class="h-6 w-6" />
					<span class="text-xs font-medium">{item.label}</span>
				</Button>
			{/each}
		</div>
	</nav>
</div>
