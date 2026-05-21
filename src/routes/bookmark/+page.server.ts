import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { isLoggedIn, buildUpstreamCookieHeader } from '$lib/server/mangabatsCookies';
import { getBookmarks } from '$lib/services/bookmark';

export const load: PageServerLoad = async ({ cookies, url }) => {
	if (!isLoggedIn(cookies)) redirect(303, '/login');

	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
	const cookieHeader = buildUpstreamCookieHeader(cookies);
	const bookmarks = await getBookmarks(page, cookieHeader);

	return { bookmarks };
};
