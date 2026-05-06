import { searchManga } from '$lib/services/manga';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q') ?? '';
	const results = q.trim() ? await searchManga(q) : [];
	return { results, q };
};
