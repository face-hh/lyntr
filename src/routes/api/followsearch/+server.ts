import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '@/server/db';
import { followers, users } from '@/server/schema';
import { like, and, or, sql, eq } from 'drizzle-orm';
import { verifyAuthJWT } from '@/server/jwt';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const token = cookies.get('_TOKEN__DO_NOT_SHARE');
	if (!token) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	const payload = await verifyAuthJWT(token);
	if (!payload) {
		return json({ error: 'Invalid token' }, { status: 401 });
	}

	const query = url.searchParams.get('q');
	const type = url.searchParams.get('type'); // 'followers' or 'following'
	const userId = url.searchParams.get('userId');
	const page = parseInt(url.searchParams.get('page') || '1', 10);
	const limit = 20;
	const offset = (page - 1) * limit;

	if (!query) {
		return json({ error: 'Missing search query' }, { status: 400 });
	}

	try {
		let baseQuery = db
			.select({
				id: users.id,
				username: users.username,
				handle: users.handle,
				iq: users.iq
			})
			.from(users)
			.where(or(like(users.username, `%${query}%`), like(users.handle, `%${query}%`)))
			.limit(limit)
			.offset(offset);

		// If type and userId are provided, filter by followers/following
		if (type && userId) {
			if (type === 'followers') {
				baseQuery = baseQuery.innerJoin(
					followers,
					and(eq(followers.follower_id, users.id), eq(followers.user_id, userId))
				);
			} else if (type === 'following') {
				baseQuery = baseQuery.innerJoin(
					followers,
					and(eq(followers.user_id, users.id), eq(followers.follower_id, userId))
				);
			}
		}

		const results = await baseQuery.execute();

		// Get total count for pagination
		const countQuery = db
			.select({ count: sql<number>`count(*)` })
			.from(users)
			.where(or(like(users.username, `%${query}%`), like(users.handle, `%${query}%`)));

		const [{ count }] = await countQuery.execute();

		return json({
			users: results,
			totalCount: count,
			currentPage: page,
			totalPages: Math.ceil(count / limit)
		});
	} catch (error) {
		console.error('Error searching users:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
