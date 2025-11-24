import { token, user } from '$lib/stores/auth';
import { get } from 'svelte/store';
import { goto } from '$app/navigation';
import { PUBLIC_API_URL } from '$env/static/public';

const API_URL = PUBLIC_API_URL;

const currentToken = get(token);

export async function handleLogout() {
    try {
        const url = `${API_URL}/logout`;
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': currentToken
            }
        });

        if (response.ok) {
            token.set(null);
            user.set(null);
            goto('/login');
        } else {
            console.error('Logout failed');
        }
    } catch (error) {
        console.error('Error during logout:', error);
    }
}

export async function verifyAuth() {

    if (!currentToken) {
        return false;
    }

    try {
        const url = `${API_URL}/auth/verify`;

        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': currentToken
            }
        });

        if (response.ok) {
            const data = await response.json();

            user.set(data.user);

            return true;
        } else {
            token.set(null);
            user.set(null);

            return false
        }
    } catch (error) {
        console.error('Auth verification failed:', error);
        token.set(null);
        user.set(null);

        return false;
    }
}
