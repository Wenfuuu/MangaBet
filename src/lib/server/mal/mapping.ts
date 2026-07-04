import { fetchWithRetry } from '$lib/services/fetchRetry';
import type { MalSyncPageMapping } from '$lib/types';

/**
 * mangabats.com is a MangaNato-family clone and shares its slugs, so the
 * crowd-sourced MAL-Sync database can resolve our slugs to MAL IDs directly.
 */
const MAPPING_URL = (slug: string) => `https://api.malsync.moe/page/MangaNato/${encodeURIComponent(slug)}`;

// Warm serverless instances keep this between requests; cold starts just refetch.
const cache = new Map<string, number | null>();

export async function resolveMalId(slug: string): Promise<number | null> {
	if (cache.has(slug)) return cache.get(slug)!;

	const res = await fetchWithRetry(MAPPING_URL(slug));
	if (res.status === 404) {
		cache.set(slug, null);
		return null;
	}
	if (!res.ok) {
		// Transient upstream trouble — don't cache, let a later read retry.
		console.warn(`[mal] mapping lookup failed for "${slug}": ${res.status}`);
		return null;
	}

	const mapping: MalSyncPageMapping = await res.json();
	const malId = mapping.malId ?? null;
	cache.set(slug, malId);
	return malId;
}
