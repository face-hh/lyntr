import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

import { db } from '@/server/db';
import { users, lynts } from '@/server/schema';
import { eq } from 'drizzle-orm';
import { deleteLynt } from '../util';

export const POST: RequestHandler = async ({ request }) => {
	const admin = request.headers.get('Authorization');
	if (admin !== process.env.ADMIN_KEY) {
		return json({ status: 404 });
	}

	const body = await request.json();
	const { userId } = body;

	if (!userId) {
		return json({ error: 'userId is required' }, { status: 400 });
	}

	try {
		const [updatedUser] = await db
			.update(users)
			.set({ banned: true })
			.where(eq(users.id, userId))
			.returning();

		if (!updatedUser) {
			return json({ error: 'User not found' }, { status: 404 });
		}

        setTimeout(async () => {
            try {
                const userLynts = await db
                    .select({ id: lynts.id })
                    .from(lynts)
                    .where(eq(lynts.user_id, userId));

                for (const lynt of userLynts) {
                    await deleteLynt(lynt.id);
                }
			} catch (error) {
                console.error('Error deleting lynts:', error);
            }
        }, 0);

		return json(
			{
				message: 'User banned successfully.'
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error('Error updating user:', error);
		return json({ error: 'Failed to update user' }, { status: 500 });
	}
};
