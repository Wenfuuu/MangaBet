import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isLoggedIn, buildUpstreamCookieHeader } from '$lib/server/mangabatsCookies';
import { saveHistory } from '$lib/services/history';

export const POST: RequestHandler = async ({ request, cookies }) => {
	if (!isLoggedIn(cookies)) error(401, 'Not logged in');

	const body = (await request.json().catch(() => null)) as { comicId?: number; chapterId?: number } | null;
	const comicId = Number(body?.comicId);
	const chapterId = Number(body?.chapterId);
	if (!Number.isFinite(comicId) || !Number.isFinite(chapterId)) error(400, 'Invalid comicId or chapterId');

	await saveHistory(comicId, chapterId, buildUpstreamCookieHeader(cookies));
	return json({ ok: true });
};
