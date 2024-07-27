// src/routes/api/sse/+server.ts

import type { RequestHandler } from '@sveltejs/kit';
import { addConnection, removeConnection } from '$lib/sse';

export const GET: RequestHandler = async ({ setHeaders }) => {
	setHeaders({
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		Connection: 'keep-alive'
	});

	const stream = new ReadableStream({
		start(controller) {
			addConnection(controller);

			return () => {
				removeConnection(controller);
			};
		}
	});

	return new Response(stream);
};
