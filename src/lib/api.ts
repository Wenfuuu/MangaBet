export const API_BASE_URL = import.meta.env.VITE_API_URL;

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
} as const;

export const proxyImage = (thumb: string) => `/api/image?url=${encodeURIComponent(thumb)}`;

export function mangaDetailUrl(manga: { id: number; slug: string }): string {
	return `/manga/${manga.slug}/${manga.id}`;
}

export function saveMangaDTO(manga: { id: number; slug: string; name: string; author: string; chapterLatest: string; url: string; thumb: string }): void {
	localStorage.setItem(`mangabet:manga:${manga.slug}`, JSON.stringify(manga));
}
