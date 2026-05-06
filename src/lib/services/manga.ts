import type { MangaSearchDTO } from '$lib/types';
import { ENDPOINTS, MANGABATS_HEADERS } from '$lib/api';

export async function searchManga(query: string): Promise<MangaSearchDTO[]> {
	if (!query.trim()) return [];
	const res = await fetch(ENDPOINTS.search(query), { headers: MANGABATS_HEADERS });
	if (!res.ok) throw new Error(`Search failed: ${res.status}`);
	return res.json();
}
