import { json } from '@sveltejs/kit';
import type { Cookies, RequestHandler } from '@sveltejs/kit';
import { verifyAuthJWT } from '@/server/jwt';
import { db } from '@/server/db';
import { lynts, likes, users } from '@/server/schema';
import { eq, sql } from 'drizzle-orm';
import sanitizeHtml from 'sanitize-html';
import { Snowflake } from 'nodejs-snowflake';
import { createNotification } from '@/server/notifications';

const ratelimits = new Map();

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
    const ratelimit = ratelimits.get(userId);

    if (!ratelimit) {
        ratelimits.set(userId, Date.now())
    } else if (Math.round((Date.now() - ratelimit) / 1000) < 5) {
        return json({ error: "You are ratelimited." }, { status: 429 })
    } else {
        ratelimits.delete(userId)
    }

    const body = await request.json();
    const { content, id } = body;

    if (!content || typeof content !== 'string' || content.length > 280) {
        return json({ error: 'Invalid content' }, { status: 400 });
    }

    try {
        const lyntId = new Snowflake({
            custom_epoch: new Date("2024-07-13T11:29:44.526Z").getTime(),
        });

        const uniqueLyntId = String(lyntId.getUniqueID());

        let lyntValues: any = {
            id: uniqueLyntId,
            user_id: userId,
            content: content,
            has_link: content.includes('http'),
        };

        const [existingLynt] = await db
            .select({ id: lynts.id, userId: lynts.user_id })
            .from(lynts)
            .where(eq(lynts.id, id))
            .limit(1);

        if (existingLynt) {
            lyntValues.parent = id
        } else {
            return json({ error: 'Invalid reposted lynt ID' }, { status: 400 });
        }

        const [newLynt] = await db.insert(lynts).values(lyntValues).returning();

        if (existingLynt.userId && existingLynt.userId !== userId) {
            await createNotification(existingLynt.userId, 'comment', userId, newLynt.id);
        }

        return json(newLynt, { status: 201 });
    } catch (error) {
        console.error('Error creating lynt:', error);
        return json({ error: 'Failed to create lynt' }, { status: 500 });
    }
};