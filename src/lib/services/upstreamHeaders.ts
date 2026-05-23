import { API_BASE_HEADERS } from '$lib/api';

export function withUpstreamAuth(cookieHeader?: string): HeadersInit {
	if (!cookieHeader) return API_BASE_HEADERS;
	const headers: Record<string, string> = { ...API_BASE_HEADERS, Cookie: cookieHeader };
	const tokenMatch = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
	if (tokenMatch) headers.Authorization = `Bearer ${decodeURIComponent(tokenMatch[1])}`;
	return headers;
}
