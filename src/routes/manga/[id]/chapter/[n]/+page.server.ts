import type { PageServerLoad } from './$types';
import { getPages } from '$lib/services/chapter';

export const load: PageServerLoad = async ({ params }) => {
	const pages = await getPages(params.id, parseInt(params.n, 10));
	return { pages };
};
