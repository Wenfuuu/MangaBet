import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { fetchCaptcha, login } from '$lib/services/auth';
import {
	buildUpstreamCookieHeader,
	storeUpstreamCookies,
	isLoggedIn,
} from '$lib/server/mangabatsCookies';

export const load: PageServerLoad = async ({ cookies }) => {
	if (isLoggedIn(cookies)) redirect(303, '/');

	const { imageDataUrl, setCookieHeaders } = await fetchCaptcha();
	storeUpstreamCookies(setCookieHeaders, cookies);
	return { captchaImage: imageDataUrl };
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await request.formData();
		const username = (form.get('username') ?? '').toString().trim();
		const password = (form.get('password') ?? '').toString();
		const captcha = (form.get('captcha') ?? '').toString().trim();

		if (!username || !password || !captcha) {
			return fail(400, { error: 'All fields are required.', username });
		}

		const cookieHeader = buildUpstreamCookieHeader(cookies);
		if (!cookieHeader.includes('captcha=')) {
			return fail(400, { error: 'Captcha expired. Refresh and try again.', username });
		}

		const { ok, setCookieHeaders } = await login(username, password, captcha, cookieHeader);
		storeUpstreamCookies(setCookieHeaders, cookies);

		if (!ok) {
			return fail(401, { error: 'Invalid credentials or captcha.', username });
		}

		redirect(303, '/');
	},
};
