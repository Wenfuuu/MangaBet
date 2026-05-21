import { searchManga } from '$lib/services/manga';
import { buildUpstreamCookieHeader } from '$lib/server/mangabatsCookies';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, cookies }) => {
	const q = url.searchParams.get('q') ?? '';
	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
	const cookieHeader = buildUpstreamCookieHeader(cookies);
	const results = q.trim() ? await searchManga(q, page, cookieHeader) : [];
	return { results, q, page };
};
