import { ENDPOINTS } from '$lib/api';
import { fetchWithRetry } from '$lib/services/fetchRetry';
import { withUpstreamAuth } from '$lib/services/upstreamHeaders';
import { RateLimitError, UpstreamError } from '$lib/services/errors';
import { decodeHtmlEntities } from '$lib/services/htmlEntities';
import { gradeMatch } from './mapping';

const MALSYNC_MAL_URL = (malId: number) => `https://api.malsync.moe/mal/manga/${malId}`;

export interface SiteMatch {
	mangaId: number;
	slug: string;
	title: string;
}

interface MalSyncSite {
	identifier: string;
	title: string;
}

interface MalSyncReverse {
	Sites?: Record<string, Record<string, MalSyncSite>>;
}

// One work often has reprint entries under their own slugs ("…-colored",
// "…-digital-colored-comics"). They map to the same MAL id, so any of them is a
// "correct" answer — but the serialization is the one a reader wants bookmarked.
const REPRINT = /colou?red|digital|official.?color/i;

const slugCache = new Map<number, MalSyncSite[]>();

/** MangaNato-family entries MAL-Sync maps to this MAL id, serializations first. */
async function knownSites(malId: number): Promise<MalSyncSite[]> {
	const cached = slugCache.get(malId);
	if (cached) return cached;

	const res = await fetchWithRetry(MALSYNC_MAL_URL(malId));
	// MAL-Sync rate limits hard, and a 429 answers nothing about this manga. Left
	// as an empty result it would be reported to the user as a permanent "not on
	// the site" — so surface it and let the caller back off and retry instead.
	if (res.status === 429) throw new RateLimitError('MAL-Sync reverse lookup rate limited');
	if (!res.ok && res.status !== 404) throw new UpstreamError('MAL-Sync reverse lookup unavailable');

	const sites =
		res.status === 404
			? []
			: Object.values(((await res.json()) as MalSyncReverse).Sites?.MangaNato ?? {});
	const ordered = [...sites].sort(
		(a, b) => Number(REPRINT.test(a.identifier)) - Number(REPRINT.test(b.identifier)),
	);
	slugCache.set(malId, ordered);
	return ordered;
}

/** Upstream detail page → the numeric id bookmarking needs, plus the site's own title. */
async function fetchSiteEntry(slug: string, cookieHeader?: string): Promise<SiteMatch | null> {
	const res = await fetchWithRetry(ENDPOINTS.mangaDetail(slug), {
		headers: withUpstreamAuth(cookieHeader),
	});
	if (!res.ok) return null;
	const html = await res.text();

	// The bookmark button carries the exact id /action/bookmark/{id} expects; the
	// comment widget's data-id is the same number and covers markup drift.
	const id = html.match(/\/action\/bookmark\/(\d+)/)?.[1] ?? html.match(/data-id="(\d+)"/)?.[1];
	if (!id) {
		console.warn(`[mal-import] no manga id on detail page for "${slug}" — markup may have changed`);
		return null;
	}

	const h1 = html.match(/<h1>([\s\S]*?)<\/h1>/)?.[1];
	return {
		mangaId: parseInt(id, 10),
		slug,
		title: h1 ? decodeHtmlEntities(h1.trim()) : slug,
	};
}

/**
 * MAL entry → the manga on our upstream, for pulling a MAL list into bookmarks.
 *
 * Runs opposite to resolveMalIdWithFallback and deliberately does not mirror it.
 * The forward path can lean on title search; this one cannot — the upstream's
 * search is unavailable to us, and bookmarking needs a numeric id that only the
 * detail page exposes. So MAL-Sync supplies the slugs and the detail page turns
 * one into an id.
 *
 * MAL-Sync's slug→MAL mapping is crowd-maintained and already trusted outright
 * by the forward path, so a mapped slug is accepted without a title check. The
 * title gate only ranks *which* of several mapped slugs to take, since a work's
 * reprints carry the same MAL id. No mapping at all means no bookmark — guessing
 * would add a different work to the user's list.
 */
export async function findSiteEntry(
	malId: number,
	malTitle: string,
	cookieHeader?: string,
): Promise<SiteMatch | null> {
	const sites = await knownSites(malId);
	if (sites.length === 0) return null;

	let fallback: SiteMatch | null = null;
	let fuzzy: SiteMatch | null = null;
	let unreachable = false;

	// Capped because the list is the same work repeated; past a few entries the
	// rest are reprints and not worth a request each.
	for (const site of sites.slice(0, 4)) {
		let entry: SiteMatch | null = null;
		try {
			entry = await fetchSiteEntry(site.identifier, cookieHeader);
		} catch {
			// One unreachable page must not sink the entry when a sibling slug may
			// still answer — but if none do, this was an outage, not a missing manga.
			unreachable = true;
			continue;
		}
		if (!entry) continue;
		fallback ??= entry;

		const grade = gradeMatch(malTitle, [entry.title, site.title]);
		if (grade === 'exact') return entry;
		if (grade === 'fuzzy') fuzzy ??= entry;
	}

	const match = fuzzy ?? fallback;
	if (!match && unreachable) throw new UpstreamError('Manga detail pages unavailable');
	return match;
}
