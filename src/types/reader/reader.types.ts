import type { Manga } from '../manga/manga.types';

export type ReaderMode = 'single' | 'double' | 'long' | 'wide';

export interface ContinueItem {
	manga: Manga;
	chapter: number;
	page: number;
}
