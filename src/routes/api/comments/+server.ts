import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { verifyAuthJWT } from '@/server/jwt';
import { db } from '@/server/db';
import { lynts, likes, users, followers } from '@/server/schema';
import { sql, desc, and, eq, not, exists } from 'drizzle-orm';

import { lyntObj } from '../util';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const lyntId = url.searchParams.get('id');
	const authCookie = cookies.get('_TOKEN__DO_NOT_SHARE');

	if (!lyntId) {
		return json({ error: 'Missing lynt ID' }, { status: 400 });
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

		// First, get the comments that the user has replied to
		const userReplies = await db
			.select(lyntObj(userId))
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
			.execute();

		// Then, get the most liked comments
		let mostLikedComments: {
			id: string;
			content: string;
			userId: string | null;
			createdAt: Date | null;
			views: number | null;
			reposted: boolean | null;
			parentId: string | null;
			likeCount: number;
			likedByFollowed: boolean;
			repostCount: number;
			commentCount: number;
			likedByUser: boolean;
			repostedByUser: boolean;
			handle: string | null;
			userCreatedAt: Date | null;
			username: string | null;
			iq: number | null;
			verified: boolean | null;
		}[] = [];
		if (userReplies.length < 50) {
			const notInClause =
				userReplies.length > 0
					? not(
							eq(
								lynts.id,
								sql`ANY(${sql`ARRAY[${sql.join(userReplies.map((reply) => reply.id))}]`})`
							)
						)
					: sql`TRUE`;

			mostLikedComments = await db
				.select(lyntObj(userId))
				.from(lynts)
				.leftJoin(likes, eq(likes.lynt_id, lynts.id))
				.leftJoin(users, eq(lynts.user_id, users.id))
				.where(and(eq(lynts.parent, lyntId), eq(lynts.reposted, false), notInClause))
				.groupBy(lynts.id, users.id)
				.orderBy(desc(sql`count(distinct ${likes.user_id})`), desc(lynts.created_at))
				// .limit(50 - userReplies.length)
				.execute();
		}
		const comments = [...userReplies, ...mostLikedComments];

		// Increment view counts in the background
		incrementViewCounts(comments.map((comment) => comment.id));

		return json(comments, { status: 200 });
	} catch (error) {
		console.error('Error fetching comments:', error);
		if (error instanceof Error) {
			console.error('Error message:', error.message);
			console.error('Error stack:', error.stack);
		}
		return json({ error: 'Failed to fetch comments' }, { status: 500 });
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
