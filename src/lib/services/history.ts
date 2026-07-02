import { ENDPOINTS } from '$lib/api';
import { withUpstreamAuth } from './upstreamHeaders';
import { fetchWithRetry } from './fetchRetry';
import { ensureOk } from './errors';

export async function saveHistory(
	comicId: number,
	chapterId: number,
	cookieHeader?: string,
): Promise<void> {
	const headers: HeadersInit = {
		...withUpstreamAuth(cookieHeader),
		'Content-Type': 'application/json',
	};
	const res = await fetchWithRetry(ENDPOINTS.addHistory(), {
		method: 'POST',
		headers,
		body: JSON.stringify({ comic_id: comicId, chapter_id: chapterId }),
	});
	ensureOk(res, 'Save history');
}
