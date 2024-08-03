import { db } from '@/server/db';
import { followers, likes, lynts, users } from '@/server/schema';
import { json } from '@sveltejs/kit';
import { and, desc, eq, sql } from 'drizzle-orm';
import { Feed } from 'feed';
import { cdnUrl } from '../../../stores';

export async function GET({ url, request }: { url: URL; request: Request }) {
	const host = url.host;
	const userId = url.searchParams.get('id') || null;
	const accept = request.headers.get("Accept") ?? "application/rss+xml";

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
					username: users.username,
					has_image: lynts.has_image,
					reposted: lynts.reposted,
					parent: lynts.parent,
					user_id: lynts.user_id
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
				id: post.id,
				link: `https://${host}/?id=${post.id}`,
				image: post.has_image ? cdnUrl(post.id) : undefined,
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
		switch (accept) {
			case "application/atom+xml":
				return new Response(feed.atom1(), {
					headers: {
						'content-type': 'application/atom+xml'
					}
				})
			default:
			case "application/rss+xml":
				return new Response(feed.rss2(), {
					headers: {
						'content-type': 'application/rss+xml'
					}
				})
			case "application/json":
				return new Response(feed.json1(), {
					headers: {
						'content-type': 'application/json'
					}
				})
		}
	} catch (err) {
		console.error("Error while syndicating user posts:", err);
		return new Response('Internal Server Error', { status: 500 });
	}
}
