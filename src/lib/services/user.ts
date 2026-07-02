import type { UserProfile } from '$lib/types';
import { ENDPOINTS } from '$lib/api';
import { decodeHtmlEntities } from './htmlEntities';
import { withUpstreamAuth } from './upstreamHeaders';
import { fetchWithRetry } from './fetchRetry';
import { ensureOk } from './errors';

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
	const res = await fetchWithRetry(ENDPOINTS.userChangesInfo(), { headers: withUpstreamAuth(cookieHeader) });
	ensureOk(res, 'User profile fetch');
	const html = await res.text();

	return {
		username: extractInputValue(html, 'username'),
		displayname: extractInputValue(html, 'displayname'),
		email: extractInputValue(html, 'email'),
		phone: extractInputValue(html, 'phone'),
		description: extractTextarea(html, 'description'),
	};
}
