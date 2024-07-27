import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '@/server/db';
import { users } from '@/server/schema';
import { eq } from 'drizzle-orm';
import { supabase } from '@/supabase';
import { createAuthJWT } from '@/server/jwt';

export const GET: RequestHandler = async ({ request, url, cookies }) => {
	const email = url.searchParams.get('email');
	const supabaseToken = request.headers.get('Authorization')?.split('Bearer ')[1];

	if (!email || !supabaseToken) {
		return json({ error: 'Email and Authorization header are required' }, { status: 400 });
	}

	try {
		// Verify the Supabase token
		const { data, error } = await supabase.auth.getUser(supabaseToken);

		if (error || !data.user) {
			return json({ error: 'Invalid or expired session' }, { status: 401 });
		}

		// Check if the email in the token matches the requested email
		if (data.user.email !== email) {
			return json({ error: 'Unauthorized access' }, { status: 403 });
		}

		const result = await db
			.select({
				id: users.id,
				username: users.username,
				handle: users.handle,
				created_at: users.created_at,
				iq: users.iq
			})
			.from(users)
			.where(eq(users.email, email))
			.limit(1);

		if (result.length === 0) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		const user = result[0];

		// Generate a new JWT
		const jwt = await createAuthJWT({
			userId: user.id
		});

		// Set the new JWT as a cookie
		cookies.set('_TOKEN__DO_NOT_SHARE', jwt, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			maxAge: 31536000 // 1 year
		});

		return json(
			{
				id: user.id,
				username: user.username,
				handle: user.handle,
				created_at: user.created_at,
				iq: user.iq,
				token: jwt
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error('Error fetching user:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
