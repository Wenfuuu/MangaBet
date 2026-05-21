import type { LayoutServerLoad } from './$types';
import { isLoggedIn } from '$lib/server/mangabatsCookies';

export const load: LayoutServerLoad = async ({ cookies }) => {
	return { isLoggedIn: isLoggedIn(cookies) };
};
