import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

import { verifyAuthJWT, deleteJWT, createAuthJWT } from '@/server/jwt';
import { db } from '@/server/db';
import { users } from '@/server/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, cookies }) => {
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

		const token = cookies.get('authToken');
		if (token) {
			await deleteJWT(token);
		}

		return json(
			{
				message: 'User banned successfully and token revoked'
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error('Error updating user:', error);
		return json({ error: 'Failed to update user' }, { status: 500 });
	}
};
