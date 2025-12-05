<script lang="ts">
	import AuthLayout from '$lib/components/AuthLayout.svelte';
	import {
		FieldGroup,
		Field,
		FieldLabel,
		FieldDescription
	} from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { token, user } from '$lib/stores/auth';
	import { apiRequest } from '@/api';

	// Form state
	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

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
			const loginBody = {
				user: {
					email,
					password
				}
			};
			const response = await apiRequest('login', 'POST', loginBody);

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

<div class="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
	<div class="w-full max-w-sm md:max-w-3xl">
		<AuthLayout title="Welcome back" description="Login to your GainLog account">
			<form onsubmit={handleLogin}>
				<FieldGroup>
					{#if error}
						<div class="rounded-lg bg-red-50 p-3 text-sm text-red-600">
							{error}
						</div>
					{/if}

					<Field>
						<FieldLabel for="email">Email</FieldLabel>
						<Input id="email" type="email" bind:value={email} disabled={loading} required />
					</Field>

					<Field>
						<div class="flex items-center">
							<FieldLabel for="password">Password</FieldLabel>
							<a href="/forgot-password" class="ml-auto text-sm underline-offset-2 hover:underline">
								Forgot your password?
							</a>
						</div>
						<Input
							id="password"
							type="password"
							bind:value={password}
							disabled={loading}
							required
						/>
					</Field>

					<Field>
						<Button type="submit" class="w-full" disabled={loading}>
							{loading ? 'Logging in...' : 'Login'}
						</Button>
					</Field>

					<FieldDescription class="text-center">
						Don't have an account? <a href="/signup" class="font-semibold hover:underline"
							>Sign up</a
						>
					</FieldDescription>
				</FieldGroup>
			</form>
		</AuthLayout>
	</div>
</div>
