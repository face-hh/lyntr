import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { verifyAuthJWT } from '@/server/jwt';
import { minioClient } from '@/server/minio';
import { v4 as uuidv4 } from 'uuid';
import { config } from 'dotenv';
import { uploadAvatar } from '../util';
import { isImageNsfw, NSFW_ERROR } from '@/moderation';
import { sensitiveRatelimit } from '@/server/ratelimit';

config();

export const POST: RequestHandler = async ({ request, cookies }) => {
	const authCookie = cookies.get('_TOKEN__DO_NOT_SHARE');

	if (!authCookie) {
		return json({ error: 'Missing authentication' }, { status: 401 });
	}

	try {
		const jwtPayload = await verifyAuthJWT(authCookie);

		if (!jwtPayload.userId) {
			throw new Error('Invalid JWT token');
		}
		const { userId } = jwtPayload;
		const { success } = await sensitiveRatelimit.limit(userId);

		if (!success) {
			return json({ error: 'You are ratelimited.' }, { status: 429 });
		}

		const formData = await request.formData();

		const file = formData.get('file') as File;

		if (!file) {
			return json({ error: 'No file uploaded' }, { status: 400 });
		}

		const fileName = jwtPayload.userId;

		const arrayBuffer = await file.arrayBuffer();
		const inputBuffer = Buffer.from(arrayBuffer);

		if(await isImageNsfw(inputBuffer)) {
			return NSFW_ERROR
		}

		// compression
		await uploadAvatar(inputBuffer, fileName, minioClient);

		return json(
			{
				message: 'File uploaded successfully'
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error('File upload error:', error);
		return json({ error: 'File upload failed' }, { status: 500 });
	}
};
