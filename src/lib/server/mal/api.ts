import { fetchWithRetry } from '$lib/services/fetchRetry';
import { RateLimitError } from '$lib/services/errors';
import type { MalMangaStatus, MalListStatus, MalReadStatus, MalSearchCandidate, MalListEntry } from '$lib/types';

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

/** MAL rejects search queries over 64 chars ("invalid q") — truncate at a word boundary. */
const MAL_QUERY_MAX = 64;
export function clampMalQuery(query: string): string {
	if (query.length <= MAL_QUERY_MAX) return query;
	let q = query.slice(0, MAL_QUERY_MAX);
	const lastSpace = q.lastIndexOf(' ');
	if (lastSpace > 20) q = q.slice(0, lastSpace);
	return q;
}

export async function searchMalManga(query: string, authHeaders: HeadersInit): Promise<MalSearchCandidate[]> {
	const params = new URLSearchParams({
		q: clampMalQuery(query),
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

interface MalListItemRaw {
	node: { id: number; num_chapters?: number };
	list_status?: { status?: MalReadStatus; num_chapters_read?: number };
}

/** The user's whole manga list — one request per 1000 entries. Used to diff before mass sync. */
export async function getUserMangaList(token: string): Promise<MalListEntry[]> {
	const LIMIT = 1000;
	const entries: MalListEntry[] = [];
	let offset = 0;

	for (;;) {
		const params = new URLSearchParams({
			fields: 'list_status,num_chapters',
			limit: String(LIMIT),
			offset: String(offset),
			// MAL omits NSFW-flagged entries by default — without this the diff would
			// miss list entries and mass sync would re-write them every run.
			nsfw: 'true',
		});
		const res = await fetchWithRetry(`${API_BASE}/users/@me/mangalist?${params}`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		ensureMalOk(res, 'MAL list fetch');
		const body: { data?: MalListItemRaw[]; paging?: { next?: string } } = await res.json();
		const data = body.data ?? [];

		for (const it of data) {
			entries.push({
				malId: it.node.id,
				status: it.list_status?.status ?? '',
				chaptersRead: it.list_status?.num_chapters_read ?? 0,
				numChapters: it.node.num_chapters ?? 0,
			});
		}

		if (data.length < LIMIT || !body.paging?.next) break;
		offset += LIMIT;
	}

	return entries;
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
