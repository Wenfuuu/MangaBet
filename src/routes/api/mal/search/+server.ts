import { error, json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import { getValidAccessToken } from '$lib/server/mal/oauth';
import { searchMalManga } from '$lib/server/mal/api';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	// MAL rejects queries shorter than 3 characters.
	if (q.length < 3) return json([]);

	// Prefer the user's token; guests fall back to app-level auth (search is public data).
	const token = await getValidAccessToken(cookies);
	let authHeaders: HeadersInit;
	if (token) authHeaders = { Authorization: `Bearer ${token}` };
	else if (env.MAL_CLIENT_ID) authHeaders = { 'X-MAL-CLIENT-ID': env.MAL_CLIENT_ID };
	else error(503, 'MAL is not configured');

	return json(await searchMalManga(q, authHeaders));
};
