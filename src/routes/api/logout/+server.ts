import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '@/server/db';
import { users } from '@/server/schema';
import { eq } from 'drizzle-orm';
import { createAuthJWT, verifyAuthJWT } from '@/server/jwt';

export const POST: RequestHandler = async ({ request, url, cookies }) => {
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
		const result = await db
			.update(users)
			.set({ token: '' })
			.where(eq(users.id, userId))
			.returning();

		if (result.length === 0) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		cookies.delete('_TOKEN__DO_NOT_SHARE', {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			maxAge: 31536000 // 1 year
		});

		cookies.delete('temp-discord-token', {
			path: '/'
		});

		return json({}, { status: 200 });
	} catch (error) {
		console.error('Error fetching user:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
