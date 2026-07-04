import type { LayoutServerLoad } from './$types';
import { isLoggedIn, buildUpstreamCookieHeader } from '$lib/server/mangabatsCookies';
import { isMalConnected } from '$lib/server/mal/oauth';
import { getUserProfile } from '$lib/services/user';

export const load: LayoutServerLoad = async ({ cookies }) => {
	const malConnected = isMalConnected(cookies);
	const loggedIn = isLoggedIn(cookies);
	if (!loggedIn) return { isLoggedIn: false, user: null, malConnected };

	try {
		const user = await getUserProfile(buildUpstreamCookieHeader(cookies));
		return { isLoggedIn: true, user, malConnected };
	} catch {
		return { isLoggedIn: true, user: null, malConnected };
	}
};
