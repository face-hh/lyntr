import { json } from '@sveltejs/kit';
import type { Cookies, RequestHandler } from '@sveltejs/kit';
import { verifyAuthJWT } from '@/server/jwt';
import { db } from '@/server/db';
import { lynts, likes, users } from '@/server/schema';
import { eq, sql } from 'drizzle-orm';
import sanitizeHtml from 'sanitize-html';
import { Snowflake } from 'nodejs-snowflake';

export const POST: RequestHandler = async ({ request, cookies }: { request: Request, cookies: Cookies }) => {
    const authCookie = cookies.get('_TOKEN__DO_NOT_SHARE');

    if (!authCookie) {
        return json({ error: 'Missing authentication' }, { status: 401 });
    }

    let userId: string;

    try {
        const jwtPayload = await verifyAuthJWT(authCookie);
        
        userId = jwtPayload.userId

        if (!userId) {
            throw new Error('Invalid JWT token');
        }
    } catch (error) {
        console.error('Authentication error:', error);
        return json({ error: 'Authentication failed' }, { status: 401 });
    }

    const body = await request.json();
    const { content, reposted } = body;
    
    if (!content || typeof content !== 'string' || content.length > 280) {
        return json({ error: 'Invalid content' }, { status: 400 });
    }

    let cleanedContent = sanitizeHtml(content);

    try {
        const lyntId = new Snowflake({
            custom_epoch: new Date("2024-07-13T11:29:44.526Z").getTime(),
        });

        const uniqueLyntId = String(lyntId.getUniqueID());

        let lyntValues: any = {
            id: uniqueLyntId,
            user_id: userId,
            content: cleanedContent,
            has_link: cleanedContent.includes('http'),
        };

        // Check if reposted is provided and is a valid lynt ID
        if (reposted) {
            const [existingLynt] = await db
                .select({ id: lynts.id })
                .from(lynts)
                .where(eq(lynts.id, reposted))
                .limit(1);

            if (existingLynt) {
                lyntValues.reposted = true;
                lyntValues.parent = reposted;
            } else {
                return json({ error: 'Invalid reposted lynt ID' }, { status: 400 });
            }
        }

        const [newLynt] = await db.insert(lynts).values(lyntValues).returning();

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
                iq: users.iq,
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