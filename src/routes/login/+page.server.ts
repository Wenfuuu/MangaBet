import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { isLoggedIn, storeUpstreamCookies } from '$lib/server/mangabatsCookies';
import { parseSessionToken } from '$lib/server/sessionToken';
import { isUnauthorizedError } from '$lib/services/errors';
import { getUserProfile } from '$lib/services/user';

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export const load: PageServerLoad = async ({ cookies }) => {
	if (isLoggedIn(cookies)) redirect(303, '/');
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await request.formData();
		const token = parseSessionToken((form.get('token') ?? '').toString());

		if (!token) {
			return fail(400, { error: 'That doesn’t look like a token. Copy the cookie value again.' });
		}

		const cookie = `token=${encodeURIComponent(token)}`;

		try {
			await getUserProfile(cookie);
		} catch (err) {
			if (isUnauthorizedError(err)) {
				return fail(401, { error: 'mangabats rejected this token. Sign in there and copy a new one.' });
			}
			return fail(502, { error: 'Couldn’t reach mangabats to check the token. Try again in a moment.' });
		}

		storeUpstreamCookies([`${cookie}; Max-Age=${SESSION_MAX_AGE_SECONDS}`], cookies);
		redirect(303, '/');
	},
};
