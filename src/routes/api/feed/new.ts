import { json } from '@sveltejs/kit';
import { db } from '@/server/db';
import { lynts, likes, users, history } from '@/server/schema';
import { desc, and, eq, not, exists, or, isNull } from 'drizzle-orm';
import { lyntObj } from '../util';

export async function newFeed(userId: string) {
	const feed = await db
		.select(lyntObj(userId))
		.from(lynts)
		.leftJoin(likes, eq(likes.lynt_id, lynts.id))
		.leftJoin(users, eq(lynts.user_id, users.id))
		.where(and(or(isNull(lynts.parent), eq(lynts.reposted, true))))
		.groupBy(lynts.id, users.id)
		.orderBy(desc(lynts.created_at))
		.limit(50);

	return feed;
}
