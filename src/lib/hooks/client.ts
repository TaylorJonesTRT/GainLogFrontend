import { token, user } from '$lib/stores/auth';
import { get } from 'svelte/store';

export async function handleError({ error, event }) {
    console.error('Error:', error);
}

export async function handleFetch({ request, fetch }) {
    return fetch(request);
}
