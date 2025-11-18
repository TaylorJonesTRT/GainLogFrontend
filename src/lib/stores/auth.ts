import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const getStoredToken = () => {
    if (browser) {
        return localStorage.getItem('token');
    }
    return null;
};

const getStoredUser = () => {
    if (browser) {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }
    return null;
};

export const token = writable(getStoredToken());
export const user = writable(getStoredUser());

token.subscribe(value => {
    if (browser) {
        if (value) {
            localStorage.setItem('GainLogToken', value);
        } else {
            localStorage.removeItem('GainLogToken');
        }
    }
});

user.subscribe(value => {
    if (browser) {
        if (value) {
            localStorage.setItem('user', JSON.stringify(value));
        } else {
            localStorage.removeItem('user');
        }
    }
});
