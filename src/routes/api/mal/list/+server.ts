import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getValidAccessToken } from '$lib/server/mal/oauth';
import { getUserMangaList } from '$lib/server/mal/api';
import { isRateLimitError } from '$lib/services/errors';

/** The user's full MAL manga list — fetched once per mass sync for the local diff. */
export const GET: RequestHandler = async ({ cookies }) => {
	const token = await getValidAccessToken(cookies);
	if (!token) error(401, 'MAL not connected');

	try {
		return json(await getUserMangaList(token));
	} catch (err) {
		if (isRateLimitError(err)) error(429, 'MAL rate limited — retry in a moment');
		throw err;
	}
};
