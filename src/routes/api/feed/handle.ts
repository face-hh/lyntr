// handle.ts
import { json } from '@sveltejs/kit';
import { db } from '@/server/db';
import { lynts, likes, users } from '@/server/schema';
import { sql, desc, and, eq, or, isNull } from 'drizzle-orm';
import { lyntObj } from '../util';

export async function handleFeed(handleUserId: string, userId: string) {
	const totalLyntsResult = await db
		.select({ count: sql<number>`count(*)` })
		.from(lynts)
		.where(eq(lynts.user_id, handleUserId));

	const feed = await db
		.select(lyntObj(userId))
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
		.limit(50);

	return feed;
}
