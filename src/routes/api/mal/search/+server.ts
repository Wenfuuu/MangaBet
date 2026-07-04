import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getValidAccessToken } from '$lib/server/mal/oauth';
import { searchMalManga } from '$lib/server/mal/api';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	// MAL rejects queries shorter than 3 characters.
	if (q.length < 3) return json([]);

	const token = await getValidAccessToken(cookies);
	if (!token) error(401, 'MAL not connected');

	return json(await searchMalManga(q, token));
};
