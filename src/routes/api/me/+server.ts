import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { verifyAuthJWT } from '@/server/jwt';
import { db } from '@/server/db';
import { users } from '@/server/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ request, cookies }) => {
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

		return json(
			{
				id: user[0].id,
				username: user[0].username,
				handle: user[0].handle,
				created_at: user[0].created_at,
				iq: user[0].iq
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error('Authentication error:', error);
		return json({ error: 'Authentication failed' }, { status: 401 });
	}
};
