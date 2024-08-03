import { db } from '@/server/db';
import { followers, likes, lynts, users } from '@/server/schema';
import { json } from '@sveltejs/kit';
import { and, desc, eq, sql } from 'drizzle-orm';
import { Feed } from 'feed';

export async function GET({ url }) {
	const host = url.host;
	const userId = url.searchParams.get('id') || null;

	if (!userId) {
		return json({ error: 'User ID is required' }, { status: 400 });
	}
    console.debug("Getting user handle");
	const handle = await db
		.select({ handle: users.handle })
		.from(users)
		.where(eq(users.id, userId))
		.limit(1)
		.then((result) => result[0].handle);

    console.debug("Got user handle:", handle);

	try {
		const feed = new Feed({
			title: `${handle} - Lyntr`,
			description: 'Lyntr',
			id: `https://${host}/`,
			link: `https://${host}/`,
			language: 'en',
			image: `https://${host}/logo.svg`,
			favicon: `https://${host}/logo.svg`,
			copyright: `All rights reserved ${new Date().getFullYear()}, Lyntr`
		});

        console.log("Getting posts...");
		const posts = await db
            .select(
                {
                    id: lynts.id,
                    content: lynts.content,
                    createdAt: lynts.created_at,
                    username: users.username
                }
            )
			.from(lynts)
			.leftJoin(users, eq(lynts.user_id, users.id))
			.leftJoin(likes, eq(lynts.id, likes.lynt_id))
			.leftJoin(followers, and(eq(followers.user_id, userId), eq(followers.follower_id, users.id)))
			.where(eq(users.handle, handle))
			.orderBy(desc(lynts.created_at))
			.limit(100);
        console.log("Got posts!");

		for (const post of posts) {
			feed.addItem({
				title: `Post`,
				id: `https://${host}/api/syndicate/user-posts?id=${post.id}`,
				link: `https://${host}/api/syndicate/user-posts?id=${post.id}`,
				date: post.createdAt!,
				author: [
					{
						name: post.username!
					}
				],
				description: post.content,
				content: post.content
			});
		}

		return new Response(feed.rss2(), {
			headers: {
				'content-type': 'application/rss+xml'
			}
		});
	} catch(err) {
        console.error("Error while syndicating user posts:", err);
		return new Response('Internal Server Error', { status: 500 });
	}
}
