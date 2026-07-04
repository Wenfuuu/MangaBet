import { fetchWithRetry } from '$lib/services/fetchRetry';
import { RateLimitError, isRateLimitError } from '$lib/services/errors';
import type { MalSyncPageMapping } from '$lib/types';

/**
 * mangabats.com is a MangaNato-family clone and shares its slugs, so the
 * crowd-sourced MAL-Sync database can resolve our slugs to MAL IDs directly.
 */
const MAPPING_URL = (slug: string) => `https://api.malsync.moe/page/MangaNato/${encodeURIComponent(slug)}`;

/** Jikan (unofficial MAL mirror) — title search used as fallback. 3 req/s, 60 req/min. */
const JIKAN_SEARCH_URL = (title: string) =>
	`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(title)}&limit=10`;

// Warm serverless instances keep these between requests; cold starts just refetch.
const cache = new Map<string, MalSyncPageMapping | null>();
const fallbackCache = new Map<string, ResolvedEntry | null>();

export interface ResolvedEntry {
	malId: number;
	title: string;
}

export async function resolveMapping(slug: string): Promise<MalSyncPageMapping | null> {
	if (cache.has(slug)) return cache.get(slug)!;

	const res = await fetchWithRetry(MAPPING_URL(slug));
	if (res.status === 404) {
		cache.set(slug, null);
		return null;
	}
	// Rate limited is NOT "unmapped" — surface it so callers can retry instead
	// of wrongly reporting the manga as having no MAL entry.
	if (res.status === 429) throw new RateLimitError('MAL-Sync mapping API rate limited');
	if (!res.ok) {
		// Transient upstream trouble — don't cache, let a later read retry.
		console.warn(`[mal] mapping lookup failed for "${slug}": ${res.status}`);
		throw new Error(`Mapping lookup failed: ${res.status}`);
	}

	const mapping: MalSyncPageMapping = await res.json();
	cache.set(slug, mapping);
	return mapping;
}

interface JikanManga {
	mal_id: number;
	type?: string | null;
	members?: number;
	titles?: { type: string; title: string }[];
}

// Titles must match exactly after normalization — Jikan's top result is often a
// different work entirely, so fuzzy acceptance would corrupt the user's list.
const normalizeTitle = (s: string) =>
	s
		.toLowerCase()
		.replace(/[’‘]/g, "'")
		.replace(/[“”]/g, '"')
		.replace(/\s+/g, ' ')
		.trim();

async function searchJikanExact(title: string): Promise<ResolvedEntry | null> {
	const res = await fetchWithRetry(JIKAN_SEARCH_URL(title));
	if (res.status === 429) throw new RateLimitError('Jikan API rate limited');
	if (!res.ok) throw new Error(`Jikan search failed: ${res.status}`);

	const body: { data?: JikanManga[] } = await res.json();
	const want = normalizeTitle(title);
	const exact = (body.data ?? []).filter((m) =>
		m.titles?.some((t) => normalizeTitle(t.title) === want),
	);
	if (exact.length === 0) return null;

	// Same-title collisions: prefer the serialization over a oneshot, then the
	// entry with the largest MAL following (almost always the "main" one).
	const nonOneshot = exact.filter((m) => m.type !== 'One-shot');
	const pool = nonOneshot.length > 0 ? nonOneshot : exact;
	const pick = pool.sort((a, b) => (b.members ?? 0) - (a.members ?? 0))[0];
	return {
		malId: pick.mal_id,
		title: pick.titles?.find((t) => t.type === 'Default')?.title ?? title,
	};
}

/**
 * Slug mapping via MAL-Sync first (authoritative), Jikan exact-title search as
 * fallback when MAL-Sync is rate limited or has no mapping. Throws RateLimitError
 * only when the item could not be resolved AND a later retry might succeed.
 */
export async function resolveMalIdWithFallback(
	slug: string,
	title?: string,
): Promise<{ malId: number | null; title: string | null }> {
	// A previous fallback hit answers immediately without spending malsync budget.
	const cachedFallback = fallbackCache.get(slug);
	if (cachedFallback) return cachedFallback;

	let malsyncLimited = false;
	try {
		const mapping = await resolveMapping(slug);
		if (mapping?.malId) return { malId: mapping.malId, title: mapping.title };
		// malsync definitively knows this slug has no MAL entry → try the fallback.
	} catch (err) {
		if (!isRateLimitError(err)) throw err;
		malsyncLimited = true;
	}

	if (title && !fallbackCache.has(slug)) {
		const found = await searchJikanExact(title);
		if (found) {
			fallbackCache.set(slug, found);
			return found;
		}
		// Only a definitive malsync miss makes "no match" cacheable — while malsync
		// is throttled it might still know a mapping Jikan can't find by title.
		if (!malsyncLimited) fallbackCache.set(slug, null);
	}

	if (malsyncLimited) throw new RateLimitError('Mapping lookups rate limited');
	return { malId: null, title: null };
}
