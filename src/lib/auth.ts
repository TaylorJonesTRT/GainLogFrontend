import { token, user } from '$lib/stores/auth';
import { get } from 'svelte/store';
import { goto } from '$app/navigation';
import { apiRequest } from '$lib/api';

export async function handleLogout() {
    try {
        const response = await apiRequest('logout', 'DELETE');

        if (response.ok) {
            token.set(null);
            user.set(null);
            goto('/auth/login');
        } else {
            console.error('Logout failed');
            // Still clear local state even if server logout fails
            token.set(null);
            user.set(null);
            goto('/auth/login');
        }
    } catch (error) {
        console.error('Error during logout:', error);
        // Clear local state on error as well
        token.set(null);
        user.set(null);
        goto('/auth/login');
    }
}

export async function verifyAuth() {
    const currentToken = get(token);

    if (!currentToken) {
        return false;
    }

    try {
        const response = await apiRequest('auth/verify', 'GET');

        if (response.ok) {
            const data = await response.json();
            user.set(data.user);
            return true;
        } else {
            token.set(null);
            user.set(null);
            return false;
        }
    } catch (error) {
        console.error('Auth verification failed:', error);
        token.set(null);
        user.set(null);
        return false;
    }
}
