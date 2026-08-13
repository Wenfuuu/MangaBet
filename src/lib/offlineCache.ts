// Shared by the app and the service worker — keep it dependency-free so importing
// it into the worker bundle does not drag in browser-only or env-dependent code.

export const OFFLINE_CACHE = 'mangabet-offline';

export const offlineKey = (mangaSlug: string, mangaId: string, chapterSlug: string) =>
	`${mangaSlug}/${mangaId}/${chapterSlug}`;

export const offlineChapterPath = (mangaSlug: string, mangaId: string, chapterSlug: string) =>
	`/manga/${mangaSlug}/${mangaId}/chapter/${chapterSlug}`;

// The reader appends a cache-busting `r` param when retrying a broken image, so a
// saved page would miss on lookup. Both sides normalise to the same canonical URL.
export function canonicalImageUrl(rawUrl: string): string {
	const url = new URL(rawUrl, 'http://x');
	url.searchParams.delete('r');
	return url.pathname + url.search;
}
