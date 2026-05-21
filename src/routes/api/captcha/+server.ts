import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { fetchCaptcha } from '$lib/services/auth';
import { storeUpstreamCookies } from '$lib/server/mangabatsCookies';

export const GET: RequestHandler = async ({ cookies }) => {
	const { imageDataUrl, setCookieHeaders } = await fetchCaptcha();
	storeUpstreamCookies(setCookieHeaders, cookies);
	return json({ imageDataUrl });
};
