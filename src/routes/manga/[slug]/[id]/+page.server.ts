import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getMangaDetail } from '$lib/services/manga';
import { getChapters } from '$lib/services/chapter';
import { getBookmarkStatus, setBookmark, findBookmarkProgress } from '$lib/services/bookmark';
import { isRateLimitError } from '$lib/services/errors';
import { buildUpstreamCookieHeader, isLoggedIn } from '$lib/server/mangabatsCookies';

export const load: PageServerLoad = async ({ params, cookies }) => {
	const cookieHeader = buildUpstreamCookieHeader(cookies);
	const loggedIn = isLoggedIn(cookies);
	const hasRealId = params.id && params.id !== '0';

	try {
		const [detail, chapters, isBookmarked] = await Promise.all([
			getMangaDetail(params.slug, cookieHeader),
			getChapters(params.slug, cookieHeader),
			loggedIn && hasRealId
				? getBookmarkStatus(params.id, cookieHeader).catch(() => null)
				: Promise.resolve(null),
		]);

		const progress =
			loggedIn && hasRealId && isBookmarked
				? findBookmarkProgress(params.id, cookieHeader).catch(() => null)
				: Promise.resolve(null);

		return { detail, chapters, isBookmarked, progress, rateLimited: false as const };
	} catch (err) {
		if (isRateLimitError(err)) {
			return {
				detail: null,
				chapters: [],
				isBookmarked: null,
				progress: Promise.resolve(null),
				rateLimited: true as const,
			};
		}
		throw err;
	}
};

export const actions: Actions = {
	toggleBookmark: async ({ params, request, cookies }) => {
		if (!isLoggedIn(cookies)) return fail(401, { error: 'Not logged in' });
		if (!params.id || params.id === '0') return fail(400, { error: 'Missing manga id' });

		const form = await request.formData();
		const action = form.get('action') === 'add' ? 'add' : 'remove';
		try {
			await setBookmark(params.id, action, buildUpstreamCookieHeader(cookies));
			return { isBookmarked: action === 'add' };
		} catch {
			return fail(500, { error: 'Bookmark toggle failed' });
		}
	},
};
