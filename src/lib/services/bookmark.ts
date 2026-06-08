import type { BookmarkItem, BookmarkPage, BookmarkChapterRef } from '$lib/types';
import { ENDPOINTS } from '$lib/api';
import { decodeHtmlEntities } from './htmlEntities';
import { withUpstreamAuth } from './upstreamHeaders';
import { RateLimitError } from './errors';

function parseChapterRef(block: string, label: 'Viewed' | 'Current'): BookmarkChapterRef | null {
	const re = new RegExp(`${label}\\s*:[\\s\\S]*?href="([^"]*\\/chapter-([^"\\/]+))"[\\s\\S]*?Chapter\\s+(\\d+(?:\\.\\d+)?)`, 'i');
	const m = block.match(re);
	if (!m) return null;
	return { number: parseFloat(m[3]), slug: m[2] };
}

function parseItem(block: string): BookmarkItem | null {
	const idMatch = block.match(/bm-it-(\d+)/);
	if (!idMatch) return null;
	const mangaId = parseInt(idMatch[1], 10);

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
		mangaId,
		mangaSlug,
		title,
		thumb,
		viewedChapter: parseChapterRef(block, 'Viewed'),
		currentChapter: parseChapterRef(block, 'Current'),
		lastUpdated,
	};
}

export async function getBookmarkStatus(id: string | number, cookieHeader?: string): Promise<boolean> {
	const headers = withUpstreamAuth(cookieHeader);
	// console.log('[getBookmarkStatus] request headers:', headers);
	const res = await fetch(ENDPOINTS.mangaStatus(id), { headers });
	if (!res.ok) throw new Error(`Bookmark status fetch failed: ${res.status}`);
	const json = (await res.json()) as { success?: boolean; data?: { isBookmarked?: number } };
	// console.log('[getBookmarkStatus]', id, 'isBookmarked=',
	// json?.data?.isBookmarked, 'cache?', res.headers.get('cf-cache-status'),
	// res.headers.get('age'));
	return json?.data?.isBookmarked === 1;
}

export async function setBookmark(id: string | number, action: 'add' | 'remove', cookieHeader?: string): Promise<void> {
	const res = await fetch(ENDPOINTS.bookmarkAction(id, action), { headers: withUpstreamAuth(cookieHeader) });
	if (!res.ok) throw new Error(`Bookmark ${action} failed: ${res.status}`);
}

export async function findBookmarkProgress(
	mangaId: string | number,
	cookieHeader?: string,
): Promise<BookmarkChapterRef | null> {
	const id = Number(mangaId);
	const first = await getBookmarks(1, cookieHeader);
	const hit = first.items.find((it) => it.mangaId === id);
	if (hit) return hit.viewedChapter;

	for (let page = 2; page <= first.totalPages; page++) {
		const next = await getBookmarks(page, cookieHeader);
		const m = next.items.find((it) => it.mangaId === id);
		if (m) return m.viewedChapter;
	}
	return null;
}

export async function getBookmarks(page = 1, cookieHeader?: string): Promise<BookmarkPage> {
	const res = await fetch(ENDPOINTS.bookmark(page), { headers: withUpstreamAuth(cookieHeader) });
	if (res.status === 429) throw new RateLimitError();
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
