import { ENDPOINTS, API_BASE_HEADERS } from '$lib/api';

export interface CaptchaResult {
	imageDataUrl: string;
	setCookieHeaders: string[];
}

export interface LoginResult {
	ok: boolean;
	setCookieHeaders: string[];
}

export type RegisterField = 'username' | 'password' | 'displayname' | 'email' | 'captcha';

export interface RegisterResult {
	ok: boolean;
	fieldErrors?: Partial<Record<RegisterField, string>>;
	generalError?: string;
	setCookieHeaders: string[];
}

const BROWSER_UA =
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export async function fetchCaptcha(): Promise<CaptchaResult> {
	const res = await fetch(ENDPOINTS.captcha(), {
		headers: { ...API_BASE_HEADERS, 'User-Agent': BROWSER_UA },
	});
	if (!res.ok) throw new Error(`Captcha fetch failed: ${res.status}`);
	const html = await res.text();
	const match = html.match(/src="(data:image\/[^"]+)"/);
	if (!match) throw new Error('Captcha image not found in response');
	return {
		imageDataUrl: match[1],
		setCookieHeaders: res.headers.getSetCookie?.() ?? [],
	};
}

export async function login(
	username: string,
	password: string,
	captcha: string,
	cookieHeader: string,
): Promise<LoginResult> {
	const body = new URLSearchParams({ username, password, captcha });
	const res = await fetch(ENDPOINTS.login(), {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Referer: `${ENDPOINTS.login()}`,
			'User-Agent': BROWSER_UA,
			Cookie: cookieHeader,
		},
		body: body.toString(),
		redirect: 'manual',
	});
	const setCookieHeaders = res.headers.getSetCookie?.() ?? [];
	const ok = setCookieHeaders.some((h) => /^token=/i.test(h));
	return { ok, setCookieHeaders };
}

export async function register(
	username: string,
	password: string,
	displayname: string,
	email: string,
	captcha: string,
	cookieHeader: string,
): Promise<RegisterResult> {
	const body = new URLSearchParams({ username, password, displayname, email, captcha });
	const res = await fetch(ENDPOINTS.register(), {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Accept: 'application/json',
			Referer: `${ENDPOINTS.register()}`,
			'User-Agent': BROWSER_UA,
			'X-Requested-With': 'XMLHttpRequest',
			Cookie: cookieHeader,
		},
		body: body.toString(),
		redirect: 'manual',
	});
	const setCookieHeaders = res.headers.getSetCookie?.() ?? [];

	if (res.ok) {
		return { ok: true, setCookieHeaders };
	}

	let generalError = 'Registration failed.';
	let fieldErrors: Partial<Record<RegisterField, string>> | undefined;
	try {
		const data = (await res.json()) as {
			message?: string;
			errors?: Record<string, string[]>;
		};
		if (data.message) generalError = data.message;
		if (data.errors) {
			fieldErrors = {};
			const allowed: RegisterField[] = ['username', 'password', 'displayname', 'email', 'captcha'];
			for (const key of allowed) {
				const msg = data.errors[key]?.[0];
				if (typeof msg === 'string') fieldErrors[key] = msg;
			}
		}
	} catch {
		// non-JSON response — fall back to generalError default
	}

	return { ok: false, fieldErrors, generalError, setCookieHeaders };
}
