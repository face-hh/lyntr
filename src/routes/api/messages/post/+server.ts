import { json } from '@sveltejs/kit';
import type { Cookies, RequestHandler } from '@sveltejs/kit';
import { verifyAuthJWT } from '@/server/jwt';
import { db } from '@/server/db';
import { users, messages, followers } from '@/server/schema';
import { eq, and, asc, desc, sql, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { Snowflake } from 'nodejs-snowflake';
import { uploadCompressed } from '../../util';
import { cdnUrl } from '../../../stores';
import { minioClient } from '@/server/minio';
import { sendMessage } from '@/sse';

const ratelimits = new Map();

export const POST: RequestHandler = async ({ request, cookies, url }) => {
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

		const ratelimit = ratelimits.get(user_id);
		if (!ratelimit) {
			ratelimits.set(user_id, Date.now());
		} else if (Math.round((Date.now() - ratelimit) / 1000) < 5) {
			return json({ error: 'You are ratelimited.' }, { status: 429 });
		} else {
			ratelimits.delete(user_id);
		}

		const formData = await request.formData();
		const imageData = formData.get('image') as File;
		const other_id = formData.get('other_id') as string;
		const content = formData.get('content') as string;

		if (!other_id) {
			return json({ error: 'Missing other id' }, { status: 403 });
		}

		if (other_id === user_id) {
			return json({ error: "You can't message yourself" }, { status: 400 });
		}

		if (content.trim() === '' && !imageData) {
			return json({ error: 'Empty Content' }, { status: 400 });
		}

		if (content.length > 2000) {
			return json({ error: 'Message is too long' }, { status: 400 });
		}

		const following = await db
			.select()
			.from(followers)
			.where(
				and(
					or(eq(followers.user_id, user_id), eq(followers.follower_id, user_id)),
					or(eq(followers.user_id, other_id), eq(followers.follower_id, other_id))
				)
			);

		if (following.length !== 2) {
			return json({ error: "You can't send a message to this user" }, { status: 401 });
		}

		const idGenerator = new Snowflake({
			custom_epoch: new Date('2024-07-13T11:29:44.526Z').getTime()
		});

		let image = null;

		if (imageData) {
			const fileName = user_id + '_' + String(idGenerator.getUniqueID());
			await uploadCompressed(Buffer.from(await imageData.arrayBuffer()), fileName, minioClient);
			image = fileName;
		}

		const parent = alias(users, 'parent');
		const [result] = await db
			.insert(messages)
			.values({
				sender_id: user_id,
				receiver_id: other_id,
				content,
				image
			})
			.returning();
		const [msg] = await db
			.select({
				id: messages.id,
				content: messages.content,
				created_at: messages.created_at,
				read: messages.read,
				image: messages.image,
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
				}
			})
			.from(messages)
			.leftJoin(users, eq(users.id, messages.sender_id))
			.leftJoin(parent, eq(parent.id, messages.receiver_id))
			.where(eq(messages.id, result.id));

		if (!msg) {
			return json({ error: 'Failed to post message' }, { status: 500 });
		}

		sendMessage({ type: 'message', data: msg }, other_id);
		return json({ message: msg }, { status: 200 });
	} catch (error) {
		console.error('Authentication error:', error);
		return json({ error: 'Authentication failed' }, { status: 401 });
	}
};