import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { verifyAuthJWT } from '@/server/jwt';
import { db } from '@/server/db';
import { users, lynts, history } from '@/server/schema';
import { and, eq, sql } from 'drizzle-orm';
import { handleFeed } from './handle';
import { followingFeed } from './following';
import { newFeed } from './new';
import { mainFeed } from './main';
import { likedFeed } from './liked';

async function updateViewsAndHistory(userId: string, lyntIds: string[]) {
	for (const lyntId of lyntIds) {
		await db.transaction(async (trx) => {
			await trx
				.update(lynts)
				.set({ views: sql`${lynts.views} + 1` })
				.where(eq(lynts.id, lyntId));

			await trx
				.insert(history)
				.values({
					user_id: userId,
					lynt_id: lyntId,
					createdAt: sql`now()`
				})
				.onConflictDoUpdate({
					target: [history.user_id, history.lynt_id],
					set: { createdAt: sql`now()` }
				});
		});
	}
}

export const GET: RequestHandler = async ({ request, cookies, url }) => {
	const authCookie = cookies.get('_TOKEN__DO_NOT_SHARE');
	const handle = url.searchParams.get('handle');
	const type = url.searchParams.get('type') || 'For you';

	if (!authCookie) {
		return json({ error: 'Missing authentication' }, { status: 401 });
	}

	const tabs = ['For you', 'Following', 'Live', 'New', 'Liked'];

	if (!tabs.includes(type)) {
		return json({ error: 'Invalid type property.' }, { status: 400 });
	}

	const excludePosts = url.searchParams.get('excludePosts')?.split(',') || [];

	try {
		const jwtPayload = await verifyAuthJWT(authCookie);
		if (!jwtPayload.userId) {
			throw new Error('Invalid JWT token');
		}
		const userId = jwtPayload.userId;
		let result;

		if (handle) {
			const userResult = await db
				.select({ id: users.id })
				.from(users)
				.where(eq(users.handle, handle))
				.limit(1);
			const user = userResult[0];
			if (!user) {
				return json({ error: 'User not found' }, { status: 404 });
			}
			if (type === 'Liked') {
				result = await likedFeed(user.id, userId);
			} else {
				result = await handleFeed(user.id, userId);
			}
		} else if (type === 'Following') {
			result = await followingFeed(userId);
		} else if (type === 'New') {
			result = await newFeed(userId);
		} else {
			result = await mainFeed(userId, 20, excludePosts);
		}

		// Start updating views and history in the background
		const lyntIds = result.map((lynt) => lynt.id);
		updateViewsAndHistory(userId, lyntIds).catch((error) => {
			console.error('Error updating views and history:', error);
		});

		return json({ lynts: result });
	} catch (error) {
		console.error('Authentication error:', error);
		return json({ error: 'Authentication failed' }, { status: 401 });
	}
};
