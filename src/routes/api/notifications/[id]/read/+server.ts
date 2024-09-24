import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { verifyAuthJWT } from '@/server/jwt';
import { db } from '@/server/db';
import { notifications, users, lynts } from '@/server/schema';
import { eq, desc, count, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ cookies, params }) => {
	const authCookie = cookies.get('_TOKEN__DO_NOT_SHARE');

	if (!authCookie) {
		return json({ error: 'Missing authentication' }, { status: 401 });
	}

	try {
		const jwtPayload = await verifyAuthJWT(authCookie);

		if (!jwtPayload.userId) {
			throw new Error('Invalid JWT token');
		}

		const userId = jwtPayload.userId;

		const id = params.id;
                const notification = await db
                    .update(notifications)
                    .set({ read: true })
                    .where(and(eq(notifications.userId, userId), eq(notifications.id, id)))
                    .returning();

                if (notification[0]?.id === id) {
			return json({ id: notification.id }, { status: 200 });
                } else {
			return json({ error: "notification doesn't exist" }, { status: 404 });
		}
	} catch (error) {
		console.error('Error fetching notifications:', error);
		return json({ error: 'Failed to fetch notifications' }, { status: 500 });
	}
};
