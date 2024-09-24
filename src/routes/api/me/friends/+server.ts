import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { verifyAuthJWT } from '@/server/jwt';
import { db } from '@/server/db';
import { users, followers, messages } from '@/server/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

const LIMIT = 30;

export const GET: RequestHandler = async ({ request, cookies, url }) => {
	const authCookie = cookies.get('_TOKEN__DO_NOT_SHARE');

	if (!authCookie) {
		return json({ error: 'Missing authentication' }, { status: 401 });
	}

	try {
		const jwtPayload = await verifyAuthJWT(authCookie);

		if (!jwtPayload.userId) {
			throw new Error('Invalid JWT token');
		}

		const user = await db
			.select({
				id: users.id,
				username: users.username,
				handle: users.handle,
				created_at: users.created_at,
				iq: users.iq
			})
			.from(users)
			.where(eq(users.id, jwtPayload.userId))
			.limit(1);

		if (user.length === 0) {
			return json({ error: 'User not found' }, { status: 403 });
		}

		const user_id = user[0].id;

		const page = (parseInt(url.searchParams.get('page')) || 1) - 1;
		if (page < 0) {
			return json({}, { status: 400 });
		}

		const unreadCount = db.select({
			count: sql<number>`cast(count(*) as integer)`.mapWith(Number)
		})
		.from(messages)
		.where(
			and(
				eq(messages.sender_id, users.id),
				eq(messages.receiver_id, user_id),
				eq(messages.read, false)
			)
		);

		const friends = await db
			.select({
				id: users.id,
				username: users.username,
				handle: users.handle,
				verified: users.verified,
				iq: users.iq,
				unread: sql<number>`(${unreadCount})`.mapWith(Number)
			})
			.from(users)
			.innerJoin(followers, eq(users.id, followers.follower_id))
			.innerJoin(alias(followers, 'f2'), eq(users.id, followers.follower_id))
			.where(
				and(
					eq(followers.user_id, user_id),
					eq(followers.follower_id, users.id),
					eq(alias(followers, 'f2').user_id, users.id),
					eq(alias(followers, 'f2').follower_id, user_id)
				)
			)
			.orderBy(desc(users.iq))
			.limit(LIMIT)
			.offset(page * LIMIT)
			.execute();

		return json(
			{
				friends,
				isLast: friends.length < LIMIT
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error('Authentication error:', error);
		return json({ error: 'Authentication failed' }, { status: 401 });
	}
};
