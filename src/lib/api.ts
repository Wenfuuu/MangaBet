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
} as const;

export const proxyImage = (thumb: string) => `/api/image?url=${encodeURIComponent(thumb)}`;

export function mangaDetailUrl(manga: { id: number; slug: string; name: string; author: string; thumb: string }): string {
	const p = new URLSearchParams({
		id: String(manga.id),
		name: manga.name,
		author: manga.author,
		thumb: manga.thumb,
	});
	return `/manga/${manga.slug}?${p}`;
}

export function saveMangaDTO(manga: { id: number; slug: string; name: string; author: string; chapterLatest: string; url: string; thumb: string }): void {
	localStorage.setItem(`mangabet:manga:${manga.slug}`, JSON.stringify(manga));
}
