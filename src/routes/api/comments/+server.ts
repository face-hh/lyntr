import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { verifyAuthJWT } from '@/server/jwt';
import { db } from '@/server/db';
import { lynts, likes, users } from '@/server/schema';
import { sql, desc, and, eq, not, exists } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url, cookies }) => {
    const lyntId = url.searchParams.get('id');
    const authCookie = cookies.get('_TOKEN__DO_NOT_SHARE');

    if (!lyntId) {
        return json({ error: 'Missing lynt ID' }, { status: 400 });
    }

    if (!authCookie) {
        return json({ error: 'Missing authentication' }, { status: 401 });
    }

    try {
        const jwtPayload = await verifyAuthJWT(authCookie);
        
        if (!jwtPayload.userId) {
            throw new Error('Invalid JWT token');
        }

        const userId = jwtPayload.userId;

        // First, get the comments that the user has replied to
        const userReplies = await db
            .select({
                id: lynts.id,
                content: lynts.content,
                userId: lynts.user_id,
                createdAt: lynts.created_at,
                likeCount: sql<number>`count(distinct ${likes.user_id})`,
                handle: users.handle,
                username: users.username,
                iq: users.iq,
                verified: users.verified,
            })
            .from(lynts)
            .leftJoin(likes, eq(likes.lynt_id, lynts.id))
            .leftJoin(users, eq(lynts.user_id, users.id))
            .where(and(
                eq(lynts.parent, lyntId),
                eq(lynts.reposted, false),
                exists(
                    db.select()
                        .from(lynts)
                        .where(and(
                            eq(lynts.parent, lynts.id),
                            eq(lynts.user_id, userId)
                        ))
                )
            ))
            .groupBy(lynts.id, users.id)
            .orderBy(desc(lynts.created_at));

        // Then, get the most liked comments
        const mostLikedComments = await db
            .select({
                id: lynts.id,
                content: lynts.content,
                userId: lynts.user_id,
                createdAt: lynts.created_at,
                likeCount: sql<number>`count(distinct ${likes.user_id})`,
                handle: users.handle,
                username: users.username,
                iq: users.iq,
                verified: users.verified,
            })
            .from(lynts)
            .leftJoin(likes, eq(likes.lynt_id, lynts.id))
            .leftJoin(users, eq(lynts.user_id, users.id))
            .where(and(
                eq(lynts.parent, lyntId),
                eq(lynts.reposted, false),
                not(eq(lynts.id, sql`ANY(${sql`ARRAY[${sql.join(userReplies.map(reply => reply.id))}]`})`))
            ))
            .groupBy(lynts.id, users.id)
            .orderBy(desc(sql`count(distinct ${likes.user_id})`), desc(lynts.created_at))
            .limit(50 - userReplies.length);

        const comments = [...userReplies, ...mostLikedComments];

        return json(comments, { status: 200 });

    } catch (error) {
        console.error('Error fetching comments:', error);
        return json({ error: 'Failed to fetch comments' }, { status: 500 });
    }
};