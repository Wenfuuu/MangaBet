import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	malConfigured,
	generateVerifier,
	buildAuthorizeUrl,
	setTransientCookies,
} from '$lib/server/mal/oauth';

export const GET: RequestHandler = async ({ url, cookies }) => {
	if (!malConfigured()) error(503, 'MAL sync is not configured (missing MAL_CLIENT_ID / MAL_CLIENT_SECRET)');

	const returnParam = url.searchParams.get('return') ?? '/';
	// Only allow same-origin relative paths as the post-auth destination.
	const returnPath = returnParam.startsWith('/') && !returnParam.startsWith('//') ? returnParam : '/';

	const state = generateVerifier();
	const verifier = generateVerifier();
	setTransientCookies(cookies, state, verifier, returnPath);

	redirect(302, buildAuthorizeUrl(`${url.origin}/api/mal/callback`, state, verifier));
};
