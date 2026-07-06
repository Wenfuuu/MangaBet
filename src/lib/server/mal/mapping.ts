import { env } from '$env/dynamic/private';
import { fetchWithRetry } from '$lib/services/fetchRetry';
import { RateLimitError, isRateLimitError } from '$lib/services/errors';
import { clampMalQuery } from './api';
import type { MalSyncPageMapping } from '$lib/types';

/**
 * mangabats.com is a MangaNato-family clone and shares its slugs, so the
 * crowd-sourced MAL-Sync database can resolve our slugs to MAL IDs directly.
 */
const MAPPING_URL = (slug: string) => `https://api.malsync.moe/page/MangaNato/${encodeURIComponent(slug)}`;

/** Jikan (unofficial MAL mirror) — title-search fallback. 3 req/s, 60 req/min. */
const JIKAN_SEARCH_URL = (title: string) =>
	`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(title)}&limit=10`;

/** Official MAL search (app auth) — the strongest title matcher. q is capped at 64 chars. */
const MAL_SEARCH_URL = (q: string) =>
	`https://api.myanimelist.net/v2/manga?q=${encodeURIComponent(q)}&limit=10&fields=alternative_titles,media_type`;

// Warm serverless instances keep these between requests; cold starts just refetch.
const cache = new Map<string, MalSyncPageMapping | null>();
const fallbackCache = new Map<string, ResolvedEntry | null>();

export interface ResolvedEntry {
	malId: number;
	title: string;
	/** How this match was accepted ('top' = ungated search fallback) — logged for source-attribution stats. */
	grade?: MatchGrade;
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

// Titles must be letter-for-letter identical ignoring case, spacing, punctuation
// and common romanization variants. Sites and MAL disagree on word breaks
// ("Sukitte" vs "Suki tte"), the を particle ("o" vs "wo") and long vowels
// ("Mahou"/"Mahō"/"Maho") — while fuzzy acceptance would corrupt lists with
// different works, so we fold those variants and require full equality.
const squash = (s: string) =>
	s
		.toLowerCase()
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '') // macrons/diacritics: ō → o
		.replace(/\bwo\b/g, 'o') // を particle romanized both ways
		.replace(/[^\p{L}\p{N}]+/gu, '')
		.replace(/ou/g, 'o') // long-vowel folding
		.replace(/([aeiou])\1+/g, '$1');

// Manga sites never host prose novels — a novel entry sharing the title is the
// adaptation source, not what the user is reading.
const NOVEL_TYPES = new Set(['novel', 'light_novel', 'light novel']);

// Bracketed qualifiers often differ between sites and MAL ("[Baku Advantage] X",
// "X (Serialization)", "X [Pixiv Edition]") — compare with and without them.
// Never strip markers that distinguish a different WORK rather than a labeling
// quirk (doujinshi, novel editions, anthologies).
const MEANINGFUL_BRACKET = /doujin|novel|anthology|one[- ]?shot/i;
const BRACKET_LEAD = /^\s*(\[[^\]]*\]|【[^】]*】|\([^)]*\))\s*/;
const BRACKET_TRAIL = /\s*(\[[^\]]*\]|【[^】]*】|\([^)]*\))\s*$/;

function titleVariants(t: string): string[] {
	const variants = [t];
	let cur = t.trim();
	for (const re of [BRACKET_LEAD, BRACKET_TRAIL, BRACKET_LEAD, BRACKET_TRAIL]) {
		const m = cur.match(re);
		if (m && !MEANINGFUL_BRACKET.test(m[1])) {
			cur = cur.replace(re, '').trim();
			if (cur) variants.push(cur);
		}
	}
	return variants;
}

const digitsOf = (s: string) => s.replace(/\D/g, '');

function editDistance(a: string, b: string): number {
	let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
	for (let i = 1; i <= a.length; i++) {
		const cur = [i];
		for (let j = 1; j <= b.length; j++) {
			cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
		}
		prev = cur;
	}
	return prev[b.length];
}

type MatchGrade = 'exact' | 'fuzzy' | 'top';
// Fuzzy tier: long titles only, digits must be identical (a sequel's "2" can
// never sneak through), and at most ~4% of the letters may differ — enough for
// romanization drift like "Batoru"/"Battle", far too tight for a different work.
const FUZZY_MIN_LEN = 20;
const FUZZY_RATIO = 0.04;

function gradeMatch(siteTitle: string, candidateTitles: (string | null | undefined)[]): MatchGrade | null {
	const wants = titleVariants(siteTitle).map(squash).filter(Boolean);
	const cands = candidateTitles
		.filter((t): t is string => Boolean(t))
		.flatMap(titleVariants)
		.map(squash)
		.filter(Boolean);

	for (const w of wants) if (cands.includes(w)) return 'exact';

	for (const w of wants) {
		if (w.length < FUZZY_MIN_LEN) continue;
		const wd = digitsOf(w);
		for (const c of cands) {
			if (c.length < FUZZY_MIN_LEN || digitsOf(c) !== wd) continue;
			const max = Math.floor(Math.max(w.length, c.length) * FUZZY_RATIO);
			if (max > 0 && Math.abs(w.length - c.length) <= max && editDistance(w, c) <= max) {
				return 'fuzzy';
			}
		}
	}
	return null;
}

interface JikanManga {
	mal_id: number;
	type?: string | null;
	members?: number;
	titles?: { type: string; title: string }[];
}

interface SearchResult {
	/** Title-gated match — trusted for direct use. */
	match: ResolvedEntry | null;
	/** First non-novel hit in relevance order, ignoring the title gate — last-resort fallback. */
	top: ResolvedEntry | null;
}

async function searchJikan(title: string): Promise<SearchResult> {
	const res = await fetchWithRetry(JIKAN_SEARCH_URL(title));
	if (res.status === 429) throw new RateLimitError('Jikan API rate limited');
	if (!res.ok) throw new Error(`Jikan search failed: ${res.status}`);

	const body: { data?: JikanManga[] } = await res.json();
	const candidates = (body.data ?? []).filter((m) => !NOVEL_TYPES.has((m.type ?? '').toLowerCase()));
	const first = candidates[0];
	const top: ResolvedEntry | null = first
		? {
				malId: first.mal_id,
				title: first.titles?.find((t) => t.type === 'Default')?.title ?? title,
				grade: 'top',
			}
		: null;

	const graded = candidates
		.map((m) => ({ m, grade: gradeMatch(title, (m.titles ?? []).map((t) => t.title)) }))
		.filter((x) => x.grade !== null);
	if (graded.length === 0) return { match: null, top };

	const exactOnly = graded.filter((x) => x.grade === 'exact');
	const pool = (exactOnly.length > 0 ? exactOnly : graded).map((x) => x.m);

	// Same-title collisions: prefer the serialization over a oneshot, then the
	// entry with the largest MAL following (almost always the "main" one).
	const nonOneshot = pool.filter((m) => (m.type ?? '').toLowerCase() !== 'one-shot');
	const pick = (nonOneshot.length > 0 ? nonOneshot : pool).sort(
		(a, b) => (b.members ?? 0) - (a.members ?? 0),
	)[0];
	return {
		match: {
			malId: pick.mal_id,
			title: pick.titles?.find((t) => t.type === 'Default')?.title ?? title,
			grade: exactOnly.length > 0 ? 'exact' : 'fuzzy',
		},
		top,
	};
}

interface MalSearchResultNode {
	id: number;
	title: string;
	media_type?: string;
	alternative_titles?: { en?: string; ja?: string; synonyms?: string[] };
}

async function searchMal(title: string, isSiblingLookup = false): Promise<SearchResult> {
	if (!env.MAL_CLIENT_ID) return { match: null, top: null };

	const q = clampMalQuery(title);

	const res = await fetchWithRetry(MAL_SEARCH_URL(q), {
		headers: { 'X-MAL-CLIENT-ID': env.MAL_CLIENT_ID },
	});
	if (res.status === 429) throw new RateLimitError('MAL search rate limited');
	if (!res.ok) throw new Error(`MAL search failed: ${res.status}`);

	const body: { data?: { node: MalSearchResultNode }[] } = await res.json();
	const nodes = (body.data ?? []).map((d) => d.node);
	const firstNonNovel = nodes.find((n) => !NOVEL_TYPES.has((n.media_type ?? '').toLowerCase()));
	const top: ResolvedEntry | null = firstNonNovel
		? { malId: firstNonNovel.id, title: firstNonNovel.title, grade: 'top' }
		: null;

	const gradedAll = nodes
		.map((n) => {
			const alt = n.alternative_titles ?? {};
			return { n, grade: gradeMatch(title, [n.title, alt.en, ...(alt.synonyms ?? [])]) };
		})
		.filter((x) => x.grade !== null);

	const graded = gradedAll.filter((x) => !NOVEL_TYPES.has((x.n.media_type ?? '').toLowerCase()));
	if (graded.length > 0) {
		const exactOnly = graded.filter((x) => x.grade === 'exact');
		const pool = (exactOnly.length > 0 ? exactOnly : graded).map((x) => x.n);

		// Keep MAL's relevance order; just avoid landing on a oneshot when the
		// serialization is also an exact match.
		const nonOneshot = pool.filter((n) => (n.media_type ?? '').toLowerCase() !== 'one_shot');
		const pick = (nonOneshot.length > 0 ? nonOneshot : pool)[0];
		return {
			match: { malId: pick.id, title: pick.title, grade: exactOnly.length > 0 ? 'exact' : 'fuzzy' },
			top,
		};
	}

	// Only a novel matched — sites host the manga adaptation, which often shares
	// the novel's native title but lacks its English synonyms (so the first
	// search misses it). One re-search with the novel's own title finds it.
	if (!isSiblingLookup) {
		const novelHit = gradedAll.find((x) => x.grade === 'exact');
		if (novelHit) {
			const sibling = await searchMal(novelHit.n.title, true);
			// The sibling search runs on the work's canonical title, so its top
			// hit is the better guess when neither search clears the gate.
			return { match: sibling.match, top: sibling.top ?? top };
		}
	}
	return { match: null, top };
}

/** Entry type/length via app auth — used to spot oneshot mappings. null = unknown. */
async function isLikelyOneshot(malId: number): Promise<boolean | null> {
	if (!env.MAL_CLIENT_ID) return null;
	const res = await fetchWithRetry(
		`https://api.myanimelist.net/v2/manga/${malId}?fields=media_type,num_chapters`,
		{ headers: { 'X-MAL-CLIENT-ID': env.MAL_CLIENT_ID } },
	);
	if (res.status === 429) throw new RateLimitError('MAL API rate limited');
	if (!res.ok) return null;
	const body: { media_type?: string; num_chapters?: number } = await res.json();
	return body.media_type === 'one_shot' || body.num_chapters === 1;
}

/**
 * The crowd DB sometimes maps a slug to the oneshot twin of a serialization
 * (the oneshot predates it, nobody re-points the mapping). When the mapped
 * entry is verifiably a oneshot and the gated title search finds a different
 * EXACT non-oneshot match, prefer that. Never breaks resolution — any doubt
 * or failure keeps the original mapping.
 */
export async function crossCheckOneshotMapping(
	malId: number,
	title: string,
	knownOneshot = false,
): Promise<ResolvedEntry | null> {
	try {
		if (!knownOneshot && (await isLikelyOneshot(malId)) !== true) return null;
		const alt = (await searchMal(title)).match;
		if (!alt || alt.malId === malId || alt.grade !== 'exact') return null;
		console.info(`[mal] redirected oneshot mapping #${malId} -> #${alt.malId} ("${title}")`);
		return alt;
	} catch (err) {
		if (!isRateLimitError(err)) console.warn(`[mal] oneshot cross-check failed for #${malId}`, err);
		return null;
	}
}

/**
 * Slug mapping via MAL-Sync first (authoritative), then title search on the
 * official MAL API and Jikan, gated to exact (squashed) title matches. When
 * every gated tier misses, the search's top candidate is used as a last
 * resort — "no MAL entry" is only reported when the searches return nothing.
 *
 * A broken tier is skipped, never fatal. Throws RateLimitError only when the
 * item stayed unresolved AND some source was busy — i.e. a retry might succeed.
 */
export async function resolveMalIdWithFallback(
	slug: string,
	title?: string,
	opts?: { crossCheckOneshot?: boolean },
): Promise<{ malId: number | null; title: string | null }> {
	// A previous fallback hit answers immediately without spending any budget.
	const cachedFallback = fallbackCache.get(slug);
	if (cachedFallback) return cachedFallback;

	// True whenever a source failed to give a definitive answer — makes the
	// overall result "retry later" instead of a cacheable "unmapped".
	let retryable = false;

	try {
		const mapping = await resolveMapping(slug);
		if (mapping?.malId) {
			if (opts?.crossCheckOneshot && title) {
				const corrected = await crossCheckOneshotMapping(mapping.malId, title);
				if (corrected) {
					fallbackCache.set(slug, corrected);
					return corrected;
				}
			}
			console.info(`[mal] resolved "${slug}" -> #${mapping.malId} via malsync`);
			return { malId: mapping.malId, title: mapping.title };
		}
		// definitive: malsync knows this slug and it has no MAL entry
	} catch (err) {
		retryable = true;
		if (!isRateLimitError(err)) console.warn(`[mal] malsync lookup failed for "${slug}"`, err);
	}

	if (title && !fallbackCache.has(slug)) {
		let found: ResolvedEntry | null = null;
		let topCandidate: ResolvedEntry | null = null;
		const tiers = [
			['mal-search', searchMal],
			['jikan', searchJikan],
		] as const;
		for (const [name, tier] of tiers) {
			try {
				const { match, top } = await tier(title);
				topCandidate ??= top;
				if (match) {
					found = match;
					console.info(
						`[mal] resolved "${slug}" -> #${found.malId} via ${name}${found.grade === 'fuzzy' ? ' (fuzzy)' : ''}`,
					);
					break;
				}
			} catch (err) {
				retryable = true;
				if (!isRateLimitError(err)) console.warn(`[mal] title fallback failed for "${title}"`, err);
			}
		}
		// Ungated top candidate only when every source answered definitively — a
		// rate-limited tier might still hold a real title-gated match, and the
		// fallbackCache would freeze this guess in place.
		if (!found && !retryable && topCandidate) {
			found = topCandidate;
			console.info(`[mal] resolved "${slug}" -> #${found.malId} via search top candidate`);
		}
		if (found) {
			fallbackCache.set(slug, found);
			return found;
		}
		if (!retryable) {
			// Every source answered definitively: this manga has no findable MAL entry.
			console.info(`[mal] no MAL match for "${slug}" (all sources definitive)`);
			fallbackCache.set(slug, null);
			return { malId: null, title: null };
		}
	}

	if (retryable) throw new RateLimitError('Mapping sources busy — retry shortly');
	return { malId: null, title: null };
}
