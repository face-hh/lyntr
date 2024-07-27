import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '@/server/db';
import { lynts, users, likes, followers } from '@/server/schema';
import { sql, and, eq, ilike, desc } from 'drizzle-orm';
import { verifyAuthJWT } from '@/server/jwt';

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

		const searchResults = await db
			.select({
				id: lynts.id,
				content: lynts.content,
				userId: lynts.user_id,
				createdAt: lynts.created_at,
				views: lynts.views,
				reposted: lynts.reposted,
				parentId: lynts.parent,
				likeCount: sql<number>`count(distinct ${likes.user_id})`,
				likedByFollowed: sql<boolean>`exists(
                    select 1 from ${followers}
                    where ${followers.user_id} = ${userId}
                    and ${followers.follower_id} = ${lynts.user_id}
                )`,
				repostCount: sql<number>`(
                    select count(*) from ${lynts} as reposts
                    where reposts.parent = ${lynts.id} and reposts.reposted = true
                )`,
				commentCount: sql<number>`(
                    select count(*) from ${lynts} as comments
                    where comments.parent = ${lynts.id} and comments.reposted = false
                )`,
				likedByUser: sql<boolean>`exists(
                    select 1 from ${likes}
                    where ${likes.lynt_id} = ${lynts.id}
                    and ${likes.user_id} = ${userId}
                )`,
				repostedByUser: sql<boolean>`exists(
                    select 1 from ${lynts} as reposts
                    where reposts.parent = ${lynts.id}
                    and reposts.reposted = true
                    and reposts.user_id = ${userId}
                )`,
				handle: users.handle,
				userCreatedAt: users.created_at,
				username: users.username,
				iq: users.iq,
				verified: users.verified,
				parentContent: sql<string>`(
                    select content from ${lynts} as parent
                    where parent.id = ${lynts.parent}
                )`,
				parentUserHandle: sql<string>`(
                    select handle from ${users} as parent_user
                    where parent_user.id = (
                        select user_id from ${lynts} as parent
                        where parent.id = ${lynts.parent}
                    )
                )`,
				parentUserCreatedAt: sql<string>`(
                    select created_at from ${users} as parent_user
                    where parent_user.id = (
                        select user_id from ${lynts} as parent
                        where parent.id = ${lynts.parent}
                    )
                )`,
				parentUserUsername: sql<string>`(
                    select username from ${users} as parent_user
                    where parent_user.id = (
                        select user_id from ${lynts} as parent
                        where parent.id = ${lynts.parent}
                    )
                )`,
				parentUserVerified: sql<boolean>`(
                    select verified from ${users} as parent_user
                    where parent_user.id = (
                        select user_id from ${lynts} as parent
                        where parent.id = ${lynts.parent}
                    )
                )`,
				parentUserIq: sql<number>`(
                    select iq from ${users} as parent_user
                    where parent_user.id = (
                        select user_id from ${lynts} as parent
                        where parent.id = ${lynts.parent}
                    )
                )`,
				parentCreatedAt: sql<string>`(
                    select created_at from ${lynts} as parent
                    where parent.id = ${lynts.parent}
                )`
			})
			.from(lynts)
			.leftJoin(likes, eq(likes.lynt_id, lynts.id))
			.leftJoin(users, eq(lynts.user_id, users.id))
			.where(ilike(lynts.content, `%${query}%`))
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
