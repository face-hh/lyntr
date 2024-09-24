import { db } from '@/server/db';
import { lynts, likes, followers, users, notifications, history } from '@/server/schema';
import { and, eq, inArray, sql } from 'drizzle-orm';
import sharp from 'sharp';

export const lyntObj = (userId: string | null) => {
	let payload = {
		id: lynts.id,
		content: lynts.content,
		userId: lynts.user_id,
		createdAt: lynts.created_at,
		views: sql<number>`(
            SELECT COUNT(*) 
            FROM ${history} 
            WHERE ${history.lynt_id} = ${lynts.id}
        )`.as('views'),
		reposted: lynts.reposted,
		parentId: lynts.parent,
		has_image: lynts.has_image,
		likeCount: sql<number>`(SELECT COUNT(*) FROM ${likes} WHERE ${likes.lynt_id} = ${lynts.id})`.as(
			'likeCount'
		),
		likedByFollowed: sql<boolean>`exists(
        select 1 from ${followers}
        where ${followers.user_id} = ${userId}
        and ${followers.follower_id} = ${lynts.user_id}
    )`.as('liked_by_followed'),
		repostCount: sql<number>`(
        select count(*) from ${lynts} as reposts
        where reposts.parent = ${lynts.id} and reposts.reposted = true
    )`.as('repost_count'),
		commentCount: sql<number>`(
        select count(*) from ${lynts} as comments
        where comments.parent = ${lynts.id} and comments.reposted = false
    )`.as('comment_count'),
		likedByUser: sql<boolean>`exists(
        select 1 from ${likes}
        where ${likes.lynt_id} = ${lynts.id}
        and ${likes.user_id} = ${userId}
    )`.as('liked_by_user'),
		repostedByUser: sql<boolean>`exists(
        select 1 from ${lynts} as reposts
        where reposts.parent = ${lynts.id}
        and reposts.reposted = true
        and reposts.user_id = ${userId}
    )`.as('reposted_by_user'),
		handle: users.handle,
		bio: users.bio,
		userCreatedAt: users.created_at,
		username: users.username,
		iq: users.iq,
		verified: users.verified,
		parentContent: sql<string>`(
            select content from ${lynts} as parent
            where parent.id = ${lynts.parent}
        )`.as('parent_content'),
		parentHasImage: sql<string>`(
            select has_image from ${lynts} as parent
            where parent.id = ${lynts.parent}
        )`.as('has_image'),
		parentUserHandle: sql<string>`(
        select handle from ${users} as parent_user
        where parent_user.id = (
            select user_id from ${lynts} as parent
            where parent.id = ${lynts.parent}
        )
    )`.as('parent_user_handle'),
		parentUserCreatedAt: sql<string>`(
        select created_at from ${users} as parent_user
        where parent_user.id = (
            select user_id from ${lynts} as parent
            where parent.id = ${lynts.parent}
        )
    )`.as('parent_user_created_at'),
		parentUserBio: sql<string>`(
        select bio from ${users} as parent_user
        where parent_user.id = (
            select user_id from ${lynts} as parent
            where parent.id = ${lynts.parent}
        )
    )`.as('bio'),
		parentUserUsername: sql<string>`(
        select username from ${users} as parent_user
        where parent_user.id = (
            select user_id from ${lynts} as parent
            where parent.id = ${lynts.parent}
        )
    )`.as('parent_user_username'),
		parentUserVerified: sql<boolean>`(
        select verified from ${users} as parent_user
        where parent_user.id = (
            select user_id from ${lynts} as parent
            where parent.id = ${lynts.parent}
        )
    )`.as('parent_user_verified'),
		parentUserIq: sql<number>`(
        select iq from ${users} as parent_user
        where parent_user.id = (
            select user_id from ${lynts} as parent
            where parent.id = ${lynts.parent}
        )
    )`.as('parent_user_iq'),
		parentUserId: sql<number>`(
        select id from ${users} as parent_user
        where parent_user.id = (
            select user_id from ${lynts} as parent
            where parent.id = ${lynts.parent}
        )
    )`.as('parent_user_id'),
		parentCreatedAt: sql<string>`(
        select created_at from ${lynts} as parent
        where parent.id = ${lynts.parent}
    )`.as('parent_created_at')
	};

	return payload
};

export async function uploadCompressed(inputBuffer: Buffer, id: string, minioClient: any) {
	const resizedBuffer = await sharp(inputBuffer, {
		animated: true
        })
		.rotate()
                .webp({ quality: 70 })
                .withMetadata()
                .toBuffer();

        const fileName = `${id}.webp`;
        await minioClient.putObject(
		process.env.S3_BUCKET_NAME!,
		fileName,
		resizedBuffer,
		resizedBuffer.length,
		{
		        'Content-Type': 'image/webp'
                }
        );
}

export async function uploadAvatar(inputBuffer: Buffer, fileName: string, minioClient: any) {
	const buffer_small = await sharp(inputBuffer).resize(40, 40).webp().toBuffer();

	const buffer_medium = await sharp(inputBuffer).resize(50, 50).webp().toBuffer();

	const buffer_big = await sharp(inputBuffer, { animated: true }).resize(160, 160).webp().toBuffer();

	const shits = [
		{ filename: fileName + '_small.webp', buffer: buffer_small },
		{ filename: fileName + '_medium.webp', buffer: buffer_medium },
		{ filename: fileName + '_big.webp', buffer: buffer_big }
	];

	for (const shit of shits) {
		await minioClient.removeObject(process.env.S3_BUCKET_NAME!, shit.filename);
		await minioClient.putObject(
			process.env.S3_BUCKET_NAME!,
			shit.filename,
			shit.buffer,
			shit.buffer.length,
			{
				'Content-Type': 'image/webp'
			}
		);
	}
}

export async function deleteLynt(lyntId: string) {
	await db.transaction(async (trx) => {
		// Get all comments under this lynt
		const comments = await trx.select({ id: lynts.id }).from(lynts).where(eq(lynts.parent, lyntId));

		const commentIds = comments.map((comment) => comment.id);
		const allIds = [lyntId, ...commentIds];

		// Delete likes associated with the comments and the original lynt
		await trx.delete(likes).where(inArray(likes.lynt_id, allIds));

		// Delete notifications associated with the comments and the original lynt
		await trx.delete(notifications).where(inArray(notifications.lyntId, allIds));

		// Delete history entries associated with the comments and the original lynt
		await trx.delete(history).where(inArray(history.lynt_id, allIds));

		// Delete all comments under this lynt
		await trx.delete(lynts).where(and(eq(lynts.parent, lyntId), eq(lynts.reposted, false)));

		// Update reposts of this lynt
		await trx
			.update(lynts)
			.set({
				content: sql`${lynts.content} || '\nThe Lynt this user is reposting has been since deleted.'`,
				parent: null
			})
			.where(and(eq(lynts.parent, lyntId), eq(lynts.reposted, true)));

		// Delete the original lynt
		await trx.delete(lynts).where(eq(lynts.id, lyntId));
	});
}

export async function fetchReferencedLynts(userId: string | null, parentId: string | null): Promise<any[]> {
	const referencedLynts: any[] = [];

	async function fetchParent(currentParentId: string) {
		const obj = lyntObj(userId);

		const [parent] = await db
			.select(obj)
			.from(lynts)
			.leftJoin(users, eq(lynts.user_id, users.id))
			.where(and(eq(lynts.id, currentParentId), eq(lynts.reposted, false)))
			.limit(1);

		if (parent) {
			referencedLynts.unshift(parent); // Add to the beginning of the array
			if (parent.parentId) {
				await fetchParent(parent.parentId);
			}
		}
	}

	if (parentId) {
		await fetchParent(parentId);
	}

	return referencedLynts;
}