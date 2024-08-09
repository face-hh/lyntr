import { config } from 'dotenv';
import { error } from '@sveltejs/kit';
import * as jose from 'jose';
import { users } from './schema';
import { db } from './db';

import { eq } from 'drizzle-orm';

config({ path: '.env' });

export type JWTPayload = {
	userId: string;
	timestamp: number;
};

export const createAuthJWT = async (data: JWTPayload) => {
	// Check if user is banned
	const user = await db.select().from(users).where(eq(users.id, data.userId)).limit(1);

	if (user[0]?.banned) {
		throw new Error('User is banned and cannot create a new token.');
	}

	const jwt = await new jose.SignJWT(data)
		.setProtectedHeader({ alg: 'HS256' })
		.sign(new TextEncoder().encode(process.env.JWT_SECRET));

	return jwt;
};

export const verifyAuthJWT = async (token: string) => {
	try {
		const { payload } = await jose.jwtVerify(
			token,
			new TextEncoder().encode(process.env.JWT_SECRET)
		);

		const user = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);

		if (!user[0]) {
			throw error(401, 'Invalid token.');
		}

		if (user[0].banned) {
			throw error(403, 'You are banned.');
		}

		

		return payload as JWTPayload;
	} catch (error) {
		throw error;
	}
};

export const deleteJWT = async (token: string) => {
	try {
		return true;
	} catch {
		throw error(500, 'Error deleting token.');
	}
};
