import { db } from '@/server/db';
import { lynts, likes, users } from '@/server/schema';
import { desc, and, eq, exists, or, isNull } from 'drizzle-orm';
import { lyntObj } from '../util';

export async function likedFeed(userId: string) {
	const feed = await db
		.select(lyntObj(userId))
		.from(lynts)
		.leftJoin(likes, eq(likes.lynt_id, lynts.id))
		.leftJoin(users, eq(lynts.user_id, users.id))
		.where(
			and(
				or(isNull(lynts.parent), eq(lynts.reposted, true)),
				exists(
					db
						.select()
						.from(likes)
						.where(and(eq(likes.user_id, userId), eq(likes.lynt_id, lynts.id)))
				)
			)
		)
		//.groupBy(lynts.id, users.id)
		.orderBy(desc(likes.liked_at))
		.limit(100);

	return feed;
}