export interface Chapter {
	number: number;
	title: string;
	pages?: number;
	date: Date;
	isNew: boolean;
}

export interface ChapterDTO {
	chapter_name: string;
	chapter_slug: string;
	chapter_num: number;
	updated_at: string;
	view: number;
}

export interface ChaptersResponse {
	success: boolean;
	data: {
		chapters: ChapterDTO[];
		pagination: {
			total: number;
			limit: number;
			offset: number;
			has_more: boolean;
		};
	};
}
