import { get } from 'svelte/store';
import { token, user } from '$lib/stores/auth';
import { goto } from '$app/navigation';
import { PUBLIC_API_URL } from '$env/static/public';

interface ApiOptions extends RequestInit {
    headers?: Record<string, string>;
}

export async function apiRequest<T = any>(
    endpoint: string,
    method: string = 'GET',
    body?: object | null,
    options: ApiOptions = {}
) {
    const currentToken = get(token);

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (currentToken) {
        headers['Authorization'] = currentToken
    }

    const fetchOptions: RequestInit = {
        method: method.toUpperCase(),
        headers,
        ...options
    }
    if (body && method.toUpperCase() !== 'GET' && method.toUpperCase() !== 'HEAD') {
        fetchOptions.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${PUBLIC_API_URL}/${endpoint}`, fetchOptions);

        if (response.status === 401) {
            const data = await response.json();

            if (data.error && data.error.includes('expired')) {
                console.log('Token expired, logging out...');
                token.set(null);
                user.set(null);
                goto('/login?expired=true');
                throw new Error('Session expired. Please login again.');
            }

            token.set(null);
            user.set(null);
            goto('/login');
            throw new Error('Authentication failed. Please login again.');
        }

        return response;
    } catch (error) {
        console.error('API request failed:', error)
        throw error;
    }
}
