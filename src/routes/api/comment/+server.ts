import { json } from '@sveltejs/kit';
import type { Cookies, RequestHandler } from '@sveltejs/kit';
import { verifyAuthJWT } from '@/server/jwt';
import { db } from '@/server/db';
import { lynts, likes, users } from '@/server/schema';
import { eq, sql, isNull, not, and } from 'drizzle-orm';
import sanitizeHtml from 'sanitize-html';
import { Snowflake } from 'nodejs-snowflake';
import { createNotification } from '@/server/notifications';
import { lyntObj, uploadCompressed } from '../util';
import { minioClient } from '@/server/minio';

import { sensitiveRatelimit } from '@/server/ratelimit';
import { isImageNsfw, moderate, NSFW_ERROR } from '@/moderation';

export const POST: RequestHandler = async ({
	request,
	cookies
}: {
	request: Request;
	cookies: Cookies;
}) => {
	const authCookie = cookies.get('_TOKEN__DO_NOT_SHARE');

	if (!authCookie) {
		return json({ error: 'Missing authentication' }, { status: 401 });
	}

	let userId: string;

	try {
		const jwtPayload = await verifyAuthJWT(authCookie);

		userId = jwtPayload.userId;

		if (!userId) {
			throw new Error('Invalid JWT token');
		}
	} catch (error) {
		console.error('Authentication error:', error);
		return json({ error: 'Authentication failed' }, { status: 401 });
	}

	const { success } = await sensitiveRatelimit.limit(userId);
	if (!success) {
		return json({ error: 'You are being ratelimited.' }, { status: 429 });
	}

	const formData = await request.formData();

	const content = formData.get('content') as string;
	const id = formData.get('id') as string;
	const imageFile = formData.get('image') as File | null;

	if (typeof content !== 'string' ||
		content.length > 280 ||
		(content.trim() == '' && imageFile == null)) {
		return json({ error: 'Invalid content' }, { status: 400 });
	}

	try {
		const lyntId = new Snowflake({
			custom_epoch: new Date('2024-07-13T11:29:44.526Z').getTime()
		});

		const uniqueLyntId = String(lyntId.getUniqueID());

		let lyntValues: any = {
			id: uniqueLyntId,
			user_id: userId,
			content: content,
			has_link: content.includes('http')
		};

		if (imageFile) {
			const buffer = await imageFile.arrayBuffer();
			const inputBuffer = Buffer.from(buffer);

			if (await isImageNsfw(inputBuffer)) {
                                 return NSFW_ERROR;
                        }
	
			await uploadCompressed(inputBuffer, uniqueLyntId, minioClient);
			lyntValues.has_image = true;
		}

		const [existingLynt] = await db
			.select({ id: lynts.id, userId: lynts.user_id })
			.from(lynts)
			.where(eq(lynts.id, id))
			.limit(1);

		if (existingLynt) {
			lyntValues.parent = id;
		} else {
			return json({ error: 'Invalid reposted lynt ID' }, { status: 400 });
		}

		let newId = (await db.insert(lynts).values(lyntValues).returning())[0].id;
		await moderate(content, newId, userId);

		let [newLynt] = await db
			.select(lyntObj(userId))
			.from(lynts)
			.leftJoin(likes, eq(likes.lynt_id, lynts.id))
			.leftJoin(users, eq(lynts.user_id, users.id))
			.where(eq(lynts.id, newId))
			.limit(1);

		if (existingLynt.userId && existingLynt.userId !== userId) {
			await createNotification(existingLynt.userId, 'comment', userId, newLynt.id);
		}

		return json(newLynt, { status: 201 });
	} catch (error) {
		console.error('Error creating lynt:', error);
		return json({ error: 'Failed to create lynt' }, { status: 500 });
	}
};
