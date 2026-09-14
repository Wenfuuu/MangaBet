import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isLoggedIn, buildUpstreamCookieHeader } from '$lib/server/mangabatsCookies';
import { findSiteEntry } from '$lib/server/mal/reverseMapping';
import { setBookmark } from '$lib/services/bookmark';
import { isRateLimitError, isUpstreamError } from '$lib/services/errors';
import type { MalImportResult } from '$lib/types';

/**
 * Pull one MAL list entry into the upstream bookmarks. Needs no MAL token — the
 * caller already holds the list from /api/mal/list; this half of the round trip
 * is entirely upstream-side.
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
	if (!isLoggedIn(cookies)) error(401, 'Not logged in');

	const body = (await request.json().catch(() => null)) as {
		malId?: number;
		title?: string;
	} | null;
	const malId = body?.malId;
	const title = typeof body?.title === 'string' ? body.title.trim() : '';
	if (!Number.isInteger(malId) || (malId as number) < 1) error(400, 'Invalid malId');
	if (!title) error(400, 'Missing title');

	const cookieHeader = buildUpstreamCookieHeader(cookies);
	try {
		const match = await findSiteEntry(malId as number, title, cookieHeader);
		if (!match) return json({ imported: false, reason: 'unmatched' } satisfies MalImportResult);

		await setBookmark(match.mangaId, 'add', cookieHeader);
		return json({
			imported: true,
			slug: match.slug,
			mangaId: match.mangaId,
			title: match.title,
		} satisfies MalImportResult);
	} catch (err) {
		if (isRateLimitError(err)) error(429, 'Rate limited — retry in a moment');
		if (isUpstreamError(err)) error(503, 'Upstream temporarily unavailable — retry in a moment');
		throw err;
	}
};
