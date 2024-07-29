import { readable, writable } from 'svelte/store';
import { PUBLIC_CDN_URL } from '$env/static/public';

export const currentPage = writable('home');
export const v = String(Math.random());
export const cdnUrl = (filename: string, dimension: string | null = null) => {
    return `${PUBLIC_CDN_URL}/lyntr/${filename}${dimension ? '_' + dimension : ''}.webp?v=${v}`
}

export const unreadMessages = writable(0);
