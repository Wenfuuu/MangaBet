import type { PageServerLoad } from './$types';
import { getChapters, getPages } from '$lib/services/chapter';

export const load: PageServerLoad = async ({ params }) => {
	const [pageData, chapters] = await Promise.all([
		getPages(params.slug, parseInt(params.n, 10)),
		getChapters(params.slug),
	]);
	return {
		pages: pageData.images,
		mangaName: pageData.mangaName,
		chapterTitle: pageData.chapterTitle,
		chapters,
	};
};
