import type { RequestHandler } from '@sveltejs/kit';
import { addConnection, removeConnection } from '$lib/sse';

export const GET: RequestHandler = async ({ setHeaders }) => {
	setHeaders({
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		'Connection': 'keep-alive',
		'X-Accel-Buffering': 'no'
	});

	const stream = new ReadableStream({
		start(controller) {
			addConnection(controller);

			const keepAliveInterval = setInterval(() => {
				try {
					controller.enqueue(': keep-alive\n\n');
				} catch (error) {
					clearInterval(keepAliveInterval);
					removeConnection(controller);
				}
			}, 20000); // Ping every 20 seconds

			return () => {
				clearInterval(keepAliveInterval);
				removeConnection(controller);
			};
		}
	});

	return new Response(stream);
};
