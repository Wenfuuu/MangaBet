export const MANGABATS_BASE = 'https://www.mangabats.com';

// Headers required by mangabats.com for JSON endpoints
export const MANGABATS_HEADERS = {
	Referer: MANGABATS_BASE,
	'X-Requested-With': 'XMLHttpRequest',
} as const;

export const ENDPOINTS = {
	search: (q: string) => `${MANGABATS_BASE}/home/search/json?searchword=${encodeURIComponent(q)}`,
} as const;
