import { json } from '@sveltejs/kit';
import type { Cookies, RequestHandler } from '@sveltejs/kit';
import { verifyAuthJWT } from '@/server/jwt';
import { db } from '@/server/db';
import { users, messages, lynts, likes } from '@/server/schema';
import { eq, and, asc, desc, sql, or, count } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { lyntObj } from '../util';

function removeDuplicates(arr: any[], key: string) {
    const ids = arr.map((a) => a[key]);
    return arr.filter((a, index) => !ids.includes(a[key], index + 1));
}

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
		const previous = url.searchParams.get('previous') || 0;

		if (!other_id) {
			return json({ error: 'Missing other id' }, { status: 403 });
		}

		if (previous < 0) {
			return json({ error: 'You can not load back negative' }, { status: 400 });
		}

		const parent = alias(users, 'parent');
		let sq = db
			.select({
				id: messages.id,
				content: messages.content,
				image: messages.image,
				read: messages.read,
				created_at: messages.created_at,
				sender_id: sql<string>`${users.id}`.as('sender_id'),
				sender_username: sql<string>`${users.username}`.as('sender_username'),
				sender_handle: sql<string>`${users.handle}`.as('sender_handle'),
				sender_iq: sql<number>`${users.iq}`.as('sender_iq'),
				sender_verified: sql<boolean>`${users.verified}`.as('sender_verified'),
				receiver_id: sql<string>`${parent.id}`.as('receiver_id'),
				receiver_username: sql<string>`${parent.username}`.as('receiver_username'),
				receiver_handle: sql<string>`${parent.handle}`.as('receiver_handle'),
				receiver_iq: sql<number>`${parent.iq}`.as('receiver_iq'),
				receiver_verified: sql<boolean>`${parent.verified}`.as('receiver_verified'),
				referenced_lynt_id: messages.referencedLyntId,
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
			.orderBy(desc(messages.id))
			.limit(30)
			.offset(previous * 30)
			.as('sq');
		const msgs = await db
			.select({
				id: sq.id,
				content: sq.content,
				image: sq.image,
				read: sq.read,
				created_at: sq.created_at,
				sender: {
					id: sq.sender_id,
					username: sq.sender_username,
					handle: sq.sender_handle,
					iq: sq.sender_iq,
					verified: sq.sender_verified
				},
				receiver: {
					id: sq.receiver_id,
					username: sq.receiver_username,
					handle: sq.receiver_handle,
					iq: sq.receiver_iq,
					verified: sq.receiver_verified
				},
				referenced_lynt: lyntObj(user_id)
			})
			.from(sq)
			.leftJoin(lynts, eq(lynts.id, sq.referenced_lynt_id))
			.leftJoin(likes, eq(likes.lynt_id, lynts.id))
	                .leftJoin(users, eq(lynts.user_id, users.id))
			.orderBy(asc(sq.created_at));

		return json({ messages: removeDuplicates(msgs, 'id') }, { status: 200 });
	} catch (error) {
		console.error('Authentication error:', error);
		return json({ error: 'Authentication failed' }, { status: 401 });
	}
};
