import type { PageLoad } from './$types';

export const load: PageLoad = ({ setHeaders, parent }) => {
	// Cache for 1 day
	setHeaders({
		'cache-control': 'Cache-control: max-age=86400, public',
	});
	return parent();
};
