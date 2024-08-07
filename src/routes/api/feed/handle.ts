// handle.ts
import { json } from '@sveltejs/kit';
import { db } from '@/server/db';
import { lynts, likes, users } from '@/server/schema';
import { sql, desc, and, eq, or, isNull } from 'drizzle-orm';
import { lyntObj } from '../util';

// Prepared statement: handle_feed
// Parameters:
//  - user_id from lyntObj
//  - handle_user_id
const handleUserId = sql.placeholder('handle_user_id');

// Query:
const handleFeedQuery = db
	.select(lyntObj())
	.from(lynts)
	.leftJoin(likes, eq(likes.lynt_id, lynts.id))
	.leftJoin(users, eq(lynts.user_id, users.id))
	.where(
		and(
			eq(lynts.user_id, handleUserId),
			or(and(eq(lynts.reposted, false), isNull(lynts.parent)), eq(lynts.reposted, true))
		)
	)
	.groupBy(lynts.id, users.id)
	.orderBy(desc(lynts.created_at))
	.limit(50)
	.prepare('handle_feed');

export async function handleFeed(handleUserId: string, userId: string) {
	return await handleFeedQuery.execute({
		handle_user_id: handleUserId,
		user_id: userId
	});
}
