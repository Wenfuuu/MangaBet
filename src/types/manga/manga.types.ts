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
