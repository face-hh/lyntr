import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import type { JWTPayload } from '$lib/server/jwt';
import { createAuthJWT, verifyAuthJWT } from '$lib/server/jwt'; // Implement this function to verify JWT
import { db } from '$lib/server/db'; // Assuming you have a db connection setup
import { lynts, likes, followers, history } from '$lib/server/schema'; // Import your schema
import { sql, desc, and, eq, not, exists } from 'drizzle-orm';

export const GET: RequestHandler = async ({ request }) => {
    
console.log(await createAuthJWT({ userId: 1503175031 }))
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    let userId: number;
    try {
        const payload: JWTPayload = await verifyAuthJWT(token);
        userId = payload.userId;
    } catch (error) {
        return json({ error: 'Invalid token' }, { status: 401 });
    }

    const feed = await db
        .select({
            id: lynts.id,
            content: lynts.content,
            userId: lynts.user_id,
            createdAt: lynts.created_at,
            likeCount: sql<number>`count(distinct ${likes.user_id})`,
            likedByFollowed: sql<boolean>`exists(
                select 1 from ${followers}
                where ${followers.user_id} = ${userId}
                and ${followers.follower_id} = ${likes.user_id}
            )`
        })
        .from(lynts)
        .leftJoin(likes, eq(likes.lynt_id, lynts.id))
        .where(
            not(
                exists(
                    db.select()
                        .from(history)
                        .where(and(
                            eq(history.user_id, userId),
                            eq(history.lynt_id, lynts.id)
                        ))
                )
            )
        )
        .groupBy(lynts.id)
        .orderBy(
            desc(sql`case when ${lynts.created_at} > now() - interval '7 days' then 1 else 0 end`),
            desc(sql`exists(
                select 1 from ${followers}
                where ${followers.user_id} = ${userId}
                and ${followers.follower_id} = ${likes.user_id}
            )`),
            desc(sql`count(distinct ${likes.user_id})`),
            desc(lynts.created_at)
        )
        .limit(50);

    return json(feed);
};