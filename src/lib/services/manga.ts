import type { MangaSearchDTO, MangaDetailDTO } from '$lib/types';
import { ENDPOINTS } from '$lib/api';
import { decodeHtmlEntities } from './htmlEntities';
import { withUpstreamAuth } from './upstreamHeaders';

export async function searchManga(query: string, page = 1, cookieHeader?: string): Promise<MangaSearchDTO[]> {
	if (!query.trim()) return [];
	const res = await fetch(ENDPOINTS.search(query, page), { headers: withUpstreamAuth(cookieHeader) });
	if (!res.ok) throw new Error(`Search failed: ${res.status}`);
	return res.json();
}

export async function getMangaDetail(slug: string, cookieHeader?: string): Promise<MangaDetailDTO> {
	const res = await fetch(ENDPOINTS.mangaDetail(slug), { headers: withUpstreamAuth(cookieHeader) });
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
