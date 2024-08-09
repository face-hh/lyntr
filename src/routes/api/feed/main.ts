import { json } from '@sveltejs/kit';
import { db } from '@/server/db';
import { lynts, likes, users, followers, history } from '@/server/schema';
import { sql, desc, and, eq, exists, or, isNull, not, inArray, asc } from 'drizzle-orm';
import { lyntObj } from '../util';
import { config } from 'dotenv';
import { Redis } from '@upstash/redis';
config({ path: '.env' });

const redis = Redis.fromEnv();

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
		eq(users.banned, false),
		or(isNull(lynts.parent), eq(lynts.reposted, true)),
		sql`${lynts.created_at} > now() - interval '30 days'`
	);

	if (excludePosts.length > 0) {
		whereConditions = and(whereConditions, not(inArray(lynts.id, excludePosts)));
	}

	let feed = await db
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
		.leftJoin(history, and(eq(history.lynt_id, lynts.id), eq(history.user_id, userId)))
		.where(whereConditions)
		.orderBy(
			desc(sql`CASE WHEN ${history.id} IS NULL THEN 1 ELSE 0 END`),
			desc(sql`COALESCE(${likeCounts.likeCount}, 0)`),
			desc(lynts.created_at),
			desc(sql`CASE WHEN ${users.handle} = 'facedev' THEN 1 ELSE 0 END`),
			desc(sql`CASE WHEN ${lynts.user_id} IN (${followedUsers}) THEN 1 ELSE 0 END`),
			desc(sql`CASE WHEN ${lynts.created_at} > now() - interval '24 hours' THEN 1 ELSE 0 END`),
		)
		.limit(limit);

	if ((await redis.exists('pinned-lynt')) == 1) {
		const lyntId = (await redis.get('pinned-lynt')) as string;
		const lynt = await db
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
			.where(eq(lynts.id, lyntId))
			.leftJoin(users, eq(lynts.user_id, users.id))
			.leftJoin(likeCounts, eq(lynts.id, likeCounts.lyntId))
			.leftJoin(history, and(eq(history.lynt_id, lynts.id), eq(history.user_id, userId)));

		if (!lynt[0]) return feed;

		feed = [lynt[0], ...feed];
	}
	return feed;
}
