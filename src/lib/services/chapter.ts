import type { Chapter, ChapterDTO, ChaptersResponse } from '$lib/types';
import { ENDPOINTS } from '$lib/api';
import { withUpstreamAuth } from './upstreamHeaders';
import { fetchWithRetry } from './fetchRetry';
import { decodeHtmlEntities } from './htmlEntities';
import { ensureOk } from './errors';

const NEW_THRESHOLD_MS = 14 * 24 * 60 * 60 * 1000;

function toChapter(dto: ChapterDTO): Chapter {
	const date = new Date(dto.updated_at);
	return {
		number: dto.chapter_num,
		slug: dto.chapter_slug.replace(/^chapter-/, ''),
		title: dto.chapter_name,
		date,
		isNew: Date.now() - date.getTime() < NEW_THRESHOLD_MS,
	};
}

export async function getChapters(slug: string, cookieHeader?: string): Promise<Chapter[]> {
	const LIMIT = 50;
	const fetchPage = (offset: number) =>
		fetchWithRetry(ENDPOINTS.chapters(slug, offset, LIMIT), {
			headers: withUpstreamAuth(cookieHeader),
			cache: 'no-store',
		});

	const first = await fetchPage(0);
	ensureOk(first, 'Chapters fetch');
	const firstJson: ChaptersResponse = await first.json();

	const { total } = firstJson.data.pagination;
	const chapters = firstJson.data.chapters.map(toChapter);

	if (total > LIMIT) {
		const offsets = Array.from(
			{ length: Math.ceil((total - LIMIT) / LIMIT) },
			(_, i) => (i + 1) * LIMIT
		);

		const rest = await Promise.all(
			offsets.map((offset) =>
				fetchPage(offset)
					.then((r) => ensureOk(r, 'Chapters fetch').json() as Promise<ChaptersResponse>)
					.then((json) => json.data.chapters.map(toChapter))
			)
		);
		chapters.push(...rest.flat());
	}

	return [...new Map(chapters.map((c) => [c.slug, c])).values()];
}

export interface ChapterPageData {
	images: string[];
	mangaName: string;
	chapterTitle: string;
	chapterId: number | null;
}

export async function getPages(mangaSlug: string, chapterSlug: string, cookieHeader?: string): Promise<ChapterPageData> {
	const res = await fetchWithRetry(ENDPOINTS.chapterPage(mangaSlug, `chapter-${chapterSlug}`), { headers: withUpstreamAuth(cookieHeader) });
	ensureOk(res, 'Chapter page fetch');
	const html = await res.text();

	const headMatch = html.match(/<head[\s\S]*?<\/head>/i);
	if (!headMatch) throw new Error('No <head> found in chapter page');
	const head = headMatch[0];

	const cdnsMatch = head.match(/var cdns\s*=\s*(\[[\s\S]*?\]);/);
	const cdnBase: string = cdnsMatch
		? (JSON.parse(cdnsMatch[1]) as string[])[0]
		: 'https://img-r1.2xstorage.com/';

	const imagesMatch = head.match(/var chapterImages\s*=\s*(\[[\s\S]*?\]);/);
	if (!imagesMatch) throw new Error('chapterImages not found in chapter page');
	const images: string[] = JSON.parse(imagesMatch[1]);

	const comicNameMatch = head.match(/var comic_name\s*=\s*"([^"]+)"/);
	const chapterNameMatch = head.match(/var chapter_name\s*=\s*"([^"]+)"/);

	const chapterIdMatch = html.match(/const\s+chapterId\s*=\s*(\d+)/);
	const chapterId = chapterIdMatch ? parseInt(chapterIdMatch[1], 10) : null;

	const base = cdnBase.replace(/\/+$/, '') + '/';
	return {
		images: images.map((img) => base + img.replace(/^\/+/, '')),
		mangaName: comicNameMatch ? decodeHtmlEntities(comicNameMatch[1]) : mangaSlug,
		chapterTitle: chapterNameMatch ? decodeHtmlEntities(chapterNameMatch[1]) : `Chapter ${chapterSlug}`,
		chapterId,
	};
}
