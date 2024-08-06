import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, parent }) => {
	const parentData = await parent();
	const handle = params.handle.replace(/^@/, '');
	if (!/^[a-zA-Z0-9_-]+$/.test(handle)) {
		throw new Error('Invalid handle');
	}
	return {
		...parentData,
		handle: handle
	};
};
