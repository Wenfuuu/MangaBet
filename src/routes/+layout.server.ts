import type { LayoutServerLoad } from './$types';
import { isLoggedIn, buildUpstreamCookieHeader } from '$lib/server/mangabatsCookies';
import { getUserProfile } from '$lib/services/user';

export const load: LayoutServerLoad = async ({ cookies }) => {
	const loggedIn = isLoggedIn(cookies);
	if (!loggedIn) return { isLoggedIn: false, user: null };

	try {
		const user = await getUserProfile(buildUpstreamCookieHeader(cookies));
		return { isLoggedIn: true, user };
	} catch {
		return { isLoggedIn: true, user: null };
	}
};
