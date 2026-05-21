import type { Cookies } from '@sveltejs/kit';
import { dev } from '$app/environment';

export const MB_PREFIX = 'mb_';

const DEFAULT_OPTS = {
	path: '/',
	httpOnly: true,
	sameSite: 'lax' as const,
	secure: !dev,
};

interface ParsedSetCookie {
	name: string;
	value: string;
	maxAge?: number;
	expires?: Date;
}

function parseSetCookie(header: string): ParsedSetCookie | null {
	const parts = header.split(';').map((p) => p.trim());
	const nameValue = parts.shift();
	if (!nameValue) return null;
	const eq = nameValue.indexOf('=');
	if (eq < 0) return null;
	const name = nameValue.slice(0, eq);
	const value = decodeURIComponent(nameValue.slice(eq + 1));

	let maxAge: number | undefined;
	let expires: Date | undefined;
	for (const attr of parts) {
		const [rawKey, rawVal] = attr.split('=');
		const key = rawKey.trim().toLowerCase();
		if (key === 'max-age' && rawVal) maxAge = parseInt(rawVal.trim(), 10);
		else if (key === 'expires' && rawVal) {
			const d = new Date(rawVal.trim());
			if (!isNaN(d.getTime())) expires = d;
		}
	}
	return { name, value, maxAge, expires };
}

/**
 * Read every mb_* cookie our domain has and build a "Cookie: foo=bar; baz=qux"
 * header value to forward to mangabats. Strips the mb_ prefix.
 */
export function buildUpstreamCookieHeader(cookies: Cookies): string {
	return cookies
		.getAll()
		.filter((c) => c.name.startsWith(MB_PREFIX))
		.map((c) => `${c.name.slice(MB_PREFIX.length)}=${encodeURIComponent(c.value)}`)
		.join('; ');
}

/**
 * Parse upstream Set-Cookie headers and store each one as an mb_<name> cookie
 * on our domain. Mirrors max-age / expires when provided.
 */
export function storeUpstreamCookies(setCookieHeaders: string[], cookies: Cookies): number {
	let stored = 0;
	for (const header of setCookieHeaders) {
		const parsed = parseSetCookie(header);
		if (!parsed) continue;
		const opts: Parameters<Cookies['set']>[2] = { ...DEFAULT_OPTS };
		if (parsed.maxAge !== undefined) opts.maxAge = parsed.maxAge;
		else if (parsed.expires) opts.expires = parsed.expires;
		cookies.set(MB_PREFIX + parsed.name, parsed.value, opts);
		stored++;
	}
	return stored;
}

export function clearAllMangabatsCookies(cookies: Cookies): void {
	for (const c of cookies.getAll()) {
		if (c.name.startsWith(MB_PREFIX)) {
			cookies.delete(c.name, { path: '/' });
		}
	}
}

export function isLoggedIn(cookies: Cookies): boolean {
	return cookies.getAll().some((c) => c.name === MB_PREFIX + 'token');
}
