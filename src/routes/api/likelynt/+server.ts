import { json } from '@sveltejs/kit';
import type { Cookies, RequestHandler } from '@sveltejs/kit';
import { verifyAuthJWT } from '@/server/jwt';
import { db } from '@/server/db';
import { lynts, likes } from '@/server/schema';
import { eq, and } from 'drizzle-orm';
import { createNotification } from '@/server/notifications';
import { normalRatelimit } from '@/server/ratelimit';

// POST endpoint to like a lynt
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

	const body = await request.json();
	const { lyntId } = body;

	if (!lyntId || typeof lyntId !== 'string') {
		return json({ error: 'Invalid lynt ID' }, { status: 400 });
	}

	const { success } = await normalRatelimit.limit(userId);
	if (!success) {
		return json({ error: 'You are being ratelimited.' }, { status: 429 });
	}

	try {
		const [lynt] = await db.select().from(lynts).where(eq(lynts.id, lyntId)).limit(1);

		if (!lynt) {
			return json({ error: 'Lynt not found' }, { status: 404 });
		}

		const [existingLike] = await db
			.select()
			.from(likes)
			.where(and(eq(likes.lynt_id, lyntId), eq(likes.user_id, userId)))
			.limit(1);

		if (existingLike) {
			await db.delete(likes).where(and(eq(likes.lynt_id, lyntId), eq(likes.user_id, userId)));
			return json({ message: 'Lynt unliked successfully' });
		} else {
			await db.insert(likes).values({
				lynt_id: lyntId,
				user_id: userId
			});

			if (userId !== lynt.user_id && lynt.user_id) {
				await createNotification(lynt.user_id, 'like', userId, lyntId);
			}

			return json({ message: 'Lynt liked successfully' });
		}
	} catch (error) {
		console.error('Error liking/unliking lynt:', error);
		return json({ error: 'Failed to like/unlike lynt' }, { status: 500 });
	}
};
