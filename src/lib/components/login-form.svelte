<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import {
		FieldGroup,
		Field,
		FieldLabel,
		FieldDescription,
		FieldSeparator
	} from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { token, user } from '$lib/stores/auth';

	let { class: className, ...restProps }: HTMLAttributes<HTMLDivElement> = $props();

	const id = $props.id();

	// Form state
	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	// Check if redirected due to expired token
	$effect(() => {
		if ($page.url.searchParams.get('expired') === 'true') {
			error = 'Your session has expired. Please login again.';
		}
	});

	async function handleLogin(e: Event) {
		e.preventDefault();
		error = '';
		loading = true;

		try {
			const response = await fetch('http://localhost:3000/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					user: { email, password }
				})
			});

			if (response.ok) {
				const data = await response.json();
				const authToken = response.headers.get('Authorization');

				if (authToken) {
					token.set(authToken);
					user.set(data.user);
					goto('/');
				} else {
					error = 'Login failed: No token received';
				}
			} else {
				const data = await response.json();
				error = data.error || 'Invalid email or password';
			}
		} catch (err) {
			console.error('Login error:', err);
			error = 'Login failed. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<div class={cn('flex flex-col gap-6', className)} {...restProps}>
	<Card.Root class="overflow-hidden p-0">
		<Card.Content class="grid p-0 md:grid-cols-2">
			<form class="p-6 md:p-8" onsubmit={handleLogin}>
				<FieldGroup>
					<div class="flex flex-col items-center gap-2 text-center">
						<h1 class="text-2xl font-bold">Welcome back</h1>
						<p class="text-balance text-muted-foreground">Login to your GainLog account</p>
					</div>
					<Field>
						<FieldLabel for="email-{id}">Email</FieldLabel>
						<Input id="email-{id}" type="email" bind:value={email} disabled={loading} required />
					</Field>
					<Field>
						<div class="flex items-center">
							<FieldLabel for="password-{id}">Password</FieldLabel>
							<a href="##" class="ml-auto text-sm underline-offset-2 hover:underline">
								Forgot your password?
							</a>
						</div>
						<Input
							id="password-{id}"
							type="password"
							bind:value={password}
							disabled={loading}
							required
						/>
					</Field>
					<Field>
						<Button type="submit">Login</Button>
					</Field>
					<FieldDescription class="text-center">
						Don't have an account? <a href="##">Sign up</a>
					</FieldDescription>
				</FieldGroup>
			</form>
			<div class="relative hidden bg-muted md:block">
				<enhanced:img
					src="../assets/gym_image.webp"
					alt="placeholder"
					class="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
				/>
			</div>
		</Card.Content>
	</Card.Root>
	<!-- <FieldDescription class="px-6 text-center"> -->
	<!-- 	By clicking continue, you agree to our <a href="##">Terms of Service</a> and -->
	<!-- 	<a href="##">Privacy Policy</a>. -->
	<!-- </FieldDescription> -->
</div>
