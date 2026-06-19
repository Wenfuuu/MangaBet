import type { MangaSearchDTO, MangaDetailDTO, MangaListItemDTO, MangaListPage } from '$lib/types';
import { ENDPOINTS } from '$lib/api';
import { decodeHtmlEntities } from './htmlEntities';
import { withUpstreamAuth } from './upstreamHeaders';
import { RateLimitError } from './errors';

export async function searchManga(query: string, page = 1, cookieHeader?: string): Promise<MangaSearchDTO[]> {
	if (!query.trim()) return [];
	const res = await fetch(ENDPOINTS.search(query, page), { headers: withUpstreamAuth(cookieHeader) });
	if (res.status === 429) throw new RateLimitError();
	if (!res.ok) throw new Error(`Search failed: ${res.status}`);
	return res.json();
}

function parseListItem(block: string): MangaListItemDTO | null {
	const idMatch = block.match(/data-id="(\d+)"/);
	if (!idMatch) return null;
	const id = parseInt(idMatch[1], 10);

	// Cover <a> href ends at the slug (next char is the closing quote, not a "/").
	const slugMatch = block.match(/\/manga\/([^/"]+)"/);
	if (!slugMatch) return null;
	const slug = slugMatch[1];

	const thumbMatch = block.match(/<img[^>]*data-src="([^"]+)"/);
	const thumb = thumbMatch ? thumbMatch[1] : '';

	const titleMatch = block.match(/<h3>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/);
	const name = titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : slug;

	const chapterMatch = block.match(
		/<a class="list-story-item-wrap-chapter"[^>]*title="([^"]*)"[^>]*href="([^"]+)"/,
	);
	const chapterLatest = chapterMatch ? decodeHtmlEntities(chapterMatch[1].trim()) : '';
	const chapterSlug = chapterMatch ? (chapterMatch[2].split('/').pop() ?? '') : '';

	return { id, slug, name, thumb, chapterLatest, chapterSlug };
}

export async function getLatestManga(page = 1, cookieHeader?: string): Promise<MangaListPage> {
	const res = await fetch(ENDPOINTS.latestManga(page), { headers: withUpstreamAuth(cookieHeader) });
	if (res.status === 429) throw new RateLimitError();
	if (!res.ok) throw new Error(`Latest manga fetch failed: ${res.status}`);
	const html = await res.text();

	const items: MangaListItemDTO[] = [];
	const chunks = html.split(/<div class="list-comic-item-wrap">/);
	for (let i = 1; i < chunks.length; i++) {
		const item = parseListItem(chunks[i]);
		if (item) items.push(item);
	}

	const lastPageMatch = html.match(/page_last"[^>]*>Last\((\d+)\)/i);
	const totalPages = lastPageMatch ? parseInt(lastPageMatch[1], 10) : 1;

	const totalMatch = html.match(/Total:\s*([\d,]+)\s*stories/i);
	const totalStories = totalMatch ? parseInt(totalMatch[1].replace(/,/g, ''), 10) : items.length;

	return { items, page, totalPages, totalStories };
}

export async function getMangaDetail(slug: string, cookieHeader?: string): Promise<MangaDetailDTO> {
	const res = await fetch(ENDPOINTS.mangaDetail(slug), { headers: withUpstreamAuth(cookieHeader) });
	if (res.status === 429) throw new RateLimitError();
	if (!res.ok) throw new Error(`Manga detail fetch failed: ${res.status}`);
	const html = await res.text();

	const nameMatch = html.match(/<div class="manga-info-content"[\s\S]*?<h1>([\s\S]*?)<\/h1>/);
	const name = nameMatch ? decodeHtmlEntities(nameMatch[1].trim()) : slug;

	const authorMatch = html.match(/Author\(s\)\s*:\s*([^\n<]+)/);
	const author = authorMatch ? decodeHtmlEntities(authorMatch[1].trim()) : 'Unknown';

	const statusMatch = html.match(/Status\s*:\s*([^\n<]+)/);
	const status = statusMatch ? decodeHtmlEntities(statusMatch[1].trim()) : '';

	const genresBlock = html.match(/<li class="genres">([\s\S]*?)<\/li>/);
	const genreMatches = genresBlock
		? [...genresBlock[1].matchAll(/>\s*([^<\n]+?)\s*<\/a>/g)]
		: [];
	const genres = genreMatches.map((m) => decodeHtmlEntities(m[1].trim())).filter(Boolean);

	const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
	let thumb = '';
	let rating = 0;
	if (jsonLdMatch) {
		try {
			const ld = JSON.parse(jsonLdMatch[1]);
			thumb = ld.itemReviewed?.image ?? '';
			rating = parseFloat(ld.ratingValue ?? '0');
		} catch {}
	}

	const viewsMatch = html.match(/View\s*:\s*([\d,]+)/);
	const views = viewsMatch ? parseInt(viewsMatch[1].replace(/,/g, ''), 10) : 0;

	const updatedMatch = html.match(/Last updated\s*:\s*([^\n<]+)/);
	let lastUpdated = new Date();
	if (updatedMatch) {
		const parsed = new Date(updatedMatch[1].trim().replace(/-/g, ' '));
		if (!isNaN(parsed.getTime())) lastUpdated = parsed;
	}

	return { name, author, status, genres, thumb, rating, views, lastUpdated };
}
