import type { Chapter, ChapterDTO, ChaptersResponse } from '$lib/types';
import { ENDPOINTS, MANGABATS_HEADERS } from '$lib/api';

const NEW_THRESHOLD_MS = 14 * 24 * 60 * 60 * 1000;

function toChapter(dto: ChapterDTO): Chapter {
	const date = new Date(dto.updated_at);
	return {
		number: dto.chapter_num,
		title: dto.chapter_name,
		date,
		isNew: Date.now() - date.getTime() < NEW_THRESHOLD_MS,
	};
}

export async function getChapters(slug: string): Promise<Chapter[]> {
	const res = await fetch(ENDPOINTS.chapters(slug), { headers: MANGABATS_HEADERS });
	if (!res.ok) throw new Error(`Chapters fetch failed: ${res.status}`);
	const json: ChaptersResponse = await res.json();
	return json.data.chapters.map(toChapter);
}

export interface ChapterPageData {
	images: string[];
	mangaName: string;
	chapterTitle: string;
}

export async function getPages(mangaSlug: string, chapterNum: number): Promise<ChapterPageData> {
	const chapterSlug = `chapter-${chapterNum}`;
	const res = await fetch(ENDPOINTS.chapterPage(mangaSlug, chapterSlug), { headers: MANGABATS_HEADERS });
	if (!res.ok) throw new Error(`Chapter page fetch failed: ${res.status}`);
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

	return {
		images: images.map((img) => cdnBase + img),
		mangaName: comicNameMatch ? comicNameMatch[1] : mangaSlug,
		chapterTitle: chapterNameMatch ? chapterNameMatch[1] : `Chapter ${chapterNum}`,
	};
}
