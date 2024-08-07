import { db } from '@/server/db';
import { lynts, likes, users, followers, history } from '@/server/schema';
import { sql, desc, and, eq, exists, or, isNull, not, inArray, asc } from 'drizzle-orm';
import { lyntObj } from '../util';

// Prepared query: main_feed
// Parameters:
const userId = sql.placeholder('user_id');
const limit = sql.placeholder('limit');
const excludePosts = sql.placeholder('exclude_posts');

// Subqueries:
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

// Query:
const feedQuery = db
	.select({
		...lyntObj(),
		isFollowed: inArray(lynts.user_id, followedUsers),
		likeCount: sql<number>`coalesce(${likeCounts.likeCount}, 0)`,
		isViewed: exists(
			db
				.select()
				.from(history)
				.where(and(eq(history.lynt_id, lynts.id), eq(history.user_id, userId)))
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
	.leftJoin(history, and(eq(history.lynt_id, lynts.id), eq(history.user_id, userId)))
	.where(
		and(
			eq(users.banned, false),
			or(isNull(lynts.parent), eq(lynts.reposted, true)),
			sql`${lynts.created_at} > now() - interval '30 days'`,

			// If you try to use a placeholder and inArray, you will get a syntax error
			// so we can use this hack
			not(eq(lynts.id, sql`any(${excludePosts})`))
		)
	)
	.orderBy(
		desc(sql`CASE WHEN ${history.id} IS NULL THEN 1 ELSE 0 END`),
		desc(lynts.created_at),
		desc(sql`CASE WHEN ${users.handle} = 'facedev' THEN 1 ELSE 0 END`),
		desc(sql`CASE WHEN ${lynts.user_id} IN (${followedUsers}) THEN 1 ELSE 0 END`),
		desc(sql`COALESCE(${likeCounts.likeCount}, 0)`),
		desc(sql`CASE WHEN ${lynts.created_at} > now() - interval '24 hours' THEN 1 ELSE 0 END`)
	)
	.limit(limit)
	.prepare('main_feed');

export async function mainFeed(userId: string, limit = 20, excludePosts: string[] = []) {
	const feed = await feedQuery.execute({
		user_id: userId,
		exclude_posts: excludePosts,
		limit: limit
	});

	return feed;
}
