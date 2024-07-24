import { readable, writable } from 'svelte/store';

export const currentPage = writable('home');
export const v = readable(String(Math.random()));