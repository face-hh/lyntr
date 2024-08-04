import { json } from '@sveltejs/kit';
import type { Cookies, RequestHandler } from '@sveltejs/kit';

import { Snowflake } from 'nodejs-snowflake';

import { verifyAuthJWT, createAuthJWT } from '@/server/jwt';
import { db } from '@/server/db';
import { followers, likes, lynts, notifications, users, history } from '@/server/schema';
import { eq, inArray, sql } from 'drizzle-orm';
import { supabase } from '@/supabase';
import { minioClient } from '@/server/minio';
import { deleteLynt, uploadAvatar } from '../util';
import { readFileSync } from 'fs';
import sanitizeHtml from 'sanitize-html';

interface Question {
	id: string;
	condition: Function;
}

let questions: Question[] = [
	{
		id: 'AGI',
		condition: (input: any) => {
			return santize(input) === 'artificialgeneralintelligence' ? -3 : 4;
		}
	},
	{
		id: 'CatQuestion',
		condition: (input: any) => {
			return Boolean(input) === true ? -2 : 1;
		}
	},
	{
		id: 'ShortFormContent',
		condition: (input: any) => {
			return -1 * Math.min(sanitizeNum(input), 12);
		}
	},
	{
		id: 'Chemistry',
		condition: (input: any) => {
			return santize(input as string) === 'francium' ? 10 : -5;
		}
	},
	{
		id: 'GPT',
		condition: (input: any) => {
			return santize(input) === 'generativepretrainedtransformer' ? 5 : -3;
		}
	},
	{
		id: 'MathQuestion',
		condition: (input: any) => {
			return parseInt(input) === 30 ? 8 : -20;
		}
	},
	{
		id: 'ContentCreators',
		condition: (input: any) => {
			return Math.floor(-1 * Math.floor(Math.min(sanitizeNum(input), 47) * 0.25));
		}
	},
	{
		id: 'MathProblem',
		condition: (input: any) => {
			return parseInt(input) === 9 ? 15 : -10;
		}
	},
	{
		id: 'SequenceSymbol',
		condition: (input: any) => {
			return input === 'idfk' ? 10 : -7;
		}
	},
	{
		id: 'SequenceNumber',
		condition: (input: any) => {
			return parseInt(input) === 42 ? 9 : -3;
		}
	},
	{
		id: 'Dexerto',
		condition: (input: any) => {
			return Boolean(input) == true ? -25 : 25;
		}
	},
	{
		id: 'MathProblemComplex',
		condition: (input: any) => {
			return parseInt(input) === 355 ? 25 : 0;
		}
	},
	{
		id: 'TypingTest',
		condition: (input: any) => {
			return Math.floor(Math.min(sanitizeNum(input), 120) * 0.5);
		}
	},
	{
		id: 'AudioRick',
		condition: (input: any) => {
			return Boolean(input) ? -13 : 5;
		}
	},
	{
		id: 'Degree',
		condition: (input: any) => {
			return Boolean(input) ? 0 : -5;
		}
	},
	{
		id: 'AudioAgeOfWar',
		condition: (input: any) => {
			return Boolean(input) ? 15 : -5;
		}
	},
	{
		id: 'British',
		condition: (_: any) => {
			return 0;
		}
	},
	{
		id: 'Kubernete',
		condition: (input: any) => {
			return Boolean(input) ? -3 : 0;
		}
	},
	{
		id: 'ReactionImage',
		condition: (input: any) => {
			return Boolean(input) ? -10 : 5;
		}
	},
	{
		id: 'GimmickAccount',
		condition: (input: any) => {
			return Boolean(input) ? -5 : 5;
		}
	}
];

const inputBuffer = readFileSync('static/default.webp');

export const POST: RequestHandler = async ({
	request,
	cookies
}: {
	request: Request;
	cookies: Cookies;
}) => {
	const supabaseToken = request.headers.get('Authorization')?.split('Bearer ')[1];

	const { data, error } = await supabase.auth.getUser(supabaseToken);

	if (error || !data.user || !supabaseToken) {
		throw new Error('Invalid Supabase token');
	}

	const body = await request.json();

	if (!body.handle || !body.username || !data.user.email) {
		return json({ error: 'Invalid request - missing fields.' }, { status: 400 });
	}

	if (body.handle.length > 32 || body.username.length > 60) {
		return json(
			{ error: 'Handle (32) or username (60) are over the character limit.' },
			{ status: 400 }
		);
	}

	const existingUser = await db
		.select()
		.from(users)
		.where(eq(users.email, data.user.email))
		.limit(1);

	if (existingUser.length > 0) {
		return json({ error: 'Email already in use' }, { status: 409 });
	}

	let totalIQ = 80; // Start with default 80 IQ
	let formattedText = '';

	for (const question of questions) {
		if (body[question.id] !== undefined) {
			const iqChange = question.condition(body[question.id]);

			totalIQ += iqChange;
			formattedText += `${question.id} = ${iqChange > 0 ? '+' : ''}${iqChange} IQ\n`;
		} else {
			return json({ error: `Missing question: ${question.id}` }, { status: 400 });
		}
	}

	try {
		const userId = new Snowflake({
			custom_epoch: new Date('2024-07-13T11:29:44.526Z').getTime()
		});
		const uniqueUserId = String(userId.getUniqueID());

		const cleanedHandle = body.handle.replace(/[^0-9a-z_-]/gi, '').toLowerCase();

		const jwt = await createAuthJWT({
			userId: uniqueUserId
		});

		const [newLynt] = await db
			.insert(users)
			.values({
				id: uniqueUserId,
				handle: cleanedHandle,
				iq: totalIQ,
				token: jwt,
				email: data.user?.email,
				username: body.username.replace('\n', ' ')
			})
			.returning();

		uploadAvatar(inputBuffer, uniqueUserId, minioClient);

		const iqObject = {
			totalIQ: totalIQ,
			formattedText: formattedText.trim()
		};

		cookies.set('_TOKEN__DO_NOT_SHARE', jwt, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			maxAge: 31536000
		});

		return json({ ...newLynt, ...iqObject }, { status: 201 });
	} catch (error) {
		console.error('Error creating user:', error);
		return json({ error: 'Failed to create user.' }, { status: 500 });
	}
};

export const GET: RequestHandler = async ({ url }) => {
	const userHandle = url.searchParams.get('handle');
	const userId = url.searchParams.get('id');

	if (!userHandle && !userId) {
		return json({ error: 'Missing user handle or id.' }, { status: 400 });
	}

	try {
		const query = sql`
            SELECT 
                u.id, 
                u.handle, 
                u.created_at, 
                u.username, 
                u.iq, 
                u.verified,
                u.bio,
                (SELECT COUNT(*) FROM ${followers} WHERE user_id = u.id) AS followers_count,
                (SELECT COUNT(*) FROM ${followers} WHERE follower_id = u.id) AS following_count
            FROM ${users} u
            WHERE ${userHandle ? sql`u.handle = ${userHandle}` : sql`u.id = ${userId}`}
            LIMIT 1
        `;

		const result = await db.execute(query);
		const user = result[0];

		if (!user) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		return json({
			id: user.id,
			handle: user.handle,
			created_at: user.created_at,
			username: user.username,
			iq: user.iq,
			verified: user.verified,
			followers: parseInt(String(user.followers_count)),
			following: parseInt(String(user.following_count)),
			bio: user.bio
		});
	} catch (error) {
		console.error('Error fetching user:', error);
		return json({ error: 'Failed to fetch user' }, { status: 500 });
	}
};

export const PATCH: RequestHandler = async ({ request, cookies }) => {
	const authToken = cookies.get('_TOKEN__DO_NOT_SHARE');
	if (!authToken) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	let userId;
	try {
		const decodedToken = await verifyAuthJWT(authToken);
		userId = decodedToken.userId;
	} catch (error) {
		return json({ error: 'Invalid token' }, { status: 401 });
	}

	const body = await request.json();
	let { bio, username } = body;

	const updateData: Partial<typeof users.$inferInsert> = {};

	if (bio) {
		if (typeof bio !== 'string' || bio.length > 256) {
			return json({ error: 'Bio must be a string of 256 characters or less' }, { status: 400 });
		}
		updateData.bio = bio;
	}

	if (username) {
		if (typeof username !== 'string' || username.length > 60) {
			return json({ error: 'Username must be a string of 60 characters or less' }, { status: 400 });
		}
		updateData.username = username;
	}

	if (Object.keys(updateData).length === 0) {
		return json({ message: 'No updates provided' }, { status: 400 });
	}

	try {
		const [updatedUser] = await db
			.update(users)
			.set(updateData)
			.where(eq(users.id, userId))
			.returning();

		return json(
			{
				message: 'User updated successfully',
				user: {
					id: updatedUser.id,
					handle: updatedUser.handle,
					username: updatedUser.username,
					bio: updatedUser.bio
				}
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error('Error updating user:', error);
		return json({ error: 'Failed to update user' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ request, cookies }) => {
	const authToken = cookies.get('_TOKEN__DO_NOT_SHARE');
	if (!authToken) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	let userId;
	try {
		const decodedToken = await verifyAuthJWT(authToken);
		userId = decodedToken.userId;
	} catch (error) {
		return json({ error: 'Invalid token' }, { status: 401 });
	}

	try {
		// Start a transaction
		await db.transaction(async (tx) => {
			// Delete notifications
			console.log('Account deletion - ' + userId);
			console.time('Getting all lynts');
			const userLynts = await tx
				.select({ id: lynts.id })
				.from(lynts)
				.where(eq(lynts.user_id, userId));
			console.timeEnd('Getting all lynts');
			console.time('Deleting all lynts');
			for (const lynt of userLynts) {
				await deleteLynt(lynt.id);
			}
			console.timeEnd('Deleting all lynts');
			// Delete notifications
			console.time('Deleting all notifications');
			await tx.delete(notifications).where(eq(notifications.userId, userId));
			await tx.delete(notifications).where(eq(notifications.sourceUserId, userId));
			console.timeEnd('Deleting all notifications');
			console.time('Deleting all history');
			// Delete history
			await tx.delete(history).where(eq(history.user_id, userId));
			console.timeEnd('Deleting all history');
			// Delete followers
			console.time('Deleting all followers/following');
			await tx.delete(followers).where(eq(followers.user_id, userId));
			await tx.delete(followers).where(eq(followers.follower_id, userId));
			console.timeEnd('Deleting all followers/following');

			// NEW: Delete any remaining likes by the user
			console.time('Deleting all remaining likes');
			await tx.delete(likes).where(eq(likes.user_id, userId));
			console.timeEnd('Deleting all remaining likes');

			// Finally, delete the user
			console.time('Deleting user');
			const deletedUser = await tx.delete(users).where(eq(users.id, userId)).returning();
			console.timeEnd('Deleting user');

			if (deletedUser.length === 0) {
				throw new Error('User not found');
			}
		});

		// Clear the auth cookie
		cookies.delete('_TOKEN__DO_NOT_SHARE', {
			path: '/', httpOnly: true,
			secure: true,
			sameSite: 'strict',
			maxAge: 31536000 // 1 year
		});

		return json({ message: 'User and all related data deleted successfully' }, { status: 200 });
	} catch (error) {
		console.error('Error deleting user:', error);
		return json({ error: 'Failed to delete user and related data' }, { status: 500 });
	}
};

function santize(input: string) {
	return input.toLowerCase().replace(/\s/g, '');
}

function sanitizeNum(input: string) {
	let num = parseInt(input)

	if (num < 0) num = 0;

	return num
}