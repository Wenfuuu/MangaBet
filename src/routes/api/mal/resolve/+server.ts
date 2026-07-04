import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { resolveMapping } from '$lib/server/mal/mapping';
import type { MalMappingInfo } from '$lib/types';

/** Reports the automatic (crowd-sourced) MAL mapping for a slug — overrides live client-side. */
export const GET: RequestHandler = async ({ url }) => {
	const slug = url.searchParams.get('slug');
	if (!slug) error(400, 'Missing slug');

	const mapping = await resolveMapping(slug);
	return json({
		malId: mapping?.malId ?? null,
		title: mapping?.title ?? null,
		malUrl: mapping?.malId ? `https://myanimelist.net/manga/${mapping.malId}` : null,
	} satisfies MalMappingInfo);
};
