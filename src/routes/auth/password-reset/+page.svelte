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
	import { apiRequest } from '@/api';

	let password = $state('');
	let passwordConfirmation = $state('');
	let error = $state('');
	let loading = $state(false);
	let success = $state(false);

	const resetToken = $derived($page.url.searchParams.get('reset_password_token'));

	$effect(() => {
		if (!resetToken) {
			error = 'Invalid or missing reset token. Please request a new password reset.';
		}
	});

	async function handlePasswordReset(e: Event) {
		e.preventDefault();
		error = '';

		if (!resetToken) {
			error = 'Invalid or missing reset token. Please request a new password reset.';
			return;
		}

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
					password,
					password_confirmation: passwordConfirmation,
					reset_password_token: resetToken
				}
			};

			const response = await apiRequest('password', 'PATCH', body);

			if (response.ok) {
				success = true;
				// Redirect to login after a short delay
				setTimeout(() => {
					goto('/auth/login');
				}, 2000);
			} else {
				const data = await response.json();
				if (data.errors) {
					error = Object.values(data.errors).flat().join(', ');
				} else {
					error = data.error || 'Password reset failed. The token may be invalid or expired.';
				}
			}
		} catch (err) {
			console.error('Password reset error:', err);
			error = 'Password reset failed. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
	<div class="w-full max-w-sm md:max-w-3xl">
		<AuthLayout title="Reset your password" description="Enter your new password">
			{#if success}
				<FieldGroup>
					<div class="rounded-lg bg-green-50 p-3 text-sm text-green-600">
						Password reset successfully! Redirecting to login...
					</div>
				</FieldGroup>
			{:else}
				<form onsubmit={handlePasswordReset}>
					<FieldGroup>
						{#if error}
							<div class="rounded-lg bg-red-50 p-3 text-sm text-red-600">
								{error}
							</div>
						{/if}

						<Field>
							<FieldLabel for="password">Password</FieldLabel>
							<Input
								id="password"
								type="password"
								bind:value={password}
								disabled={loading || !resetToken}
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
								disabled={loading || !resetToken}
								required
							/>
						</Field>

						<Field>
							<Button type="submit" class="w-full" disabled={loading || !resetToken}>
								{loading ? 'Resetting password...' : 'Reset password'}
							</Button>
						</Field>

						<FieldDescription class="text-center">
							<a href="/auth/login" class="font-semibold hover:underline">Back to login</a>
						</FieldDescription>
					</FieldGroup>
				</form>
			{/if}
		</AuthLayout>
	</div>
</div>
