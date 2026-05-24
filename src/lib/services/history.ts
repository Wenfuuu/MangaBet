import { ENDPOINTS } from '$lib/api';
import { withUpstreamAuth } from './upstreamHeaders';

export async function saveHistory(
	comicId: number,
	chapterId: number,
	cookieHeader?: string,
): Promise<void> {
	const headers: HeadersInit = {
		...withUpstreamAuth(cookieHeader),
		'Content-Type': 'application/json',
	};
	const res = await fetch(ENDPOINTS.addHistory(), {
		method: 'POST',
		headers,
		body: JSON.stringify({ comic_id: comicId, chapter_id: chapterId }),
	});
	if (!res.ok) throw new Error(`Save history failed: ${res.status}`);
}
