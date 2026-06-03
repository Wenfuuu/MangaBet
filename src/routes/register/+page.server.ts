import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { fetchCaptcha } from '$lib/services/auth';
import { storeUpstreamCookies, isLoggedIn } from '$lib/server/mangabatsCookies';

export const load: PageServerLoad = async ({ cookies }) => {
	if (isLoggedIn(cookies)) redirect(303, '/');

	const { imageDataUrl, setCookieHeaders } = await fetchCaptcha();
	storeUpstreamCookies(setCookieHeaders, cookies);
	return { captchaImage: imageDataUrl };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const username = (form.get('username') ?? '').toString().trim();
		const displayname = (form.get('displayname') ?? '').toString().trim();
		const email = (form.get('email') ?? '').toString().trim();
		const password = (form.get('password') ?? '').toString();
		const confirmPassword = (form.get('confirmPassword') ?? '').toString();
		const captcha = (form.get('captcha') ?? '').toString().trim();

		if (!username || !displayname || !email || !password || !confirmPassword || !captcha) {
			return fail(400, {
				error: 'All fields are required.',
				username,
				displayname,
				email,
			});
		}

		if (password !== confirmPassword) {
			return fail(400, {
				error: 'Passwords do not match.',
				username,
				displayname,
				email,
			});
		}

		// TODO: registration implementation pending
		return fail(501, {
			error: 'Registration is not yet wired up.',
			username,
			displayname,
			email,
		});
	},
};
