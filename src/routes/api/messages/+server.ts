import { json } from '@sveltejs/kit';
import type { Cookies, RequestHandler } from '@sveltejs/kit';
import { verifyAuthJWT } from '@/server/jwt';
import { db } from '@/server/db';
import { users, messages } from '@/server/schema';
import { eq, and, asc, sql, or } from 'drizzle-orm';
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

		const sender = db.select({
			id: users.id,
			username: users.username,
			handle: users.handle,
			iq: users.iq,
			verified: users.verified
		}).from(users).as("sender");

		const receiver = db.select({
			id: users.id,
			username: users.username,
			handle: users.handle,
			iq: users.iq,
			verified: users.verified
		}).from(users).as("receiver");

		let msgs = await db
			.select({
				id: messages.id,
				sender: {
					id: sender.id, 
					username: sender.username, 
					handle: sender.handle,
					iq: sender.iq, 
					verified: sender.verified
				},
				receiver: {
					id: receiver.id, 
					username: receiver.username, 
					handle: receiver.handle,
					iq: receiver.iq, 
					verified: receiver.verified
				},
				content: messages.content,
				image: messages.image,
				read: messages.read,
				created_at: messages.created_at
			})
			.from(messages)
			.fullJoin(sender, eq(messages.sender_id, sender.id))
			.fullJoin(receiver, eq(messages.receiver_id, receiver.id))
			.where(or(
				eq(messages.sender_id, user_id),
				eq(messages.receiver_id, user_id)
			))
			.orderBy(asc(messages.created_at))
			.limit(30)

		console.log(msgs);
		return json({ messages: msgs }, { status: 200 });
	} catch (error) {
		console.error('Authentication error:', error);
		return json({ error: 'Authentication failed' }, { status: 401 });
	}
};
