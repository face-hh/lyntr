import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { verifyAuthJWT } from '@/server/jwt';
import { db } from '@/server/db';
import { lynts, likes, followers, history, users } from '@/server/schema';
import { sql, desc, and, eq, not, exists } from 'drizzle-orm';

export const GET: RequestHandler = async ({ request, cookies }) => {
    const authCookie = cookies.get('_TOKEN__DO_NOT_SHARE');

    if (!authCookie) {
        return json({ error: 'Missing authentication' }, { status: 401 });
    }

    try {
        const jwtPayload = await verifyAuthJWT(authCookie);
        
        if (!jwtPayload.userId) {
            throw new Error('Invalid JWT token');
        }

        const userId = jwtPayload.userId;

        const feed = await db
            .select({
                id: lynts.id,
                content: lynts.content,
                userId: lynts.user_id,
                createdAt: lynts.created_at,
                views: lynts.views,
                reposted: lynts.reposted,
                parentId: lynts.parent,
                likeCount: sql<number>`count(distinct ${likes.user_id})`,
                likedByFollowed: sql<boolean>`exists(
                    select 1 from ${followers}
                    where ${followers.user_id} = ${userId}
                    and ${followers.follower_id} = ${lynts.user_id}
                )`,
                repostCount: sql<number>`(
                    select count(*) from ${lynts} as reposts
                    where reposts.parent = ${lynts.id} and reposts.reposted = true
                )`,
                commentCount: sql<number>`(
                    select count(*) from ${lynts} as comments
                    where comments.parent = ${lynts.id} and comments.reposted = false
                )`,
                likedByUser: sql<boolean>`exists(
                    select 1 from ${likes}
                    where ${likes.lynt_id} = ${lynts.id}
                    and ${likes.user_id} = ${userId}
                )`,
                repostedByUser: sql<boolean>`exists(
                    select 1 from ${lynts} as reposts
                    where reposts.parent = ${lynts.id}
                    and reposts.reposted = true
                    and reposts.user_id = ${userId}
                )`,
                handle: users.handle,
                userCreatedAt: users.created_at,
                username: users.username,
                iq: users.iq,
                verified: users.verified,
                parentContent: sql<string>`(
                    select content from ${lynts} as parent
                    where parent.id = ${lynts.parent}
                )`,
                parentUserHandle: sql<string>`(
                    select handle from ${users} as parent_user
                    where parent_user.id = (
                        select user_id from ${lynts} as parent
                        where parent.id = ${lynts.parent}
                    )
                )`,
                parentUserCreatedAt: sql<string>`(
                    select created_at from ${users} as parent_user
                    where parent_user.id = (
                        select user_id from ${lynts} as parent
                        where parent.id = ${lynts.parent}
                    )
                )`,
                parentUserUsername: sql<string>`(
                    select username from ${users} as parent_user
                    where parent_user.id = (
                        select user_id from ${lynts} as parent
                        where parent.id = ${lynts.parent}
                    )
                )`,
                parentUserVerified: sql<boolean>`(
                    select verified from ${users} as parent_user
                    where parent_user.id = (
                        select user_id from ${lynts} as parent
                        where parent.id = ${lynts.parent}
                    )
                )`,
                parentUserIq: sql<number>`(
                    select iq from ${users} as parent_user
                    where parent_user.id = (
                        select user_id from ${lynts} as parent
                        where parent.id = ${lynts.parent}
                    )
                )`,
                parentCreatedAt: sql<string>`(
                    select created_at from ${lynts} as parent
                    where parent.id = ${lynts.parent}
                )`
            })
            .from(lynts)
            .leftJoin(likes, eq(likes.lynt_id, lynts.id))
            .leftJoin(users, eq(lynts.user_id, users.id))
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
            .limit(50);

        // Increment view counts in the background
        incrementViewCounts(feed.map(lynt => lynt.id));

        return json(feed, { status: 200 });

    } catch (error) {
        console.error('Authentication error:', error);
        return json({ error: 'Authentication failed' }, { status: 401 });
    }
};

async function incrementViewCounts(lyntIds: string[]) {
    try {
        await db.transaction(async (tx) => {
            await Promise.all(lyntIds.map(id => 
                tx.execute(sql`UPDATE ${lynts} SET views = views + 1 WHERE id = ${id}`)
            ));
        });
    } catch (error) {
        console.error('Error incrementing view counts:', error);
    }
}