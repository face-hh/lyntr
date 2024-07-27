import type { PageLoad } from './$types';

export const load: PageLoad = ({ parent }) => {
	return parent();
};
