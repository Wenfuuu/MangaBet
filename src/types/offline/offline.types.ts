export interface SavedChapter {
	key: string;
	mangaSlug: string;
	mangaId: string;
	mangaName: string;
	chapterSlug: string;
	chapterNumber: number;
	chapterTitle: string;
	pageCount: number;
	bytes: number;
	savedAt: number;
	// Every same-origin URL cached for this chapter — the only way to know what to
	// evict when it is removed, since cache entries carry no chapter identity.
	urls: string[];
}

export interface SaveChapterInput {
	mangaSlug: string;
	mangaId: string;
	mangaName: string;
	chapterSlug: string;
	chapterNumber: number;
	chapterTitle: string;
	imageUrls?: string[];
}

export interface SaveProgress {
	done: number;
	total: number;
}

export interface ChapterPagesResponse {
	pages: string[];
	mangaName: string;
	chapterTitle: string;
}
