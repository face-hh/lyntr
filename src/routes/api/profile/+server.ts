import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { verifyAuthJWT } from '@/server/jwt';
import { db } from '@/server/db';
import { users } from '@/server/schema';
import { sql } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request }: { request: Request }) => {
    // Verify JWT
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    let userId: string;
    try {
        const payload = await verifyAuthJWT(token);
        userId = payload.userId;
    } catch (error) {
        return json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.handle || !body.iq || !body.username) {
        return json({ error: 'Invalid request - missing fields.' }, { status: 400 });
    }
    
    if (body.handle.length > 32 || body.username.length > 60) {
        return json({ error: 'Handle (32) or username (60) are over the character limit.' }, { status: 400 });
    }

    try {
        const [newLynt] = await db.insert(users).values({
            'id': userId,
            'handle': body.handle,
            'iq': body.iq,
            'username': body.username 
        }).returning();

        return json(newLynt, { status: 201 });
    } catch (error) {
        console.error('Error creating user:', error);
        return json({ error: 'Failed to create user.' }, { status: 500 });
    }
};

export const GET: RequestHandler = async ({ url }) => {
    const userHandle = url.searchParams.get('handle');
    const userId = url.searchParams.get('id');

    if (!userHandle && !userId) {
        return json({ error: 'Missing user handle or id.' }, { status: 400 });
    }

    try {
        // fuck you and your types annoying language
        const query = sql`
            SELECT id, handle, created_at, username, iq
            FROM ${users}
            WHERE ${userHandle ? sql`handle = ${userHandle}` : sql`id = ${userId}`}
            LIMIT 1
        `;

        const result = await db.execute(query);
        const user = result[0];

        if (!user) {
            return json({ error: 'User not found' }, { status: 404 });
        }

        return json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        return json({ error: 'Failed to fetch user' }, { status: 500 });
    }
};