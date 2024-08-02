import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '@/server/db';
import { lynts, users, likes, followers } from '@/server/schema';
import { sql, and, eq, ilike, desc } from 'drizzle-orm';
import { verifyAuthJWT } from '@/server/jwt';
import { lyntObj } from '../util';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const query = url.searchParams.get('q');
	const authCookie = cookies.get('_TOKEN__DO_NOT_SHARE');

	if (!query) {
		return json({ error: 'Missing search query' }, { status: 400 });
	}

	if (!authCookie) {
		return json({ error: 'Missing authentication' }, { status: 401 });
	}

	try {
		const jwtPayload = await verifyAuthJWT(authCookie);

		if (!jwtPayload.userId) {
			throw new Error('Invalid JWT token');
		}

		const userId = jwtPayload.userId;

		let cleanedQuery = query
			.replace(/from:@([^ ]+)/g, '')
			.trim();
		let whereClause = ilike(lynts.content, `%${cleanedQuery}%`);

		const match = query.match(/from:@([^ ]+)/);
		if (match) {
			whereClause = and(
				eq(users.handle, match[1].replace(/^@/, '')),
				whereClause
			);
		}

		const searchResults = await db
			.select(lyntObj(userId))
			.from(lynts)
			.leftJoin(likes, eq(likes.lynt_id, lynts.id))
			.leftJoin(users, eq(lynts.user_id, users.id))
			.where(whereClause)
			.groupBy(lynts.id, users.id)
			.orderBy(desc(lynts.created_at))
			.limit(50)
			.execute();

		// Increment view counts in the background
		incrementViewCounts(searchResults.map((result) => result.id));

		return json(searchResults, { status: 200 });
	} catch (error) {
		console.error('Error performing search:', error);
		return json({ error: 'Failed to perform search' }, { status: 500 });
	}
};

async function incrementViewCounts(lyntIds: string[]) {
	try {
		await db.transaction(async (tx) => {
			await Promise.all(
				lyntIds.map((id) => tx.execute(sql`UPDATE ${lynts} SET views = views + 1 WHERE id = ${id}`))
			);
		});
	} catch (error) {
		console.error('Error incrementing view counts:', error);
	}
}
