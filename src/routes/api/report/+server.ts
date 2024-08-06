import { verifyAuthJWT } from '@/server/jwt';
import { sensitiveRatelimit } from '@/server/ratelimit';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const authToken = cookies.get('_TOKEN__DO_NOT_SHARE');
	if (!authToken) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	let reporterId;
	try {
		const decodedToken = await verifyAuthJWT(authToken);
		reporterId = decodedToken.userId;
	} catch (error) {
		return json({ error: 'Invalid token' }, { status: 401 });
	}

	const { success } = await sensitiveRatelimit.limit(reporterId);

	if (!success) {
		return json({ error: 'You are being ratelimited.' }, { status: 429 });
	}

	try {
		const { text, userId, lyntId } = await request.json();

		// Validate input
		if (!text || !userId || !lyntId) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		// Check text length
		const characterCount = text.length;
		if (characterCount < 50 || characterCount > 2000) {
			return json({ error: 'Text must be between 50 and 2000 characters' }, { status: 400 });
		}

		fetch('http://bot:5444/report', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ text, userId, lyntId, reporterId })
		}).catch((error) => console.error('Error sending report:', error));

		return json({ message: 'Report received successfully' }, { status: 200 });
	} catch (error) {
		console.error('Error processing report:', error);
		return json({ error: 'Failed to process report' }, { status: 500 });
	}
};
