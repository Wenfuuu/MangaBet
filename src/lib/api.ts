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
	captcha: () => `${API_BASE_URL}/captcha`,
	login: () => `${API_BASE_URL}/login`,
	userChangesInfo: () => `${API_BASE_URL}/user_changes_info`,
	bookmark: (page = 1) => `${API_BASE_URL}/bookmark${page > 1 ? `?page=${page}` : ''}`,
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
