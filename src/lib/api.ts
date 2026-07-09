export const API_BASE_URL: string = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
	throw new Error('VITE_API_URL is not set — every upstream request would fail. Set it in .env');
}

export const API_BASE_HEADERS = {
	Referer: API_BASE_URL,
	'X-Requested-With': 'XMLHttpRequest',
} as const;

export const API_BASE_IMAGE_HEADERS = {
	Referer: API_BASE_URL,
} as const;

export const ENDPOINTS = {
	search: (q: string, page = 1) => `${API_BASE_URL}/home/search/json?searchword=${encodeURIComponent(q)}&page=${page}`,
	chapters: (slug: string, offset = 0, limit = 50) => `${API_BASE_URL}/api/manga/${slug}/chapters?offset=${offset}&limit=${limit}`,
	chapterPage: (mangaSlug: string, chapterSlug: string) => `${API_BASE_URL}/manga/${mangaSlug}/${chapterSlug}`,
	mangaDetail: (slug: string) => `${API_BASE_URL}/manga/${slug}`,
	captcha: () => `${API_BASE_URL}/captcha`,
	login: () => `${API_BASE_URL}/login`,
	register: () => `${API_BASE_URL}/register`,
	userChangesInfo: () => `${API_BASE_URL}/user_changes_info`,
	bookmark: (page = 1) => `${API_BASE_URL}/bookmark${page > 1 ? `?page=${page}` : ''}`,
	latestManga: (page = 1) => `${API_BASE_URL}/manga-list/latest-manga${page > 1 ? `?page=${page}` : ''}`,
	mangaStatus: (id: string | number) => `${API_BASE_URL}/manga/status/${id}`,
	bookmarkAction: (id: string | number, action: 'add' | 'remove') =>
		`${API_BASE_URL}/action/bookmark/${id}?action=${action}`,
	addHistory: () => `${API_BASE_URL}/action/add-history`,
} as const;

export const proxyImage = (thumb: string) => `/api/image?url=${encodeURIComponent(thumb)}`;

export function mangaDetailUrl(manga: { id: number; slug: string }): string {
	return `/manga/${manga.slug}/${manga.id}`;
}

export function saveMangaDTO(manga: { id: number; slug: string; name: string; author: string; chapterLatest: string; url: string; thumb: string }): void {
	localStorage.setItem(`mangabet:manga:${manga.slug}`, JSON.stringify(manga));
}

// --- MAL mapping overrides (user corrections when the crowd-sourced mapping is wrong) ---
import type { MalOverride } from '$lib/types';

const malOverrideKey = (slug: string) => `mangabet:malOverride:${slug}`;

export function getMalOverride(slug: string): MalOverride | null {
	try {
		const raw = localStorage.getItem(malOverrideKey(slug));
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		// Explicit "no MAL entry" — user cleared a wrong auto-match.
		if (parsed?.malId === null) return { malId: null, title: null };
		return Number.isInteger(parsed?.malId) && parsed.malId > 0
			? { malId: parsed.malId, title: parsed.title ?? null }
			: null;
	} catch {
		return null;
	}
}

export function setMalOverride(slug: string, override: MalOverride): void {
	localStorage.setItem(malOverrideKey(slug), JSON.stringify(override));
}

export function clearMalOverride(slug: string): void {
	localStorage.removeItem(malOverrideKey(slug));
}

// Auto-resolved slug→malId pairs, cached so repeat syncs skip the rate-limited
// mapping API. Unlike overrides these are untrusted: server-side sanity checks
// (e.g. the suspect-oneshot guard) still apply to them.
const MAL_ID_CACHE_KEY = 'mangabet:malIdCache';

export function getCachedMalId(slug: string): number | null {
	try {
		const cache = JSON.parse(localStorage.getItem(MAL_ID_CACHE_KEY) ?? '{}');
		const id = cache[slug];
		return Number.isInteger(id) && id > 0 ? id : null;
	} catch {
		return null;
	}
}

export function cacheMalId(slug: string, malId: number): void {
	try {
		const cache = JSON.parse(localStorage.getItem(MAL_ID_CACHE_KEY) ?? '{}');
		cache[slug] = malId;
		localStorage.setItem(MAL_ID_CACHE_KEY, JSON.stringify(cache));
	} catch {
		// best-effort cache — ignore quota/parse failures
	}
}

const READER_INDEX_KEY = 'mangabet:reader:index';

export function getReaderIndex(): Record<string, number> {
	try {
		return JSON.parse(localStorage.getItem(READER_INDEX_KEY) ?? '{}');
	} catch {
		return {};
	}
}

export function touchReaderIndex(slug: string): void {
	const idx = getReaderIndex();
	idx[slug] = Date.now();
	localStorage.setItem(READER_INDEX_KEY, JSON.stringify(idx));
}

export function removeFromReaderIndex(slug: string): void {
	const idx = getReaderIndex();
	delete idx[slug];
	localStorage.setItem(READER_INDEX_KEY, JSON.stringify(idx));
}
