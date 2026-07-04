import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	malConfigured,
	exchangeCode,
	storeTokens,
	clearTransientCookies,
	STATE_COOKIE,
	VERIFIER_COOKIE,
	RETURN_COOKIE,
} from '$lib/server/mal/oauth';

export const GET: RequestHandler = async ({ url, cookies }) => {
	if (!malConfigured()) error(503, 'MAL sync is not configured');

	const returnPath = cookies.get(RETURN_COOKIE) ?? '/';

	// MAL reports user denial / errors via query params instead of a code.
	if (url.searchParams.get('error')) {
		clearTransientCookies(cookies);
		redirect(303, returnPath);
	}

	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const expectedState = cookies.get(STATE_COOKIE);
	const verifier = cookies.get(VERIFIER_COOKIE);

	if (!code || !state || !expectedState || !verifier || state !== expectedState) {
		clearTransientCookies(cookies);
		error(400, 'Invalid OAuth callback — try connecting again');
	}

	try {
		const tokens = await exchangeCode(code, verifier, `${url.origin}/api/mal/callback`);
		storeTokens(cookies, tokens);
	} catch (err) {
		console.warn('[mal] code exchange failed', err);
		clearTransientCookies(cookies);
		error(502, 'MyAnimeList rejected the login — try connecting again');
	}

	clearTransientCookies(cookies);
	redirect(303, returnPath);
};
