import type { Manga } from '$lib/types';
import { MANGA_LIBRARY } from '$lib/data';

// TODO: replace with real API calls using ENDPOINTS from $lib/api

export async function searchManga(query: string): Promise<Manga[]> {
	if (!query.trim()) return MANGA_LIBRARY;
	const q = query.toLowerCase();
	return MANGA_LIBRARY.filter(
		(m) =>
			m.title.toLowerCase().includes(q) ||
			m.author.toLowerCase().includes(q) ||
			m.genres.some((g) => g.toLowerCase().includes(q))
	);
}

export async function getManga(id: string): Promise<Manga | null> {
	return MANGA_LIBRARY.find((m) => m.id === id) ?? null;
}
