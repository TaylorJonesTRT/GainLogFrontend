import { get } from 'svelte/store';
import { token, user } from '@/auth';
import { goto } from '$app/navigation';
import { PUBLIC_API_URL } from '$env/static/public';

const API_URL = PUBLIC_API_URL

export async function apiRequest(endpoint, options = {}) {
    const currentToken = get(token);

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (currentToken) {
        headers['Authorization'] = currentToken
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });

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
