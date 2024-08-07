import { db } from '@/server/db';
import { lynts, likes, users } from '@/server/schema';
import { eq, and, desc, sql, exists } from 'drizzle-orm';
import { lyntObj } from '../util';

// Prepared statement: user_replies
// Parameters:
const userId = sql.placeholder('user_id');
const lyntId = sql.placeholder('lynt_id');

// Query:
export const userRepliesQuery = db
	.select(lyntObj())
	.from(lynts)
	.leftJoin(likes, eq(likes.lynt_id, lynts.id))
	.leftJoin(users, eq(lynts.user_id, users.id))
	.where(
		and(
			eq(lynts.parent, lyntId),
			eq(lynts.reposted, false),
			exists(
				db
					.select()
					.from(lynts)
					.where(and(eq(lynts.parent, lynts.id), eq(lynts.user_id, userId)))
			)
		)
	)
	.groupBy(lynts.id, users.id)
	.orderBy(desc(lynts.created_at))
	.prepare('user_replies');
