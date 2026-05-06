export const MANGABATS_BASE = 'https://www.mangabats.com';

export const MANGABATS_HEADERS = {
	Referer: MANGABATS_BASE,
	'X-Requested-With': 'XMLHttpRequest',
} as const;

export const MANGABATS_IMAGE_HEADERS = {
	Referer: MANGABATS_BASE,
} as const;

export const ENDPOINTS = {
	search: (q: string) => `${MANGABATS_BASE}/home/search/json?searchword=${encodeURIComponent(q)}`,
} as const;

export const proxyImage = (thumb: string) => `/api/image?url=${encodeURIComponent(thumb)}`;
