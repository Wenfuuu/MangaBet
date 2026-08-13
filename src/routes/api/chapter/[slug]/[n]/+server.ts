import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPages } from '$lib/services/chapter';
import { buildUpstreamCookieHeader } from '$lib/server/mangabatsCookies';

export const GET: RequestHandler = async ({ params, cookies }) => {
	const { images, mangaName, chapterTitle } = await getPages(
		params.slug,
		params.n,
		buildUpstreamCookieHeader(cookies)
	);
	return json({ pages: images, mangaName, chapterTitle });
};
