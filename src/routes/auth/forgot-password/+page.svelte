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
	import { apiRequest } from '@/api';

	let email = $state('');
	let error = $state('');
	let success = $state(false);
	let loading = $state(false);

	async function handleForgotPassword(e: Event) {
		e.preventDefault();
		error = '';
		success = false;
		loading = true;

		try {
			const body = {
				user: {
					email
				}
			};

			const response = await apiRequest('reset-password', 'POST', body);

			if (response.ok) {
				success = true;
			} else {
				const data = await response.json();
				// Don't reveal if email exists, show generic success message
				success = true;
			}
		} catch (err) {
			console.error('Forgot password error:', err);
			// Still show success to avoid revealing if email exists
			success = true;
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
	<div class="w-full max-w-sm md:max-w-3xl">
		<AuthLayout title="Forgot your password?" description="Enter your email and we'll send you reset instructions">
			{#if success}
				<FieldGroup>
					<div class="rounded-lg bg-green-50 p-3 text-sm text-green-600">
						If an account with that email exists, we've sent password reset instructions.
					</div>
					<FieldDescription class="text-center">
						<a href="/auth/login" class="font-semibold hover:underline">Back to login</a>
					</FieldDescription>
				</FieldGroup>
			{:else}
				<form onsubmit={handleForgotPassword}>
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
							<Button type="submit" class="w-full" disabled={loading}>
								{loading ? 'Sending...' : 'Send reset instructions'}
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
