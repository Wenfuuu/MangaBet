import { searchManga } from '$lib/services/manga';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q') ?? '';
	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
	const results = q.trim() ? await searchManga(q, page) : [];
	return { results, q, page };
};
