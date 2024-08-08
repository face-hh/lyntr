import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '@/server/db';
import { lynts, users, likes, followers } from '@/server/schema';
import { sql, and, or, eq, ilike, desc } from 'drizzle-orm';
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
			.replace(/type:([^ ]+)/g, '')
			.trim();

		let results: any[] = [];
                const typeMatch = query.match(/type:([^ ]+)/);

		if (typeMatch && typeMatch[1] === 'users') {
			let whereClause = or(
				ilike(users.username, `%${cleanedQuery}%`),
				ilike(users.handle, `%${cleanedQuery}%`),
			);


			results = await db
				.select({
					id: users.id,
					username: users.username,
					handle: users.handle,
					bio: users.bio,
					iq: users.iq,
					verified: users.verified,
					created_at: users.created_at,
				})
				.from(users)
				.where(whereClause)
				.orderBy(desc(users.iq))
				.limit(50)
				.execute();
                } else {
			let whereClause = ilike(lynts.content, `%${cleanedQuery}%`);

			const match = query.match(/from:@([^ ]+)/);
			if (match) {
				whereClause = and(
					eq(users.handle, match[1].replace(/^@/, '')),
					whereClause
				);
			}

			results = await db
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
			incrementViewCounts(results.map((result) => result.id));
		}

		return json({
			results,
			type: typeMatch && typeMatch[1] === 'users' ? 'users' : 'lynts'
		}, { status: 200 });
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
