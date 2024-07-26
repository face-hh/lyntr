import { json } from '@sveltejs/kit';
import { db } from '@/server/db';
import { lynts, likes, users, followers, history } from '@/server/schema';
import { sql, desc, and, eq, exists, or, isNull, not, inArray } from 'drizzle-orm';
import { lyntObj } from '../util';

export async function mainFeed(userId: string, limit = 50) {
    const followedUsers = db
        .select({ followedId: followers.follower_id })
        .from(followers)
        .where(eq(followers.user_id, userId));

    const likeCounts = db
        .select({
            lyntId: likes.lynt_id,
            likeCount: sql<number>`count(*)`.as('like_count')
        })
        .from(likes)
        .groupBy(likes.lynt_id)
        .as('like_counts');

    const feed = await db
        .select({
            ...lyntObj(userId),
            isFollowed: inArray(lynts.user_id, followedUsers),
            likeCount: sql<number>`coalesce(${likeCounts.likeCount}, 0)`,
            isViewed: exists(
                db.select()
                    .from(history)
                    .where(and(
                        eq(history.lynt_id, lynts.id),
                        eq(history.user_id, userId)
                    ))
            ),
            viewedAt: sql<Date>`(
                SELECT ${history.createdAt}
                FROM ${history}
                WHERE ${history.lynt_id} = ${lynts.id}
                AND ${history.user_id} = ${userId}
            )`
        })
        .from(lynts)
        .leftJoin(users, eq(lynts.user_id, users.id))
        .leftJoin(likeCounts, eq(lynts.id, likeCounts.lyntId))
        .where(
            and(
                or(
                    isNull(lynts.parent),
                    eq(lynts.reposted, true)
                ),
                sql`${lynts.created_at} > now() - interval '30 days'`
            )
        )
        .orderBy(
            desc(sql`CASE WHEN NOT EXISTS (
                SELECT 1 FROM ${history}
                WHERE ${history.lynt_id} = ${lynts.id}
                AND ${history.user_id} = ${userId}
            ) THEN 1 ELSE 0 END`),
            desc(sql`CASE WHEN ${lynts.created_at} > now() - interval '7 days' THEN 1 ELSE 0 END`),
            desc(sql`CASE WHEN ${lynts.user_id} IN (${followedUsers}) THEN 1 ELSE 0 END`),
            desc(sql`coalesce(${likeCounts.likeCount}, 0)`),
            desc(sql`coalesce((
                SELECT ${history.createdAt}
                FROM ${history}
                WHERE ${history.lynt_id} = ${lynts.id}
                AND ${history.user_id} = ${userId}
            ), ${lynts.created_at})`)
        )
        .limit(limit);

    return feed;
}