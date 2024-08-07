import { db } from '@/server/db';
import { lynts, likes, users } from '@/server/schema';
import { desc, and, eq, exists, or, isNull, sql } from 'drizzle-orm';
import { lyntObj } from '../util';

// Prepared statement: liked_feed
// Parameters:
const userId = sql.placeholder('user_id');

// Query:
const likedFeedQuery = db
	.select({
		...lyntObj(),
		likedAt: likes.liked_at
	})
	.from(likes)
	.innerJoin(lynts, eq(likes.lynt_id, lynts.id))
	.innerJoin(users, eq(lynts.user_id, users.id))
	.where(eq(likes.user_id, userId))
	.orderBy(desc(likes.liked_at))
	.limit(100)
	.prepare('liked_feed');

export async function likedFeed(userId: string) {
	const feed = await likedFeedQuery.execute({
		user_id: userId
	});

	return feed;
}
