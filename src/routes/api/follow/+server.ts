import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '@/server/db';
import { followers } from '@/server/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuthJWT } from '@/server/jwt';
import { createNotification } from '@/server/notifications';
import { sensitiveRatelimit } from '@/server/ratelimit';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const token = cookies.get('_TOKEN__DO_NOT_SHARE');
	if (!token) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const payload = await verifyAuthJWT(token);
	if (!payload) {
		return json({ error: 'Invalid token' }, { status: 401 });
	}

	const { userId: authenticatedUserId } = payload;
	const { userId: targetUserId } = await request.json();

	const { success } = await sensitiveRatelimit.limit(authenticatedUserId);

	if (!success) {
		return json({ error: 'You are ratelimited.' }, { status: 429 });
	}

	if (authenticatedUserId === targetUserId) {
		return json({ error: 'Cannot follow yourself' }, { status: 400 });
	}

	try {
		// Check if already following
		const existingFollow = await db
			.select()
			.from(followers)
			.where(
				and(eq(followers.user_id, targetUserId), eq(followers.follower_id, authenticatedUserId))
			)
			.execute();

		if (existingFollow.length > 0) {
			// Unfollow
			await db
				.delete(followers)
				.where(
					and(eq(followers.user_id, targetUserId), eq(followers.follower_id, authenticatedUserId))
				)
				.execute();
			return json({ message: 'Unfollowed successfully' });
		} else {
			// Follow
			await db
				.insert(followers)
				.values({
					user_id: targetUserId,
					follower_id: authenticatedUserId
				})
				.execute();

			await createNotification(targetUserId, 'follow', authenticatedUserId);

			return json({ message: 'Followed successfully' });
		}
	} catch (error) {
		console.error('Error in follow/unfollow:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

export const GET: RequestHandler = async ({ url, cookies }) => {
	const token = cookies.get('_TOKEN__DO_NOT_SHARE');
	if (!token) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const payload = await verifyAuthJWT(token);
	if (!payload) {
		return json({ error: 'Invalid token' }, { status: 401 });
	}

	const { userId: authenticatedUserId } = payload;
	const targetUserId = url.searchParams.get('userId');

	if (!targetUserId) {
		return json({ error: 'Missing userId parameter' }, { status: 400 });
	}

	if (authenticatedUserId === targetUserId) {
		return json({ error: 'Cannot check follow status with yourself' }, { status: 409 });
	}

	try {
		const [isFollowing, isFollowedBy] = await Promise.all([
			db
				.select()
				.from(followers)
				.where(
					and(eq(followers.user_id, targetUserId), eq(followers.follower_id, authenticatedUserId))
				)
				.execute(),
			db
				.select()
				.from(followers)
				.where(
					and(eq(followers.user_id, authenticatedUserId), eq(followers.follower_id, targetUserId))
				)
				.execute()
		]);

		return json({
			isFollowing: isFollowing.length > 0,
			isFollowedBy: isFollowedBy.length > 0
		});
	} catch (error) {
		console.error('Error checking follow status:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
