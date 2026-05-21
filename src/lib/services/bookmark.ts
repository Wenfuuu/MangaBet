import type { BookmarkItem, BookmarkPage, BookmarkChapterRef } from '$lib/types';
import { ENDPOINTS, API_BASE_HEADERS } from '$lib/api';
import { decodeHtmlEntities } from './htmlEntities';

function withCookie(cookieHeader?: string): HeadersInit {
	return cookieHeader ? { ...API_BASE_HEADERS, Cookie: cookieHeader } : API_BASE_HEADERS;
}

function parseChapterRef(block: string, label: 'Viewed' | 'Current'): BookmarkChapterRef | null {
	const re = new RegExp(`${label}\\s*:[\\s\\S]*?href="([^"]*\\/chapter-([^"\\/]+))"[\\s\\S]*?Chapter\\s+(\\d+(?:\\.\\d+)?)`, 'i');
	const m = block.match(re);
	if (!m) return null;
	return { number: parseFloat(m[3]), slug: m[2] };
}

function parseItem(block: string): BookmarkItem | null {
	const bmIdMatch = block.match(/bm-it-(\d+)/);
	if (!bmIdMatch) return null;
	const bookmarkId = parseInt(bmIdMatch[1], 10);

	const slugMatch = block.match(/\/manga\/([^/"\s]+)"/);
	if (!slugMatch) return null;
	const mangaSlug = slugMatch[1];

	const thumbMatch = block.match(/<img[^>]*src="([^"]+)"/);
	const thumb = thumbMatch ? thumbMatch[1] : '';

	const titleMatch = block.match(/<span class="bm-title">[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/);
	const title = titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : mangaSlug;

	const lastUpdatedMatch = block.match(/Last updated\s*:\s*([^<]+?)\s*<\/span>/i);
	const lastUpdated = lastUpdatedMatch ? decodeHtmlEntities(lastUpdatedMatch[1].trim()) : '';

	return {
		bookmarkId,
		mangaSlug,
		title,
		thumb,
		viewedChapter: parseChapterRef(block, 'Viewed'),
		currentChapter: parseChapterRef(block, 'Current'),
		lastUpdated,
	};
}

export async function getBookmarks(page = 1, cookieHeader?: string): Promise<BookmarkPage> {
	const res = await fetch(ENDPOINTS.bookmark(page), { headers: withCookie(cookieHeader) });
	if (!res.ok) throw new Error(`Bookmark fetch failed: ${res.status}`);
	const html = await res.text();

	const items: BookmarkItem[] = [];
	const chunks = html.split(/<div class="user-bookmark-item bm-it-/);
	for (let i = 1; i < chunks.length; i++) {
		const item = parseItem('<div class="user-bookmark-item bm-it-' + chunks[i]);
		if (item) items.push(item);
	}

	const totalPagesMatch = html.match(/class="go-p-end[^"]*"[^>]*>Last\((\d+)\)/i);
	const totalPages = totalPagesMatch ? parseInt(totalPagesMatch[1], 10) : 1;

	const totalMatch = html.match(/Total:\s*(\d+)\s*stories/i);
	const totalStories = totalMatch ? parseInt(totalMatch[1], 10) : items.length;

	return { items, page, totalPages, totalStories };
}
