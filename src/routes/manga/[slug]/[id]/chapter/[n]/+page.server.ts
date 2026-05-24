import type { PageServerLoad } from './$types';
import { getChapters, getPages } from '$lib/services/chapter';
import { buildUpstreamCookieHeader } from '$lib/server/mangabatsCookies';

export const load: PageServerLoad = async ({ params, cookies }) => {
	const cookieHeader = buildUpstreamCookieHeader(cookies);
	const [pageData, chapters] = await Promise.all([
		getPages(params.slug, params.n, cookieHeader),
		getChapters(params.slug, cookieHeader),
	]);
	return {
		pages: pageData.images,
		mangaName: pageData.mangaName,
		chapterTitle: pageData.chapterTitle,
		chapterId: pageData.chapterId,
		chapters,
	};
};
