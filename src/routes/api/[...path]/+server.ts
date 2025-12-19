import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const fallback: RequestHandler = async ({ request, params, fetch }) => {
    const BACKEND_URL = 'http://gainlog-backend:3000';

    const url = new URL(request.url);
    const destination = `${BACKEND_URL}/${params.path}${url.search}`;

    try {
        const response = await fetch(destination, {
            method: request.method,
            headers: request.headers,
            body: request.method !== 'GET' ? await request.blob() : undefined,
            duplex: 'half' // Required for streaming bodies in some environments
        });

        return response;
    } catch (e) {
        console.error('Proxy Error:', e);
        throw error(500, 'Internal Server Error');
    }
};
