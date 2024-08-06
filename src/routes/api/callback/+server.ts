config({ path: '.env' });
import { db } from '@/server/db';
import { createAuthJWT } from '@/server/jwt';
import { users } from '@/server/schema';

import { json, redirect, type RequestHandler } from '@sveltejs/kit';
import { config } from 'dotenv';
import { eq } from 'drizzle-orm';

import { PUBLIC_DISCORD_CLIENT_ID } from '$env/static/public';

export const GET: RequestHandler = async ({ request, url, cookies }) => {
	try {
		const code = url.searchParams.get('code');
		if (!code) return json({ error: 'No code search parameter' }, { status: 400 });

		const formData = new URLSearchParams();
		formData.set('grant_type', 'authorization_code');
		formData.set('code', code);
		url.search = '';
		if (url.port == '') url.protocol = 'https://';
		formData.set('redirect_uri', url.toString());

		const codeRes = await fetch('https://discord.com/api/v10/oauth2/token', {
			method: 'POST',
			body: formData,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Authorization:
					'Basic ' +
					btoa(`${process.env.PUBLIC_DISCORD_CLIENT_ID}:${process.env.DISCORD_CLIENT_SECRET}`)
			}
		});
		console.log(formData);

		if (codeRes.status != 200) return json({ errror: 'Invalid state' }, { status: 400 });
		const data = await codeRes.json();

		const accessToken = data['access_token'];
		const meRes = await fetch('https://discord.com/api/v10/users/@me', {
			headers: {
				Authorization: `Bearer ${accessToken}`
			}
		});

		if (meRes.status != 200) return json({ errror: 'Invalid user' }, { status: 400 });
		const meBody = await meRes.json();

		try {
			const roleconnectionsRes = await fetch(`https://discord.com/api/v10/applications/${PUBLIC_DISCORD_CLIENT_ID}/role-connections/metadata`, {
				method: 'PUT',
				body: JSON.stringify(
					[
						{ 
							type : 7, // BOOLEAN_EQUAL the metadata value (integer) is equal to the guild's configured value (integer; 1)
							key : "lyntr_user", // Unique key name to identify this metadata.
							name : "Registered Lyntr user", // / Human-readable name for the metadata.
							description : "The user has created an account on Lyntr" // Description of what this metadata represents.
						}
					]
				),
				headers: {
					Authorization: `Bearer ${accessToken}`,
					"Content-Type": "application/json"
				}
			});
	
			if (roleconnectionsRes.status != 200) {
				console.log("roleconnectionsRes status is ", roleconnectionsRes.status);
			} else {
				const roleconnectionsBody = await roleconnectionsRes.json();
			} 
			
		} catch (error) {
			console.error(error)
		}

		const existingUser = await db
			.select()
			.from(users)
			.where(eq(users.email, meBody.email))
			.limit(1);

		if (existingUser.length > 0) {
			const jwt = await createAuthJWT({
				userId: existingUser[0].id
			});
			cookies.set('_TOKEN__DO_NOT_SHARE', jwt, {
				path: '/',
				httpOnly: true,
				secure: true,
				sameSite: 'strict',
				maxAge: 31536000
			});
		}

		cookies.set('temp-discord-token', accessToken, {
			path: '/',
			httpOnly: false,
			secure: false
		});

		return new Response(null, {
			status: 301,
			headers: {
				Location: '/'
			}
		});
	} catch (error) {
		console.error('Error while handling discord callback', error);
		return json({ error: 'Unexpected internal error' }, { status: 500 });
	}
};
