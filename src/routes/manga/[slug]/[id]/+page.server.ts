import type { PageServerLoad } from './$types';
import { getMangaDetail } from '$lib/services/manga';
import { getChapters } from '$lib/services/chapter';
import { buildUpstreamCookieHeader } from '$lib/server/mangabatsCookies';

export const load: PageServerLoad = async ({ params, cookies }) => {
	const cookieHeader = buildUpstreamCookieHeader(cookies);
	const [detail, chapters] = await Promise.all([
		getMangaDetail(params.slug, cookieHeader),
		getChapters(params.slug, cookieHeader),
	]);
	return { detail, chapters };
};
