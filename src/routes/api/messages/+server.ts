import { json } from '@sveltejs/kit';
import type { Cookies, RequestHandler } from '@sveltejs/kit';
import { verifyAuthJWT } from '@/server/jwt';
import { db } from '@/server/db';
import { users, messages } from '@/server/schema';
import { eq, and, asc, desc, sql, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

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
		const other_id = url.searchParams.get('other_id');

		if (!other_id) {
			return json({ error: 'Missing other id' }, { status: 403 });
		}

		const parent = alias(users, 'parent');
		let msgs = await db
			.select({
				id: messages.id,
				sender: {
					id: users.id,
					username: users.username,
					handle: users.handle,
					iq: users.iq,
					verified: users.verified
				},
				receiver: {
					id: parent.id,
					username: parent.username,
					handle: parent.handle,
					iq: parent.iq,
					verified: parent.verified
				},
				content: messages.content,
				image: messages.image,
				read: messages.read,
				created_at: messages.created_at
			})
			.from(messages)
			.leftJoin(users, eq(messages.sender_id, users.id))
			.leftJoin(parent, eq(messages.receiver_id, parent.id))
			.where(
				and(
					or(eq(messages.sender_id, user_id), eq(messages.receiver_id, user_id)),
					or(eq(messages.sender_id, other_id), eq(messages.receiver_id, other_id))
				)
			)
			.orderBy(asc(messages.created_at), desc(messages.id))
			.limit(30);

		return json({ messages: msgs }, { status: 200 });
	} catch (error) {
		console.error('Authentication error:', error);
		return json({ error: 'Authentication failed' }, { status: 401 });
	}
};
