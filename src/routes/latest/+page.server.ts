import type { PageServerLoad } from './$types';
import { buildUpstreamCookieHeader } from '$lib/server/mangabatsCookies';
import { getLatestManga } from '$lib/services/manga';
import { isRateLimitError } from '$lib/services/errors';

export const load: PageServerLoad = async ({ cookies, url }) => {
	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
	const cookieHeader = buildUpstreamCookieHeader(cookies);
	try {
		const latest = await getLatestManga(page, cookieHeader);
		return { latest, rateLimited: false as const };
	} catch (err) {
		if (isRateLimitError(err)) return { rateLimited: true as const };
		throw err;
	}
};
