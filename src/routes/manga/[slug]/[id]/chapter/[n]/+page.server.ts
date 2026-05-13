import type { PageServerLoad } from './$types';
import { getMangaDetail } from '$lib/services/manga';
import { getPages } from '$lib/services/chapter';

export const load: PageServerLoad = async ({ params }) => {
	const [detail, pages] = await Promise.all([
		getMangaDetail(params.slug),
		getPages(params.slug, parseInt(params.n, 10)),
	]);
	return { detail, pages };
};
