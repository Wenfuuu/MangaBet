import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { clearAllMangabatsCookies } from '$lib/server/mangabatsCookies';

export const POST: RequestHandler = async ({ cookies }) => {
	clearAllMangabatsCookies(cookies);
	redirect(303, '/');
};
