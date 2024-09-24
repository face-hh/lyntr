import { db } from '@/server/db';
import { lynts, likes, users } from '@/server/schema';
import { desc, and, eq, exists, or, isNull } from 'drizzle-orm';
import { lyntObj } from '../util';

export async function likedFeed(userId: string, myId: string) {
	const feed = await db
		.select({
			...lyntObj(myId),
			likedAt: likes.liked_at
		})
		.from(likes)
		.innerJoin(lynts, eq(likes.lynt_id, lynts.id))
		.innerJoin(users, eq(lynts.user_id, users.id))
		.where(eq(likes.user_id, userId))
		.orderBy(desc(likes.liked_at))
		.limit(100);

	return feed;
}
