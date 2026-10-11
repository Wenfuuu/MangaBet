import type { MangaPreviewDTO } from '$lib/types';

const cache = new Map<string, Promise<MangaPreviewDTO>>();

export function loadMangaPreview(slug: string): Promise<MangaPreviewDTO> {
	const cached = cache.get(slug);
	if (cached) return cached;

	const pending = fetch(`/api/manga/${encodeURIComponent(slug)}/preview`).then((res) => {
		if (!res.ok) throw new Error(`preview failed: ${res.status}`);
		return res.json() as Promise<MangaPreviewDTO>;
	});
	pending.catch(() => cache.delete(slug));
	cache.set(slug, pending);
	return pending;
}
