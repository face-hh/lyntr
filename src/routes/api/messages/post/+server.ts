import { json } from '@sveltejs/kit';
import type { Cookies, RequestHandler } from '@sveltejs/kit';
import { verifyAuthJWT } from '@/server/jwt';
import { db } from '@/server/db';
import { users, messages, followers, lynts, likes } from '@/server/schema';
import { eq, and, asc, desc, sql, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { Snowflake } from 'nodejs-snowflake';
import { uploadCompressed, lyntObj } from '../../util';
import { cdnUrl } from '../../../stores';
import { minioClient } from '@/server/minio';
import { sendMessage } from '@/sse';
import { isImageNsfw, NSFW_ERROR } from '@/moderation';
import { normalRatelimit } from '@/server/ratelimit';

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
		const { success } = await normalRatelimit.limit(user_id);
		if (!success) {
		        return json({ error: 'You are being ratelimited.' }, { status: 429 });
	        }

		const formData = await request.formData();
		const imageData = formData.get('image') as File;
		const other_id = formData.get('other_id') as string;
		const content = formData.get('content') as string;
		const referencedLyntId = formData.get('lynt') as string;

		if (!other_id) {
			return json({ error: 'Missing other id' }, { status: 403 });
		}

		if (other_id === user_id) {
			return json({ error: "You can't message yourself" }, { status: 400 });
		}

		if (((!content || content.trim() === '') && !imageData) && !referencedLyntId) {
			return json({ error: 'Empty Content' }, { status: 400 });
		}

		if (content && content.length > 2000) {
			return json({ error: 'Message is too long' }, { status: 400 });
		}

		let referencedLynt = undefined;
		if (referencedLyntId) {
			referencedLynt = (await db
				.select(lyntObj(user_id))
				.from(lynts)
				.leftJoin(likes, eq(likes.lynt_id, lynts.id))
	                        .leftJoin(users, eq(lynts.user_id, users.id))
				.where(eq(lynts.id, referencedLyntId))
				.limit(1))[0];

			if (!referencedLynt) {
				return json({ error: 'That is not a valid lynt' }, { status: 400 });
			}
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
			const inputBuffer = Buffer.from(await imageData.arrayBuffer());
			if (await isImageNsfw(inputBuffer)) {
				return NSFW_ERROR;
			}

			const fileName = user_id + '_' + String(idGenerator.getUniqueID());
			await uploadCompressed(inputBuffer, fileName, minioClient);
			image = fileName;
		}

		const parent = alias(users, 'parent');
		const [result] = await db
			.insert(messages)
			.values({
				sender_id: user_id,
				receiver_id: other_id,
				content: content || "",
				image,
				referencedLyntId: referencedLyntId || null
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
					},
				})
				.from(messages)
				.leftJoin(users, eq(users.id, messages.sender_id))
				.leftJoin(parent, eq(parent.id, messages.receiver_id))
				.where(eq(messages.id, result.id));

		if (!msg) {
			return json({ error: 'Failed to post message' }, { status: 500 });
		}

		const m = { ...msg, referenced_lynt: referencedLynt };
		sendMessage({ type: 'message', data: m }, other_id);
		return json({ message: m }, { status: 200 });
	} catch (error) {
		console.error('Authentication error:', error);
		return json({ error: 'Authentication failed' }, { status: 401 });
	}
};
