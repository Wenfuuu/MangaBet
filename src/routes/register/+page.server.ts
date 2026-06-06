import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { fetchCaptcha, register, type RegisterField } from '$lib/services/auth';
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
		const displayname = (form.get('displayname') ?? '').toString().trim();
		const email = (form.get('email') ?? '').toString().trim();
		const password = (form.get('password') ?? '').toString();
		const confirmPassword = (form.get('confirmPassword') ?? '').toString();
		const captcha = (form.get('captcha') ?? '').toString().trim();

		const values = { username, displayname, email };

		if (!username || !displayname || !email || !password || !confirmPassword || !captcha) {
			return fail(400, { ...values, error: 'All fields are required.' });
		}

		if (password !== confirmPassword) {
			return fail(400, {
				...values,
				fieldErrors: { password: 'Passwords do not match.' } as Partial<
					Record<RegisterField, string>
				>,
			});
		}

		const cookieHeader = buildUpstreamCookieHeader(cookies);
		if (!cookieHeader.includes('captcha=')) {
			return fail(400, { ...values, error: 'Captcha expired. Refresh and try again.' });
		}

		const result = await register(username, password, displayname, email, captcha, cookieHeader);
		storeUpstreamCookies(result.setCookieHeaders, cookies);

		if (!result.ok) {
			return fail(result.fieldErrors ? 422 : 400, {
				...values,
				error: result.generalError,
				fieldErrors: result.fieldErrors,
			});
		}

		redirect(303, '/login?registered=1');
	},
};
