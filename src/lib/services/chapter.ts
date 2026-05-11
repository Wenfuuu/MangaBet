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

export async function getPages(_mangaId: string, _chapter: number): Promise<string[]> {
	// TODO: return ordered array of image URLs from API
	return [];
}
