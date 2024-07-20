import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { verifyAuthJWT } from '@/server/jwt';
import { db } from '@/server/db';
import { lynts, likes, followers, history, users } from '@/server/schema';
import { sql, desc, and, eq, not, exists, or, isNull, isNotNull } from 'drizzle-orm';
import { lyntObj } from '../util';

export const GET: RequestHandler = async ({ request, cookies, url }) => {
    const authCookie = cookies.get('_TOKEN__DO_NOT_SHARE');
    const handle = url.searchParams.get('handle');
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = 50;

    if (!authCookie) {
        return json({ error: 'Missing authentication' }, { status: 401 });
    }

    try {
        const jwtPayload = await verifyAuthJWT(authCookie);

        if (!jwtPayload.userId) {
            throw new Error('Invalid JWT token');
        }

        const userId = jwtPayload.userId;

        if (handle) {
            // Get the user ID from the handle
            const userResult = await db.select({ id: users.id }).from(users).where(eq(users.handle, handle)).limit(1);
            const user = userResult[0];

            if (!user) {
                return json({ error: 'User not found' }, { status: 404 });
            }

            // Get total count of lynts for this user
            const totalLyntsResult = await db.select({ count: sql<number>`count(*)` }).from(lynts).where(eq(lynts.user_id, user.id));
            const totalLynts = totalLyntsResult[0].count;

            // Get lynts for this user with pagination
            const lyntsResult = await db
                .select(lyntObj(userId))
                .from(lynts)
                .leftJoin(likes, eq(likes.lynt_id, lynts.id))
                .leftJoin(users, eq(lynts.user_id, users.id))
                .where(
                    and(
                        eq(lynts.user_id, user.id),
                        or(
                            and(
                                eq(lynts.reposted, false),
                                isNull(lynts.parent)
                            ),
                            eq(lynts.reposted, true)
                        )
                    )
                ).groupBy(lynts.id, users.id)
                .orderBy(desc(lynts.created_at))
                .limit(pageSize)
                .offset((page - 1) * pageSize);

            return json({
                lynts: lyntsResult,
                total: totalLynts,
                page: page,
                pageSize: pageSize,
                totalPages: Math.ceil(totalLynts / pageSize)
            });
        } else {
            const feed = await db
                .select(lyntObj(userId))
                .from(lynts)
                .leftJoin(likes, eq(likes.lynt_id, lynts.id))
                .leftJoin(users, eq(lynts.user_id, users.id))
                .where(
                    and(
                        not(
                            exists(
                                db.select()
                                    .from(history)
                                    .where(and(
                                        eq(history.user_id, userId),
                                        eq(history.lynt_id, lynts.id)
                                    ))
                            )
                        ),
                        or(
                            isNull(lynts.parent),
                            eq(lynts.reposted, true)
                        )
                    )
                )
                .groupBy(lynts.id, users.id)
                .orderBy(
                    desc(sql`case when ${lynts.created_at} > now() - interval '7 days' then 1 else 0 end`),
                    desc(sql`exists(
                        select 1 from ${followers}
                        where ${followers.user_id} = ${userId}
                        and ${followers.follower_id} = ${lynts.user_id}
                    )`),
                    desc(sql`count(distinct ${likes.user_id})`),
                    desc(lynts.created_at)
                )
                .limit(pageSize)
                .offset((page - 1) * pageSize);

            // Increment view counts in the background
            incrementViewCounts(feed.map(lynt => lynt.id));

            // Get total count for the feed
            const totalFeedCountResult = await db.select({ count: sql<number>`count(*)` }).from(lynts)
                .where(
                    and(
                        not(
                            exists(
                                db.select()
                                    .from(history)
                                    .where(and(
                                        eq(history.user_id, userId),
                                        eq(history.lynt_id, lynts.id)
                                    ))
                            )
                        ),
                        or(
                            isNull(lynts.parent),
                            eq(lynts.reposted, true)
                        )
                    )
                );
            const totalFeedCount = totalFeedCountResult[0].count;

            return json({
                lynts: feed,
                total: totalFeedCount,
                page: page,
                pageSize: pageSize,
                totalPages: Math.ceil(totalFeedCount / pageSize)
            });
        }
    } catch (error) {
        console.error('Authentication error:', error);
        return json({ error: 'Authentication failed' }, { status: 401 });
    }
};

async function incrementViewCounts(lyntIds: string[]) {
    try {
        await db.transaction(async (tx) => {
            await Promise.all(lyntIds.map(id =>
                tx.update(lynts).set({ views: sql`views + 1` }).where(eq(lynts.id, id))
            ));
        });
    } catch (error) {
        console.error('Error incrementing view counts:', error);
    }
}
