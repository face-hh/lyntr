import { readable, writable } from 'svelte/store';

export const currentPage = writable('home');
export const v = String(Math.random());
export const cdnUrl = (filename: string, dimension: string | null = null) => {
	return `http://localhost:9000/lyntr/${filename}${dimension ? '_' + dimension : ''}.webp?v=${v}`;
};
