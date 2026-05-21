export interface BookmarkChapterRef {
	number: number;
	slug: string;
}

export interface BookmarkItem {
	mangaId: number;
	mangaSlug: string;
	title: string;
	thumb: string;
	viewedChapter: BookmarkChapterRef | null;
	currentChapter: BookmarkChapterRef | null;
	lastUpdated: string;
}

export interface BookmarkPage {
	items: BookmarkItem[];
	page: number;
	totalPages: number;
	totalStories: number;
}
