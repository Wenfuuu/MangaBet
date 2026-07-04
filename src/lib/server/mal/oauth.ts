import type { Cookies } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { fetchWithRetry } from '$lib/services/fetchRetry';
import type { MalTokenResponse } from '$lib/types';

const AUTHORIZE_URL = 'https://myanimelist.net/v1/oauth2/authorize';
const TOKEN_URL = 'https://myanimelist.net/v1/oauth2/token';

const ACCESS_COOKIE = 'mal_access';
const REFRESH_COOKIE = 'mal_refresh';
const EXPIRES_COOKIE = 'mal_expires';
export const STATE_COOKIE = 'mal_oauth_state';
export const VERIFIER_COOKIE = 'mal_oauth_verifier';
export const RETURN_COOKIE = 'mal_oauth_return';

const REFRESH_MAX_AGE = 90 * 24 * 60 * 60; // MAL refresh tokens outlive the 31d access token
const TRANSIENT_MAX_AGE = 10 * 60;
/** Refresh this long before actual expiry so in-flight requests never race a dead token. */
const EXPIRY_MARGIN_MS = 60 * 60 * 1000;

const DEFAULT_OPTS = {
	path: '/',
	httpOnly: true,
	sameSite: 'lax' as const,
	secure: !dev,
};

export function malConfigured(): boolean {
	return Boolean(env.MAL_CLIENT_ID && env.MAL_CLIENT_SECRET);
}

export function isMalConnected(cookies: Cookies): boolean {
	return Boolean(cookies.get(REFRESH_COOKIE));
}

/** PKCE code verifier — MAL only supports the `plain` method, so this doubles as the challenge. */
export function generateVerifier(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(48));
	// base64url without padding: 64 chars, all within the allowed unreserved set
	return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function buildAuthorizeUrl(redirectUri: string, state: string, verifier: string): string {
	const params = new URLSearchParams({
		response_type: 'code',
		client_id: env.MAL_CLIENT_ID!,
		state,
		redirect_uri: redirectUri,
		code_challenge: verifier,
		code_challenge_method: 'plain',
	});
	return `${AUTHORIZE_URL}?${params}`;
}

export function setTransientCookies(cookies: Cookies, state: string, verifier: string, returnPath: string): void {
	const opts = { ...DEFAULT_OPTS, maxAge: TRANSIENT_MAX_AGE };
	cookies.set(STATE_COOKIE, state, opts);
	cookies.set(VERIFIER_COOKIE, verifier, opts);
	cookies.set(RETURN_COOKIE, returnPath, opts);
}

export function clearTransientCookies(cookies: Cookies): void {
	for (const name of [STATE_COOKIE, VERIFIER_COOKIE, RETURN_COOKIE]) {
		cookies.delete(name, { path: '/' });
	}
}

export function storeTokens(cookies: Cookies, tokens: MalTokenResponse): void {
	cookies.set(ACCESS_COOKIE, tokens.access_token, { ...DEFAULT_OPTS, maxAge: tokens.expires_in });
	cookies.set(REFRESH_COOKIE, tokens.refresh_token, { ...DEFAULT_OPTS, maxAge: REFRESH_MAX_AGE });
	cookies.set(EXPIRES_COOKIE, String(Date.now() + tokens.expires_in * 1000), {
		...DEFAULT_OPTS,
		maxAge: REFRESH_MAX_AGE,
	});
}

export function clearMalCookies(cookies: Cookies): void {
	for (const name of [ACCESS_COOKIE, REFRESH_COOKIE, EXPIRES_COOKIE]) {
		cookies.delete(name, { path: '/' });
	}
	clearTransientCookies(cookies);
}

async function requestTokens(body: Record<string, string>): Promise<MalTokenResponse> {
	const res = await fetchWithRetry(TOKEN_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			client_id: env.MAL_CLIENT_ID!,
			client_secret: env.MAL_CLIENT_SECRET!,
			...body,
		}),
	});
	if (!res.ok) {
		throw new Error(`MAL token request failed: ${res.status} ${await res.text().catch(() => '')}`);
	}
	return res.json();
}

export function exchangeCode(code: string, verifier: string, redirectUri: string): Promise<MalTokenResponse> {
	return requestTokens({
		grant_type: 'authorization_code',
		code,
		code_verifier: verifier,
		redirect_uri: redirectUri,
	});
}

function refreshTokens(refreshToken: string): Promise<MalTokenResponse> {
	return requestTokens({ grant_type: 'refresh_token', refresh_token: refreshToken });
}

/**
 * Returns a usable access token, transparently refreshing when near expiry.
 * Returns null (and clears cookies) when the session is gone for good.
 */
export async function getValidAccessToken(cookies: Cookies): Promise<string | null> {
	const refresh = cookies.get(REFRESH_COOKIE);
	if (!refresh) return null;

	const access = cookies.get(ACCESS_COOKIE);
	const expires = parseInt(cookies.get(EXPIRES_COOKIE) ?? '0', 10);
	if (access && Date.now() < expires - EXPIRY_MARGIN_MS) return access;

	try {
		const tokens = await refreshTokens(refresh);
		storeTokens(cookies, tokens);
		return tokens.access_token;
	} catch (err) {
		console.warn('[mal] token refresh failed — clearing MAL session', err);
		clearMalCookies(cookies);
		return null;
	}
}
