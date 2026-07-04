export interface MalTokenResponse {
	token_type: string;
	expires_in: number;
	access_token: string;
	refresh_token: string;
}

/** Response from api.malsync.moe /page/MangaNato/{slug} */
export interface MalSyncPageMapping {
	identifier: string;
	malId: number | null;
	aniId: number | null;
	page: string;
	title: string;
	type: string;
	url: string;
	malUrl: string;
	aniUrl: string;
}

export type MalReadStatus = 'reading' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_read';

export interface MalListStatus {
	status?: MalReadStatus;
	num_chapters_read?: number;
	num_volumes_read?: number;
	score?: number;
	is_rereading?: boolean;
}

/** Subset of GET /v2/manga/{id}?fields=my_list_status,num_chapters */
export interface MalMangaStatus {
	id: number;
	title: string;
	num_chapters: number;
	my_list_status?: MalListStatus;
}

export interface MalSyncResult {
	synced: boolean;
	reason?: 'unmapped';
	unchanged?: boolean;
	progress?: number;
	malId?: number;
}
