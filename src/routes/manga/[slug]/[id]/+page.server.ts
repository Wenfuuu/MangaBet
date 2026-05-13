import type { PageServerLoad } from './$types';
import { getMangaDetail } from '$lib/services/manga';
import { getChapters } from '$lib/services/chapter';

export const load: PageServerLoad = async ({ params }) => {
	const [detail, chapters] = await Promise.all([
		getMangaDetail(params.slug),
		getChapters(params.slug),
	]);
	return { detail, chapters };
};
