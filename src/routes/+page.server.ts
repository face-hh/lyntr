import type { PageLoad } from './$types';
import { getLynt } from "$lib/server/lynt"

export const load: PageLoad  = async ({ url }) => {
    const id = url.searchParams.get('id');
    const lynt = await getLynt(id || '');
        
    return {
        lynt,
        lyntOpened: id,
    };
};  