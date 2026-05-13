export const MANGABATS_BASE = 'https://www.mangabats.com';

export const MANGABATS_HEADERS = {
	Referer: MANGABATS_BASE,
	'X-Requested-With': 'XMLHttpRequest',
} as const;

export const MANGABATS_IMAGE_HEADERS = {
	Referer: MANGABATS_BASE,
} as const;

export const ENDPOINTS = {
	search: (q: string, page = 1) => `${MANGABATS_BASE}/home/search/json?searchword=${encodeURIComponent(q)}&page=${page}`,
	chapters: (slug: string) => `${MANGABATS_BASE}/api/manga/${slug}/chapters`,
	chapterPage: (mangaSlug: string, chapterSlug: string) => `${MANGABATS_BASE}/manga/${mangaSlug}/${chapterSlug}`,
	mangaDetail: (slug: string) => `${MANGABATS_BASE}/manga/${slug}`,
} as const;

export const proxyImage = (thumb: string) => `/api/image?url=${encodeURIComponent(thumb)}`;

export function mangaDetailUrl(manga: { id: number; slug: string }): string {
	return `/manga/${manga.slug}/${manga.id}`;
}

export function saveMangaDTO(manga: { id: number; slug: string; name: string; author: string; chapterLatest: string; url: string; thumb: string }): void {
	localStorage.setItem(`mangabet:manga:${manga.slug}`, JSON.stringify(manga));
}
