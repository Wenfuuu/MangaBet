import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { resolveMalIdWithFallback } from '$lib/server/mal/mapping';
import { isRateLimitError, isUpstreamError } from '$lib/services/errors';
import type { MalMappingInfo } from '$lib/types';

/**
 * Reports the automatic MAL mapping for a slug (MAL-Sync DB, title-search
 * fallback, search top candidate as last resort) — user overrides live
 * client-side.
 */
export const GET: RequestHandler = async ({ url }) => {
	const slug = url.searchParams.get('slug');
	if (!slug) error(400, 'Missing slug');
	const title = url.searchParams.get('title')?.trim() || undefined;

	try {
		// Low-volume path (detail-page badge) — worth the extra request to catch
		// crowd-DB mappings that point at a oneshot twin of the serialization.
		const resolved = await resolveMalIdWithFallback(slug, title, { crossCheckOneshot: true });
		return json({
			malId: resolved.malId,
			title: resolved.title,
			malUrl: resolved.malId ? `https://myanimelist.net/manga/${resolved.malId}` : null,
		} satisfies MalMappingInfo);
	} catch (err) {
		if (isRateLimitError(err)) error(429, 'Mapping lookups rate limited — retry shortly');
		if (isUpstreamError(err)) error(503, 'Mapping sources temporarily unavailable — retry shortly');
		throw err;
	}
};
