import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isLoggedIn, buildUpstreamCookieHeader } from '$lib/server/mangabatsCookies';
import { getBookmarks } from '$lib/services/bookmark';
import { isRateLimitError } from '$lib/services/errors';
import type { BookmarkItem } from '$lib/types';

/** Every bookmark across all upstream pages — used by the mass MAL sync. */
export const GET: RequestHandler = async ({ cookies }) => {
	if (!isLoggedIn(cookies)) error(401, 'Not logged in');

	const cookieHeader = buildUpstreamCookieHeader(cookies);
	try {
		const first = await getBookmarks(1, cookieHeader);
		const items: BookmarkItem[] = [...first.items];

		if (first.totalPages > 1) {
			const rest = await Promise.all(
				Array.from({ length: first.totalPages - 1 }, (_, i) => getBookmarks(i + 2, cookieHeader)),
			);
			for (const page of rest) items.push(...page.items);
		}

		return json(items);
	} catch (err) {
		if (isRateLimitError(err)) error(429, 'Upstream rate limit — try again in a moment');
		throw err;
	}
};
