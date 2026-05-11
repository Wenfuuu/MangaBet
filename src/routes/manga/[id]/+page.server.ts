import type { PageServerLoad } from './$types';
import { getChapters } from '$lib/services/chapter';

export const load: PageServerLoad = async ({ params }) => {
	const chapters = await getChapters(params.id);
	return { chapters };
};
