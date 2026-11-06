import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { isLoggedIn } from '$lib/server/mangabatsCookies';

export const load: PageServerLoad = async ({ cookies }) => {
	if (isLoggedIn(cookies)) redirect(303, '/');
};
