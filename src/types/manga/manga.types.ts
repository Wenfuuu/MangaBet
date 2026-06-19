export interface Manga {
	id: string;
	title: string;
	author: string;
	year: number;
	status: 'Ongoing' | 'Completed';
	genres: string[];
	rating: number;
	chapters: number;
	summary?: string;
	cover: number;
	mood: string;
}

export interface MangaSearchDTO {
	id: number;
	author: string;
	name: string;
	chapterLatest: string;
	url: string;
	thumb: string;
	slug: string;
}

export interface MangaListItemDTO {
	id: number;
	slug: string;
	name: string;
	thumb: string;
	chapterLatest: string;
	chapterSlug: string;
}

export interface MangaDetailDTO {
	name: string;
	author: string;
	status: string;
	genres: string[];
	thumb: string;
	rating: number;
	views: number;
	lastUpdated: Date;
}
