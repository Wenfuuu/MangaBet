import type { MangaSearchDTO } from '../manga/manga.types';

export type ReaderMode = 'single' | 'double' | 'long' | 'wide';

export interface ContinueItem {
	manga: MangaSearchDTO;
	chapterSlug: string;
}
