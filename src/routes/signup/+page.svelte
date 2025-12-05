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
	import { token, user } from '$lib/stores/auth';
	import { apiRequest } from '@/api';

	let email = $state('');
	let password = $state('');
	let passwordConfirmation = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleSignup(e: Event) {
		e.preventDefault();
		error = '';

		// Validation
		if (password !== passwordConfirmation) {
			error = 'Passwords do not match';
			return;
		}

		if (password.length < 6) {
			error = 'Password must be at least 6 characters';
			return;
		}

		loading = true;

		try {
			const body = {
				user: {
					email,
					password,
					password_confirmation: passwordConfirmation
				}
			};

			const response = await apiRequest('signup', 'POST', body);

			if (response.ok) {
				const data = await response.json();
				const authToken = response.headers.get('Authorization');

				if (authToken) {
					token.set(authToken);
					user.set(data.user);
					goto('/');
				} else {
					error = 'Signup failed: No token received';
				}
			} else {
				const data = await response.json();
				if (data.errors) {
					error = Object.values(data.errors).flat().join(', ');
				} else {
					error = data.error || 'Signup failed';
				}
			}
		} catch (err) {
			console.error('Signup error:', err);
			error = 'Signup failed. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
	<div class="w-full max-w-sm md:max-w-3xl">
		<AuthLayout title="Create an account" description="Start tracking your gains with GainLog">
			<form onsubmit={handleSignup}>
				<FieldGroup>
					{#if error}
						<div class="rounded-lg bg-red-50 p-3 text-sm text-red-600">
							{error}
						</div>
					{/if}

					<!-- Optional: Name field -->
					<!-- <Field>
				<FieldLabel for="name">Name</FieldLabel>
				<Input id="name" type="text" bind:value={name} disabled={loading} />
			</Field> -->

					<Field>
						<FieldLabel for="email">Email</FieldLabel>
						<Input id="email" type="email" bind:value={email} disabled={loading} required />
					</Field>

					<Field>
						<FieldLabel for="password">Password</FieldLabel>
						<Input
							id="password"
							type="password"
							bind:value={password}
							disabled={loading}
							required
							placeholder="At least 6 characters"
						/>
					</Field>

					<Field>
						<FieldLabel for="password-confirmation">Confirm Password</FieldLabel>
						<Input
							id="password-confirmation"
							type="password"
							bind:value={passwordConfirmation}
							disabled={loading}
							required
						/>
					</Field>

					<Field>
						<Button type="submit" class="w-full" disabled={loading}>
							{loading ? 'Creating account...' : 'Create account'}
						</Button>
					</Field>

					<FieldDescription class="text-center">
						Already have an account? <a href="/login" class="font-semibold hover:underline">Login</a
						>
					</FieldDescription>
				</FieldGroup>
			</form>
		</AuthLayout>
	</div>
</div>
