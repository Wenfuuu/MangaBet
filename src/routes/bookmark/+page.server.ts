import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { isLoggedIn, buildUpstreamCookieHeader } from '$lib/server/mangabatsCookies';
import { getBookmarks, setBookmark } from '$lib/services/bookmark';
import { isRateLimitError } from '$lib/services/errors';

export const load: PageServerLoad = async ({ cookies, url }) => {
	if (!isLoggedIn(cookies)) redirect(303, '/login');

	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
	const cookieHeader = buildUpstreamCookieHeader(cookies);
	try {
		const bookmarks = await getBookmarks(page, cookieHeader);
		return { bookmarks, rateLimited: false as const };
	} catch (err) {
		if (isRateLimitError(err)) return { rateLimited: true as const };
		throw err;
	}
};

export const actions: Actions = {
	remove: async ({ request, cookies }) => {
		if (!isLoggedIn(cookies)) return fail(401, { error: 'Not logged in' });
		const form = await request.formData();
		const id = form.get('id')?.toString();
		if (!id) return fail(400, { error: 'Missing manga id' });
		try {
			await setBookmark(id, 'remove', buildUpstreamCookieHeader(cookies));
			return { removed: id };
		} catch {
			return fail(500, { error: 'Remove failed' });
		}
	},
};
