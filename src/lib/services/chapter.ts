import type { Chapter } from '$lib/types';
import { generateChapters } from '$lib/data';

// TODO: replace with real API calls using ENDPOINTS from $lib/api

export async function getChapters(_mangaId: string, totalChapters: number): Promise<Chapter[]> {
	return generateChapters(totalChapters);
}

export async function getPages(_mangaId: string, _chapter: number): Promise<string[]> {
	// TODO: return ordered array of image URLs from API
	return [];
}
