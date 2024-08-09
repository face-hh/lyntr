import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

import { db } from '@/server/db';
import { users } from '@/server/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, cookies, url }) => {
	const admin = request.headers.get('Authorization');
	if (admin !== process.env.ADMIN_KEY) {
		return json({ status: 404 });
	}
	const handle = url.searchParams.get('handle') || '';

	if (!handle) {
		return json({ error: 'Handle is required' }, { status: 400 });
	}

	try {
		const [updatedUser] = await db
			.update(users)
			.set({ banned: false })
			.where(eq(users.handle, handle))
			.returning();

		if (!updatedUser) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		return json(
			{
				message: 'User unbanned successfully.'
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error('Error updating user:', error);
		return json({ error: 'Failed to update user' }, { status: 500 });
	}
};
