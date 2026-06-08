import { searchManga } from '$lib/services/manga';
import { isRateLimitError } from '$lib/services/errors';
import { buildUpstreamCookieHeader } from '$lib/server/mangabatsCookies';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, cookies }) => {
	const q = url.searchParams.get('q') ?? '';
	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
	const cookieHeader = buildUpstreamCookieHeader(cookies);
	try {
		const results = q.trim() ? await searchManga(q, page, cookieHeader) : [];
		return { results, q, page, rateLimited: false as const };
	} catch (err) {
		if (isRateLimitError(err)) return { results: [], q, page, rateLimited: true as const };
		throw err;
	}
};
