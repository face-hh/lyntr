// src/routes/api/add-fake-followers/+server.ts

import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '@/server/db';
import { users, followers } from '@/server/schema';
import { verifyAuthJWT } from '@/server/jwt';

function generateFakeUser(i: number) {
    return {
        id: crypto.randomUUID(),
        username: `Fake User ${i}`,
        handle: `${Math.random()}`,
        email: `fake_user_${i}@example.com`,
        password_hash: 'not_a_real_hash',
        created_at: new Date(),
        updated_at: new Date(),
        iq: Math.floor(Math.random() * 100) + 50, // Random IQ between 50 and 150
    };
}

export const POST: RequestHandler = async ({ request, cookies }) => {
    const token = cookies.get('_TOKEN__DO_NOT_SHARE');
    if (!token) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }
    const payload = await verifyAuthJWT(token);
    if (!payload) {
        return json({ error: 'Invalid token' }, { status: 401 });
    }

    const { userId, count = 1000 } = await request.json();

    if (!userId) {
        return json({ error: 'Missing userId' }, { status: 400 });
    }

    try {
        const fakeUsers = Array.from({ length: count }, (_, i) => generateFakeUser(i));

        // Insert fake users
        await db.insert(users).values(fakeUsers);

        // Create follower relationships
        const followerRelationships = fakeUsers.map(user => ({
            user_id: userId,
            follower_id: user.id,
            created_at: new Date(),
        }));

        await db.insert(followers).values(followerRelationships);

        return json({ message: `Successfully added ${count} fake followers`, count });
    } catch (error) {
        console.error('Error adding fake followers:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
};