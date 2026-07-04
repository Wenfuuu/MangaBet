import { fetchWithRetry } from '$lib/services/fetchRetry';
import { RateLimitError } from '$lib/services/errors';
import type { MalMangaStatus, MalListStatus, MalReadStatus, MalSearchCandidate } from '$lib/types';

const API_BASE = 'https://api.myanimelist.net/v2';

function ensureMalOk(res: Response, context: string): Response {
	if (res.status === 429) throw new RateLimitError(`${context}: MAL API rate limited`);
	if (!res.ok) throw new Error(`${context} failed: ${res.status}`);
	return res;
}

interface MalSearchNode {
	id: number;
	title: string;
	media_type?: string;
	num_chapters?: number;
	start_date?: string;
	main_picture?: { medium?: string; large?: string };
}

export async function searchMalManga(query: string, authHeaders: HeadersInit): Promise<MalSearchCandidate[]> {
	const params = new URLSearchParams({
		q: query,
		limit: '10',
		fields: 'media_type,num_chapters,start_date',
	});
	const res = await fetchWithRetry(`${API_BASE}/manga?${params}`, {
		headers: authHeaders,
	});
	ensureMalOk(res, 'MAL search');
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
	ensureMalOk(res, 'MAL manga status fetch');
	return res.json();
}

export async function updateMangaListStatus(
	malId: number,
	fields: { num_chapters_read?: number; status?: MalReadStatus },
	token: string,
): Promise<MalListStatus> {
	const body = new URLSearchParams();
	if (fields.num_chapters_read !== undefined) body.set('num_chapters_read', String(fields.num_chapters_read));
	if (fields.status !== undefined) body.set('status', fields.status);

	const res = await fetchWithRetry(`${API_BASE}/manga/${malId}/my_list_status`, {
		method: 'PATCH',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body,
	});
	ensureMalOk(res, 'MAL progress update');
	return res.json();
}
