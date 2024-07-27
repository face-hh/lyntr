import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '@/server/db';
import { followers, users } from '@/server/schema';
import { eq, sql } from 'drizzle-orm';
import { verifyAuthJWT } from '@/server/jwt';

interface User {
	id: string;
	username: string;
	handle: string;
	total_count?: number;
	iq: number;
}

export const GET: RequestHandler = async ({ url, cookies }) => {
	const token = cookies.get('_TOKEN__DO_NOT_SHARE');
	if (!token) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	const payload = await verifyAuthJWT(token);
	if (!payload) {
		return json({ error: 'Invalid token' }, { status: 401 });
	}

	const userId = url.searchParams.get('userId');
	const type = url.searchParams.get('type') as 'followers' | 'following';
	const page = parseInt(url.searchParams.get('page') || '1', 10);
	const limit = 50;
	const offset = (page - 1) * limit;

	if (!userId || !type) {
		return json({ error: 'Missing userId or type parameter' }, { status: 400 });
	}

	if (type !== 'followers' && type !== 'following') {
		return json({ error: 'Invalid type parameter' }, { status: 400 });
	}

	try {
		const query = db
			.select({
				id: users.id,
				username: users.username,
				handle: users.handle,
				iq: users.iq,
				total_count: sql<number>`COUNT(*) OVER()`
			})
			.from(followers)
			.innerJoin(
				users,
				type === 'followers' ? eq(followers.follower_id, users.id) : eq(followers.user_id, users.id)
			)
			.where(
				type === 'followers' ? eq(followers.user_id, userId) : eq(followers.follower_id, userId)
			)
			.limit(limit)
			.offset(offset);

		const results: User[] = await query.execute();

		if (results.length === 0) {
			return json({
				users: [],
				totalCount: 0,
				currentPage: page,
				totalPages: 0
			});
		}

		const totalCount = results[0].total_count || 0;

		const userList = results.map(({ id, username, handle, iq }) => ({ id, username, handle, iq }));

		return json({
			users: userList,
			totalCount,
			currentPage: page,
			totalPages: Math.ceil(totalCount / limit)
		});
	} catch (error) {
		console.error('Error fetching followers/following:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
