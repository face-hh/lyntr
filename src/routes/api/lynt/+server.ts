import { json } from '@sveltejs/kit';
import type { Cookies, RequestHandler } from '@sveltejs/kit';
import { verifyAuthJWT } from '@/server/jwt';
import { db } from '@/server/db';
import { lynts, users } from '@/server/schema';
import { eq, sql } from 'drizzle-orm';
import { Snowflake } from 'nodejs-snowflake';
import sharp from 'sharp';
import { minioClient } from '@/server/minio';
import { deleteLynt, lyntObj, uploadCompressed } from '../util';
import { sendMessage } from '@/sse';
import { isImageNsfw, moderate, NSFW_ERROR } from '@/moderation';
import { sensitiveRatelimit } from '@/server/ratelimit';
import { fetchReferencedLynts } from "../util"

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

	let content = formData.get('content') as string;
	const imageFile = formData.get('image') as File | null;
	const reposted = formData.get('reposted') as string;

	const hasImageOrRepost = imageFile != null || reposted != null;
	
	if (!content) content = '';

	if (content.length > 280 || (content.trim() == '' && !hasImageOrRepost)) {
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

		if (reposted) {
			const [existingLynt] = await db
				.select({ id: lynts.id })
				.from(lynts)
				.where(eq(lynts.id, reposted))
				.limit(1);

			if (existingLynt) {
				lyntValues.reposted = true;
				lyntValues.parent = reposted;
			} else {
				return json({ error: 'Invalid reposted lynt ID' }, { status: 400 });
			}
		}

		if (imageFile) {
			const buffer = await imageFile.arrayBuffer();
			const inputBuffer = Buffer.from(buffer);

			if (await isImageNsfw(inputBuffer)) {
				return NSFW_ERROR;
			}

			await uploadCompressed(inputBuffer, uniqueLyntId, minioClient);
			lyntValues.has_image = true;
		}

		const [newLynt] = await db.insert(lynts).values(lyntValues).returning();
		await moderate(content, newLynt.id, userId);

		sendMessage({ type: 'lynt_add', data: uniqueLyntId });

		return json(newLynt, { status: 201 });
	} catch (error) {
		console.error('Error creating lynt:', error);
		return json({ error: 'Failed to create lynt' }, { status: 500 });
	}
};

export const GET: RequestHandler = async ({
	url,
	request,
	cookies
}: {
	url: URL;
	request: Request;
	cookies: Cookies;
}) => {
	let userId: string | null;

	const authCookie = cookies.get('_TOKEN__DO_NOT_SHARE');
	const admin = request.headers.get('Authorization');

	if (admin === process.env.ADMIN_KEY && process.env.SUDO_USER_ID) {
		userId = process.env.SUDO_USER_ID;
	} else {
		try {
			const jwtPayload = await verifyAuthJWT(authCookie);

			userId = jwtPayload.userId;

			if (!userId) {
				throw new Error('Invalid JWT token');
			}
		} catch (error) {
			userId = null
		}
	}
	const lyntId = url.searchParams.get('id');

	if (!lyntId) {
		return json({ error: 'Missing lynt ID' }, { status: 400 });
	}

	try {
		const lyntobj = lyntObj(userId);

		const [lynt] = await db
			.select({ ...lyntobj, parent: lynts.parent })
			.from(lynts)
			.leftJoin(users, eq(lynts.user_id, users.id))
			.where(eq(lynts.id, lyntId))
			.limit(1);

		if (!lynt) {
			return json({ error: 'Lynt not found' }, { status: 404 });
		}

		await db.execute(sql`UPDATE ${lynts} SET views = views + 1 WHERE id = ${lyntId}`);

		const referencedLynts = await fetchReferencedLynts(userId, lynt.parent);

		return json({ ...lynt, referencedLynts });
	} catch (error) {
		console.error('Error fetching lynt:', error);
		return json({ error: 'Failed to fetch lynt' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({
	request,
	url,
	cookies
}: {
	request: Request;
	url: URL;
	cookies: Cookies;
}) => {
	const admin = request.headers.get('Authorization');
	const lyntId = url.searchParams.get('id');

	if (!lyntId) {
		return json({ error: 'Missing lynt ID' }, { status: 400 });
	}

	if (admin === process.env.ADMIN_KEY) {
		await deleteLynt(lyntId);
		return json({ message: 'Done' }, { status: 200 });
	}

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

	try {
		// Check if the lynt exists and belongs to the authenticated user
		const [lynt] = await db
			.select({ id: lynts.id, user_id: lynts.user_id })
			.from(lynts)
			.where(eq(lynts.id, lyntId))
			.limit(1);

		if (!lynt) {
			return json({ error: 'Lynt not found' }, { status: 404 });
		}

		if (lynt.user_id !== userId) {
			return json({ error: 'Unauthorized to delete this lynt' }, { status: 403 });
		}

		await deleteLynt(lyntId);

		return json({ message: 'Lynt and related data deleted successfully' }, { status: 200 });
	} catch (error) {
		console.error('Error deleting lynt:', error);
		return json({ error: 'Failed to delete lynt' }, { status: 500 });
	}
};
