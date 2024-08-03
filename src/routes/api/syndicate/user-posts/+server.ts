import { db } from '@/server/db';
import { followers, likes, lynts, users } from '@/server/schema';
import { json } from '@sveltejs/kit';
import { and, desc, eq } from 'drizzle-orm';
import { Feed } from 'feed';
import { cdnUrl } from '../../../stores';

export async function GET({ url, request }: { url: URL; request: Request }) {
	const host = url.host;
	const userId = url.searchParams.get('id') || null;
	const accept = request.headers.get('Accept') ?? 'application/rss+xml';

	if (!userId) {
		return json({ error: 'User ID is required' }, { status: 400 });
	}

	console.debug('Getting user handle');
	const handle = await db
		.select({ handle: users.handle })
		.from(users)
		.where(eq(users.id, userId))
		.limit(1)
		.then((result) => result[0].handle);

	console.debug('Got user handle:', handle);

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

		console.log('Getting posts...');
		const posts = await db
			.select({
				id: lynts.id,
				content: lynts.content,
				createdAt: lynts.created_at,
				username: users.username,
				has_image: lynts.has_image,
				reposted: lynts.reposted,
				parent: lynts.parent,
				user_id: lynts.user_id
			})
			.from(lynts)
			.leftJoin(users, eq(lynts.user_id, users.id))
			.leftJoin(likes, eq(lynts.id, likes.lynt_id))
			.leftJoin(followers, and(eq(followers.user_id, userId), eq(followers.follower_id, users.id)))
			.where(eq(users.handle, handle))
			.orderBy(desc(lynts.created_at))
			.limit(100);
		console.log('Got posts!');

		for (const post of posts) {
			const originalPost = post.reposted
				? await db
						.select({
							id: lynts.id,
							content: lynts.content,
							parent: lynts.parent,
							user_id: lynts.user_id
						})
						.from(lynts)
						.where(eq(lynts.id, post.parent!))
						.limit(1)
						.then((result) => result[0])
				: null;
			const originalPostAuthor = post.reposted ? await db
				.select({ username: users.username })
				.from(users)
				.where(eq(users.id, originalPost!.user_id!))
				.limit(1)
				.then((result) => result[0].username) : null;
			let content = post.content;
			if (post.reposted && originalPost) {
				content = `> ${originalPost.content}\n
${post.content}`;
				console.log(content);
			}
			const postLink = `${host.startsWith('localhost') ? 'http' : 'https'}://${host}/?id=${post.id}`;
			feed.addItem({
				title: `${post.reposted ? 'Re p' : 'P'}ost`,
				id: postLink,
				link: postLink,
				image: post.has_image ? cdnUrl(post.id) : undefined,
				date: post.createdAt!,
				author: post.reposted
					? [
							{
								name: post.username!
							},
							// add original post author
							{
								name: originalPostAuthor!
							}
						]
					: [
							{
								name: post.username!
							}
						],
				// the description is shown as a "preview" in the NewsFlash app.
				description: post.content,
				// the content is shown in a panel to the right in the NewsFlash app.
				content
			});
		}
		switch (accept) {
			case 'application/atom+xml':
				return new Response(feed.atom1(), {
					headers: {
						'Content-Type': 'application/atom+xml'
					}
				});
			default:
			case 'application/rss+xml':
				return new Response(feed.rss2(), {
					headers: {
						'Content-Type': 'application/rss+xml'
					}
				});
			case 'application/json':
				return new Response(feed.json1(), {
					headers: {
						'Content-Type': 'application/json'
					}
				});
		}
	} catch (err) {
		console.error('Error while syndicating user posts:', err);
		return new Response('Internal Server Error', { status: 500 });
	}
}
