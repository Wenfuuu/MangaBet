import { searchManga } from '$lib/services/manga';
import { buildUpstreamCookieHeader } from '$lib/server/mangabatsCookies';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const q = url.searchParams.get('q') ?? '';
	const cookieHeader = buildUpstreamCookieHeader(cookies);
	const results = await searchManga(q, 1, cookieHeader);
	return json(results);
};
