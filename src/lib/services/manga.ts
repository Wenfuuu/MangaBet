import type { MangaSearchDTO, MangaDetailDTO, MangaListItemDTO, MangaListPage } from '$lib/types';
import { ENDPOINTS } from '$lib/api';
import { decodeHtmlEntities } from './htmlEntities';
import { withUpstreamAuth } from './upstreamHeaders';
import { fetchWithRetry } from './fetchRetry';
import { ensureOk } from './errors';

export async function searchManga(query: string, page = 1, cookieHeader?: string): Promise<MangaSearchDTO[]> {
	if (!query.trim()) return [];
	const res = await fetchWithRetry(ENDPOINTS.search(query, page), { headers: withUpstreamAuth(cookieHeader) });
	ensureOk(res, 'Search');
	return res.json();
}

// The home page carries the 20 "popular" titles in a carousel, but those blocks
// lack a numeric id. The "latest updates" grid lower on the same page (the
// `itemupdate` blocks) does expose `data-id`, and its slugs overlap the popular
// set, so we build a slug→id map from it and enrich the carousel items. A slug
// absent from the grid falls back to id 0 (the detail route loads it by slug).
function buildSlugIdMap(html: string): Map<string, number> {
	const map = new Map<string, number>();
	const start = html.indexOf('class="itemupdate');
	if (start < 0) return map;
	const blocks = html.slice(start).split(/<div class="itemupdate/);
	for (const block of blocks) {
		const idMatch = block.match(/data-id="(\d+)"/);
		const slugMatch = block.match(/\/manga\/([^/"]+)"/);
		if (idMatch && slugMatch && !map.has(slugMatch[1])) {
			map.set(slugMatch[1], parseInt(idMatch[1], 10));
		}
	}
	return map;
}

function parsePopularItem(block: string, slugToId: Map<string, number>): MangaSearchDTO | null {
	// Manga link: href ends at the slug (next char is the closing quote, not "/").
	const slugMatch = block.match(/\/manga\/([^/"]+)"\s+title="([^"]*)"/);
	if (!slugMatch) return null;
	const slug = slugMatch[1];
	const name = decodeHtmlEntities(slugMatch[2].trim());

	const thumbMatch = block.match(/<img[^>]*\ssrc="([^"]+)"/);
	const thumb = thumbMatch ? thumbMatch[1] : '';

	// Chapter link: href continues past the slug with a further path segment.
	const chapterMatch = block.match(/\/manga\/[^/"]+\/[^"]+"\s+title="([^"]*)"/);
	const chapterLatest = chapterMatch ? decodeHtmlEntities(chapterMatch[1].trim()) : '';

	return {
		id: slugToId.get(slug) ?? 0,
		author: '',
		name,
		chapterLatest,
		url: ENDPOINTS.mangaDetail(slug),
		thumb,
		slug,
	};
}

export async function getPopularManga(cookieHeader?: string): Promise<MangaSearchDTO[]> {
	const res = await fetchWithRetry(ENDPOINTS.home(), { headers: withUpstreamAuth(cookieHeader) });
	ensureOk(res, 'Popular manga fetch');
	const html = await res.text();

	const slugToId = buildSlugIdMap(html);

	const start = html.indexOf('popular-carousel-wrap');
	if (start < 0) {
		console.warn('[manga] getPopularManga: popular-carousel-wrap not found — upstream markup may have changed');
		return [];
	}
	const chunks = html.slice(start).split(/<div class="item">/);

	const items: MangaSearchDTO[] = [];
	let unparsed = 0;
	for (let i = 1; i < chunks.length && items.length < 20; i++) {
		const item = parsePopularItem(chunks[i], slugToId);
		if (item) items.push(item);
		else unparsed++;
	}
	if (unparsed > 0) {
		console.warn(`[manga] getPopularManga: ${unparsed} carousel items failed to parse — upstream markup may have changed`);
	}

	return items;
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
	const res = await fetchWithRetry(ENDPOINTS.latestManga(page), { headers: withUpstreamAuth(cookieHeader) });
	ensureOk(res, 'Latest manga fetch');
	const html = await res.text();

	const items: MangaListItemDTO[] = [];
	const chunks = html.split(/<div class="list-comic-item-wrap">/);
	let unparsed = 0;
	for (let i = 1; i < chunks.length; i++) {
		const item = parseListItem(chunks[i]);
		if (item) items.push(item);
		else unparsed++;
	}
	if (unparsed > 0) {
		console.warn(`[manga] getLatestManga: ${unparsed}/${chunks.length - 1} list items failed to parse — upstream markup may have changed`);
	}

	const lastPageMatch = html.match(/page_last"[^>]*>Last\((\d+)\)/i);
	const totalPages = lastPageMatch ? parseInt(lastPageMatch[1], 10) : 1;

	const totalMatch = html.match(/Total:\s*([\d,]+)\s*stories/i);
	const totalStories = totalMatch ? parseInt(totalMatch[1].replace(/,/g, ''), 10) : items.length;

	return { items, page, totalPages, totalStories };
}

export async function getMangaDetail(slug: string, cookieHeader?: string): Promise<MangaDetailDTO> {
	const res = await fetchWithRetry(ENDPOINTS.mangaDetail(slug), { headers: withUpstreamAuth(cookieHeader) });
	ensureOk(res, 'Manga detail fetch');
	const html = await res.text();

	const nameMatch = html.match(/<div class="manga-info-content"[\s\S]*?<h1>([\s\S]*?)<\/h1>/);
	if (!nameMatch) {
		console.warn(`[manga] getMangaDetail(${slug}): title not found — upstream markup may have changed`);
	}
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
		} catch {
			console.warn(`[manga] getMangaDetail(${slug}): JSON-LD block failed to parse`);
		}
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
