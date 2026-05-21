import type { UserProfile } from '$lib/types';
import { ENDPOINTS, API_BASE_HEADERS } from '$lib/api';

function withCookie(cookieHeader?: string): HeadersInit {
	return cookieHeader ? { ...API_BASE_HEADERS, Cookie: cookieHeader } : API_BASE_HEADERS;
}

function decodeHtmlEntities(s: string): string {
	return s
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'");
}

function extractInputValue(html: string, name: string): string {
	const tagRe = new RegExp(`<input\\b[^>]*\\bname="${name}"[^>]*>`, 'i');
	const tag = html.match(tagRe)?.[0];
	if (!tag) return '';
	const val = tag.match(/\bvalue="([^"]*)"/);
	return val ? decodeHtmlEntities(val[1]) : '';
}

function extractTextarea(html: string, name: string): string {
	const re = new RegExp(`<textarea\\b[^>]*\\bname="${name}"[^>]*>([\\s\\S]*?)</textarea>`, 'i');
	const match = html.match(re);
	return match ? decodeHtmlEntities(match[1].trim()) : '';
}

export async function getUserProfile(cookieHeader?: string): Promise<UserProfile> {
	const res = await fetch(ENDPOINTS.userChangesInfo(), { headers: withCookie(cookieHeader) });
	if (!res.ok) throw new Error(`User profile fetch failed: ${res.status}`);
	const html = await res.text();

	return {
		username: extractInputValue(html, 'username'),
		displayname: extractInputValue(html, 'displayname'),
		email: extractInputValue(html, 'email'),
		phone: extractInputValue(html, 'phone'),
		description: extractTextarea(html, 'description'),
	};
}
