import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { verifyAuthJWT } from '@/server/jwt';
import { db } from '@/server/db';
import { lynts, likes, users } from '@/server/schema';
import { eq, sql } from 'drizzle-orm';

// POST endpoint to create a new lynt
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

    // Parse request body
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string' || content.length > 280) {
        return json({ error: 'Invalid content' }, { status: 400 });
    }

    // Create new lynt
    try {
        const [newLynt] = await db.insert(lynts).values({
            id: userId,
            content,
            has_link: content.includes('http'),
        }).returning();

        return json(newLynt, { status: 201 });
    } catch (error) {
        console.error('Error creating lynt:', error);
        return json({ error: 'Failed to create lynt' }, { status: 500 });
    }
};

// GET endpoint to fetch a lynt by ID
export const GET: RequestHandler = async ({ url, request }: { url: URL, request: Request }) => {
    const lyntId = url.searchParams.get('id');

    if (!lyntId) {
        return json({ error: 'Missing lynt ID' }, { status: 400 });
    }

    try {
        const [lynt] = await db
            .select({
                id: lynts.id,
                content: lynts.content,
                createdAt: lynts.created_at,
                views: lynts.views,
                shares: lynts.shares,
                hasLink: lynts.has_link,
                userId: lynts.user_id,
                username: users.username,
                handle: users.handle,
                profilePicture: users.profile_picture,
                verified: users.verified,
                likeCount: sql<number>`(SELECT COUNT(*) FROM ${likes} WHERE ${likes.lynt_id} = ${lynts.id})`.as('likeCount'),
            })
            .from(lynts)
            .leftJoin(users, eq(lynts.user_id, users.id))
            .where(eq(lynts.id, lyntId))
            .limit(1);

        if (!lynt) {
            return json({ error: 'Lynt not found' }, { status: 404 });
        }

        // Increment view count
        await db.execute(sql`UPDATE ${lynts} SET views = views + 1 WHERE id = ${parseInt(lyntId)}`);

        return json(lynt);
    } catch (error) {
        console.error('Error fetching lynt:', error);
        return json({ error: 'Failed to fetch lynt' }, { status: 500 });
    }
};