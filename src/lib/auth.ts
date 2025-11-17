import { token, user } from '$lib/stores/auth';
import { get } from 'svelte/store';
import { PUBLIC_API_URL } from '$env/static/public';

const API_URL = PUBLIC_API_URL;

export async function verifyAuth() {
    const currentToken = get(token);

    if (!currentToken) {
        return false;
    }

    try {
        const response = await fetch(`${API_URL}/auth/verify`, {
            headers: {
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
