import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { verifyAuthJWT } from '@/server/jwt';
import { db } from '@/server/db';
import { lynts, likes, followers, history, users } from '@/server/schema';
import { sql, desc, and, eq, not, exists, or, isNull } from 'drizzle-orm';

const lyntObj = (userId: string) => {
    return {
        id: lynts.id,
        content: lynts.content,
        userId: lynts.user_id,
        createdAt: lynts.created_at,
        views: lynts.views,
        reposted: lynts.reposted,
        parentId: lynts.parent,
        likeCount: sql<number>`count(distinct ${likes.user_id})`.as('like_count'),
        likedByFollowed: sql<boolean>`exists(
        select 1 from ${followers}
        where ${followers.user_id} = ${userId}
        and ${followers.follower_id} = ${lynts.user_id}
    )`.as('liked_by_followed'),
        repostCount: sql<number>`(
        select count(*) from ${lynts} as reposts
        where reposts.parent = ${lynts.id} and reposts.reposted = true
    )`.as('repost_count'),
        commentCount: sql<number>`(
        select count(*) from ${lynts} as comments
        where comments.parent = ${lynts.id} and comments.reposted = false
    )`.as('comment_count'),
        likedByUser: sql<boolean>`exists(
        select 1 from ${likes}
        where ${likes.lynt_id} = ${lynts.id}
        and ${likes.user_id} = ${userId}
    )`.as('liked_by_user'),
        repostedByUser: sql<boolean>`exists(
        select 1 from ${lynts} as reposts
        where reposts.parent = ${lynts.id}
        and reposts.reposted = true
        and reposts.user_id = ${userId}
    )`.as('reposted_by_user'),
        handle: users.handle,
        userCreatedAt: users.created_at,
        username: users.username,
        iq: users.iq,
        verified: users.verified,
        parentContent: sql<string>`(
        select content from ${lynts} as parent
        where parent.id = ${lynts.parent}
    )`.as('parent_content'),
        parentUserHandle: sql<string>`(
        select handle from ${users} as parent_user
        where parent_user.id = (
            select user_id from ${lynts} as parent
            where parent.id = ${lynts.parent}
        )
    )`.as('parent_user_handle'),
        parentUserCreatedAt: sql<string>`(
        select created_at from ${users} as parent_user
        where parent_user.id = (
            select user_id from ${lynts} as parent
            where parent.id = ${lynts.parent}
        )
    )`.as('parent_user_created_at'),
        parentUserUsername: sql<string>`(
        select username from ${users} as parent_user
        where parent_user.id = (
            select user_id from ${lynts} as parent
            where parent.id = ${lynts.parent}
        )
    )`.as('parent_user_username'),
        parentUserVerified: sql<boolean>`(
        select verified from ${users} as parent_user
        where parent_user.id = (
            select user_id from ${lynts} as parent
            where parent.id = ${lynts.parent}
        )
    )`.as('parent_user_verified'),
        parentUserIq: sql<number>`(
        select iq from ${users} as parent_user
        where parent_user.id = (
            select user_id from ${lynts} as parent
            where parent.id = ${lynts.parent}
        )
    )`.as('parent_user_iq'),
        parentCreatedAt: sql<string>`(
        select created_at from ${lynts} as parent
        where parent.id = ${lynts.parent}
    )`.as('parent_created_at')
    }
}

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
                .where(eq(lynts.user_id, user.id))
                .groupBy(lynts.id, users.id)
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
