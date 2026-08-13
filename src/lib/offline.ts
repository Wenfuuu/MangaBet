import { proxyImage } from '$lib/api';
import { OFFLINE_CACHE, offlineChapterPath, offlineKey } from '$lib/offlineCache';
import type { ChapterPagesResponse, SaveChapterInput, SaveProgress, SavedChapter } from '$lib/types';

export { OFFLINE_CACHE, offlineChapterPath, offlineKey };

const MANIFEST_KEY = 'mangabet:offline:v1';
const LIBRARY_PATH = '/downloads';
// The CDN throttles bursts (see the image proxy), so saving stays deliberately slow.
const CONCURRENCY = 4;

export function offlineSupported(): boolean {
	return typeof caches !== 'undefined' && typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
}

export function readManifest(): Record<string, SavedChapter> {
	try {
		const raw = localStorage.getItem(MANIFEST_KEY);
		const parsed = raw ? JSON.parse(raw) : {};
		return parsed && typeof parsed === 'object' ? parsed : {};
	} catch {
		return {};
	}
}

function writeManifest(manifest: Record<string, SavedChapter>): void {
	localStorage.setItem(MANIFEST_KEY, JSON.stringify(manifest));
}

async function cacheUrl(cache: Cache, url: string, signal: AbortSignal): Promise<number> {
	const res = await fetch(url, { signal, credentials: 'same-origin' });
	if (!res.ok) throw new Error(`${url} responded ${res.status}`);
	// Rebuild from the decoded body rather than putting the original response:
	// copying its headers wholesale can carry a content-encoding that no longer
	// describes what we are storing.
	const blob = await res.blob();
	await cache.put(
		url,
		new Response(blob, {
			headers: { 'content-type': res.headers.get('content-type') ?? 'application/octet-stream' },
		})
	);
	return blob.size;
}

async function pool<T>(items: T[], limit: number, worker: (item: T) => Promise<void>): Promise<void> {
	let next = 0;
	const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
		while (next < items.length) {
			await worker(items[next++]);
		}
	});
	await Promise.all(runners);
}

export async function fetchChapterPages(
	mangaSlug: string,
	chapterSlug: string,
	signal?: AbortSignal
): Promise<ChapterPagesResponse> {
	const res = await fetch(`/api/chapter/${mangaSlug}/${chapterSlug}`, { signal });
	if (!res.ok) throw new Error(`Could not resolve chapter pages (${res.status})`);
	return res.json();
}

export async function saveChapter(
	input: SaveChapterInput,
	opts: { onProgress?: (p: SaveProgress) => void; signal?: AbortSignal } = {}
): Promise<SavedChapter> {
	if (!offlineSupported()) throw new Error('This browser cannot store chapters offline');

	const signal = opts.signal ?? new AbortController().signal;
	const path = offlineChapterPath(input.mangaSlug, input.mangaId, input.chapterSlug);

	let { imageUrls, mangaName, chapterTitle } = input;
	if (!imageUrls?.length) {
		const resolved = await fetchChapterPages(input.mangaSlug, input.chapterSlug, signal);
		imageUrls = resolved.pages;
		mangaName ||= resolved.mangaName;
		chapterTitle ||= resolved.chapterTitle;
	}
	if (!imageUrls.length) throw new Error('Chapter has no pages');

	// Documents and their SvelteKit payloads are what make a chapter *reachable*
	// offline — images alone leave the reader with nothing to route to on a cold
	// start. The manga page rides along so "Back" and the chapter list still work,
	// and /downloads so the library itself is browsable with no network.
	const mangaPath = `/manga/${input.mangaSlug}/${input.mangaId}`;
	const urls = [
		path,
		`${path}/__data.json`,
		mangaPath,
		`${mangaPath}/__data.json`,
		LIBRARY_PATH,
		`${LIBRARY_PATH}/__data.json`,
		...imageUrls.map((url) => proxyImage(url)),
	];

	const cache = await caches.open(OFFLINE_CACHE);
	let bytes = 0;
	let done = 0;
	opts.onProgress?.({ done, total: urls.length });

	try {
		await pool(urls, CONCURRENCY, async (url) => {
			bytes += await cacheUrl(cache, url, signal);
			opts.onProgress?.({ done: ++done, total: urls.length });
		});
	} catch (err) {
		// A half-saved chapter reads worse than an unsaved one — drop what landed.
		await Promise.all(urls.map((url) => cache.delete(url)));
		throw err;
	}

	const entry: SavedChapter = {
		key: offlineKey(input.mangaSlug, input.mangaId, input.chapterSlug),
		mangaSlug: input.mangaSlug,
		mangaId: input.mangaId,
		mangaName,
		chapterSlug: input.chapterSlug,
		chapterNumber: input.chapterNumber,
		chapterTitle,
		pageCount: imageUrls.length,
		bytes,
		savedAt: Date.now(),
		urls,
	};

	const manifest = readManifest();
	manifest[entry.key] = entry;
	writeManifest(manifest);
	return entry;
}

export async function removeChapter(key: string): Promise<void> {
	const manifest = readManifest();
	const entry = manifest[key];
	delete manifest[key];
	writeManifest(manifest);
	if (!entry || !offlineSupported()) return;

	// Chapters of the same manga share the manga page and the library shell — only
	// evict what no remaining entry still depends on.
	const stillNeeded = new Set(Object.values(manifest).flatMap((other) => other.urls));
	const cache = await caches.open(OFFLINE_CACHE);
	await Promise.all(
		entry.urls.filter((url) => !stillNeeded.has(url)).map((url) => cache.delete(url))
	);
}

export async function removeAllChapters(): Promise<void> {
	writeManifest({});
	if (offlineSupported()) await caches.delete(OFFLINE_CACHE);
}

export async function storageEstimate(): Promise<{ usage: number; quota: number } | null> {
	if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return null;
	const { usage = 0, quota = 0 } = await navigator.storage.estimate();
	return { usage, quota };
}
