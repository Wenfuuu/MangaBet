import { fetchWithRetry } from '$lib/services/fetchRetry';
import type { MalMangaStatus, MalListStatus, MalReadStatus, MalSearchCandidate } from '$lib/types';

const API_BASE = 'https://api.myanimelist.net/v2';

interface MalSearchNode {
	id: number;
	title: string;
	media_type?: string;
	num_chapters?: number;
	start_date?: string;
	main_picture?: { medium?: string; large?: string };
}

export async function searchMalManga(query: string, token: string): Promise<MalSearchCandidate[]> {
	const params = new URLSearchParams({
		q: query,
		limit: '10',
		fields: 'media_type,num_chapters,start_date',
	});
	const res = await fetchWithRetry(`${API_BASE}/manga?${params}`, {
		headers: { Authorization: `Bearer ${token}` },
	});
	if (!res.ok) throw new Error(`MAL search failed: ${res.status}`);
	const body: { data?: { node: MalSearchNode }[] } = await res.json();
	return (body.data ?? []).map(({ node }) => ({
		id: node.id,
		title: node.title,
		mediaType: node.media_type ?? 'manga',
		numChapters: node.num_chapters ?? 0,
		year: node.start_date?.slice(0, 4) ?? null,
		image: node.main_picture?.medium ?? null,
	}));
}

export async function getMangaStatus(malId: number, token: string): Promise<MalMangaStatus> {
	const res = await fetchWithRetry(`${API_BASE}/manga/${malId}?fields=my_list_status,num_chapters`, {
		headers: { Authorization: `Bearer ${token}` },
	});
	if (!res.ok) throw new Error(`MAL manga status fetch failed: ${res.status}`);
	return res.json();
}

export async function updateMangaProgress(
	malId: number,
	chapter: number,
	status: MalReadStatus,
	token: string,
): Promise<MalListStatus> {
	const res = await fetchWithRetry(`${API_BASE}/manga/${malId}/my_list_status`, {
		method: 'PATCH',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: new URLSearchParams({ num_chapters_read: String(chapter), status }),
	});
	if (!res.ok) throw new Error(`MAL progress update failed: ${res.status}`);
	return res.json();
}
