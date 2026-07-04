import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { clearMalCookies } from '$lib/server/mal/oauth';

export const POST: RequestHandler = async ({ cookies }) => {
	clearMalCookies(cookies);
	return json({ ok: true });
};
