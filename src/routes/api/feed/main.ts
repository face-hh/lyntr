import { json } from '@sveltejs/kit';
import { db } from '@/server/db';
import { lynts, likes, users, followers, history } from '@/server/schema';
import { sql, desc, and, eq, exists, or, isNull, not, inArray, asc } from 'drizzle-orm';
import { lyntObj } from '../util';

export async function mainFeed(userId: string, limit = 20, excludePosts: string[] = []) {
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

	let whereConditions = and(
		or(isNull(lynts.parent), eq(lynts.reposted, true)),
		sql`${lynts.created_at} > now() - interval '30 days'`
	);

	if (excludePosts.length > 0) {
		whereConditions = and(whereConditions, not(inArray(lynts.id, excludePosts)));
	}

	const feed = await db
		.select({
			...lyntObj(userId),
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
		.where(whereConditions)
		.orderBy(
			// Unviewed posts first
			desc(sql`CASE WHEN ${history.id} IS NULL THEN 1 ELSE 0 END`),
			// Recent posts (within 7 days)
			desc(sql`CASE WHEN ${lynts.created_at} > now() - interval '7 days' THEN 1 ELSE 0 END`),
			// Posts with more likes (for new and unseen posts)
			// Posts from followed users
			desc(sql`CASE WHEN ${lynts.user_id} IN (${followedUsers}) THEN 1 ELSE 0 END`),
			// Remaining posts ordered by likes
			desc(sql`COALESCE(${likeCounts.likeCount}, 0)`),
			// Newest posts first
			desc(lynts.created_at),
			// Oldest viewed posts first (puts newest viewed posts at the bottom)
			asc(sql`COALESCE(${history.createdAt}, timestamp '2000-01-01')`)
		)
		.limit(limit);

	return feed.sort((a: any, b: any) => {
		if (a.isViewed === b.isViewed) {
			return 0;
		}
		return a.isViewed ? 1 : -1;
	});
}
