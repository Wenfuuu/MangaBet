import { searchManga } from '$lib/services/manga';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const q = url.searchParams.get('q') ?? '';
	const results = await searchManga(q);
	return json(results);
};
