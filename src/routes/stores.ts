import { readable, writable } from 'svelte/store';
import { PUBLIC_CDN_URL } from '$env/static/public';

export const currentPage = writable('home');
export const v = String(Math.random());
export const cdnUrl = (filename: string, dimension: string | null = null) => {
    return `${PUBLIC_CDN_URL}/lyntr/${filename}${dimension ? '_' + dimension : ''}.webp?v=${v}`
}

export const unreadMessages = writable(0);

export interface FeedItem {
    id: string;
    content: string;
    userId: string;
    createdAt: number;
    views: number;
    reposted: boolean;
    likeCount: number;
    likedByFollowed: boolean;

    repostCount: number;
    commentCount: number;
    likedByUser: boolean;
    repostedByUser: boolean;
    handle: string;
    userCreatedAt: number;
    username: string;
    iq: number;
    bio: string;
    verified: boolean;
    has_image: boolean;

    parentId: string | null;
    parentContent: string | null;
    parentUserHandle: string | null;
    parentUserUsername: string | null;
    parentUserVerified: boolean | null;
    parentHasImage: boolean | null;
    parentUserBio: string | null;
    parentUserIq: number | null;
    parentUserId: string | null;
    parentCreatedAt: number | null;
    parentUserCreatedAt: number | null;
}
