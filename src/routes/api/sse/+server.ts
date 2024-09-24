import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { addConnection, removeConnection } from '$lib/sse';
import { verifyAuthJWT } from '@/server/jwt';
import { db } from '@/server/db';
import { users, messages } from '@/server/schema';
import { eq, and, asc, desc, sql, or } from 'drizzle-orm';

export const GET: RequestHandler = async ({ setHeaders, cookies }) => {
	const authCookie = cookies.get('_TOKEN__DO_NOT_SHARE');
	let user = undefined;

        if (!authCookie) {
                return json({ error: 'Missing authentication' }, { status: 401 });
        }

	try {
		const jwtPayload = await verifyAuthJWT(authCookie);

                if (!jwtPayload.userId) {
                        throw new Error('Invalid JWT token');
                }

                user = (await db
                        .select({
                                id: users.id,
                                username: users.username,
                                handle: users.handle,
                                created_at: users.created_at,
                                iq: users.iq
                        })
                        .from(users)
                        .where(eq(users.id, jwtPayload.userId))
                        .limit(1))[0];

	} catch (error) {
		console.error('Authentication error:', error);
                return json({ error: 'Authentication failed' }, { status: 401 });
        }

        if (!user) {
                return json({ error: 'User not found' }, { status: 403 });
        }

	setHeaders({
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		'Connection': 'keep-alive',
		'X-Accel-Buffering': 'no'
	});

	const stream = new ReadableStream({
		start(controller) {
			addConnection(user.id, controller);

			const keepAliveInterval = setInterval(() => {
				try {
					controller.enqueue(': keep-alive\n\n');
				} catch (error) {
					clearInterval(keepAliveInterval);
					removeConnection(user.id, controller);
				}
			}, 20000); // Ping every 20 seconds

			return () => {
				removeConnection(user.id, controller);
				clearInterval(keepAliveInterval);
			};
		}
	});

	return new Response(stream);
};
