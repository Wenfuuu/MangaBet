import { fetchWithRetry } from '$lib/services/fetchRetry';
import type { MalMangaStatus, MalListStatus, MalReadStatus } from '$lib/types';

const API_BASE = 'https://api.myanimelist.net/v2';

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
