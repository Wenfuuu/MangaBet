import {
	offlineKey,
	readManifest,
	removeAllChapters,
	removeChapter,
	removeManga,
	saveChapter,
} from '$lib/offline';
import { showToast } from '$lib/stores/toast.svelte';
import type { SaveChapterInput, SaveProgress, SavedChapter } from '$lib/types';

// Chapters are paced apart because each one costs an upstream scrape to resolve its
// pages — firing a whole manga back-to-back is what gets the origin to rate-limit us.
const BATCH_GAP_MS = 1500;

interface BatchState {
	mangaSlug: string;
	mangaName: string;
	total: number;
	done: number;
	failed: number;
}

let entries = $state<Record<string, SavedChapter>>({});
let progress = $state<Record<string, SaveProgress>>({});
let batch = $state<BatchState | null>(null);
let loaded = false;
let batchCancelled = false;
let batchCurrentKey: string | null = null;
const controllers = new Map<string, AbortController>();

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function loadOfflineLibrary(): void {
	if (loaded) return;
	loaded = true;
	entries = readManifest();
}

export function getSavedChapter(key: string): SavedChapter | undefined {
	return entries[key];
}

export function getSaveProgress(key: string): SaveProgress | undefined {
	return progress[key];
}

export function isSaving(key: string): boolean {
	return key in progress;
}

export function listSavedChapters(): SavedChapter[] {
	return Object.values(entries).sort((a, b) => b.savedAt - a.savedAt);
}

export function totalSavedBytes(): number {
	return Object.values(entries).reduce((sum, entry) => sum + entry.bytes, 0);
}

export function getBatch(): BatchState | null {
	return batch;
}

export function savedCountForManga(mangaSlug: string): number {
	return Object.values(entries).filter((entry) => entry.mangaSlug === mangaSlug).length;
}

// Shared by single and batch saves. Reports success rather than throwing, so a batch
// can keep going past one bad chapter; the caller decides what to say about it.
async function runSave(input: SaveChapterInput): Promise<{ ok: boolean; error?: unknown }> {
	const key = offlineKey(input.mangaSlug, input.mangaId, input.chapterSlug);
	if (entries[key]) return { ok: true };
	if (key in progress) return { ok: false };

	const controller = new AbortController();
	controllers.set(key, controller);
	batchCurrentKey = key;
	progress[key] = { done: 0, total: 0 };

	try {
		const entry = await saveChapter(input, {
			signal: controller.signal,
			onProgress: (p) => {
				progress[key] = p;
			},
		});
		entries[key] = entry;
		return { ok: true };
	} catch (err) {
		if (!controller.signal.aborted) console.warn('[offline] save failed', err);
		return { ok: false, error: err };
	} finally {
		controllers.delete(key);
		delete progress[key];
		if (batchCurrentKey === key) batchCurrentKey = null;
	}
}

export async function saveChapterOffline(input: SaveChapterInput): Promise<void> {
	const key = offlineKey(input.mangaSlug, input.mangaId, input.chapterSlug);
	if (entries[key] || key in progress) return;

	const { ok, error } = await runSave(input);
	if (ok) {
		showToast(`Ch. ${input.chapterNumber} saved for offline reading.`);
	} else if (error === undefined) {
		showToast(`Download of Ch. ${input.chapterNumber} cancelled.`);
	} else {
		showToast(error instanceof Error ? error.message : 'Could not save this chapter offline.');
	}
}

export async function saveAllOffline(input: {
	mangaSlug: string;
	mangaId: string;
	mangaName: string;
	chapters: { slug: string; number: number; title: string }[];
}): Promise<void> {
	if (batch) return;

	const pending = input.chapters.filter(
		(ch) => !entries[offlineKey(input.mangaSlug, input.mangaId, ch.slug)]
	);
	if (!pending.length) {
		showToast('Every chapter is already saved.');
		return;
	}

	batchCancelled = false;
	batch = {
		mangaSlug: input.mangaSlug,
		mangaName: input.mangaName,
		total: pending.length,
		done: 0,
		failed: 0,
	};

	for (const [index, ch] of pending.entries()) {
		if (batchCancelled) break;
		if (index > 0) await wait(BATCH_GAP_MS);
		if (batchCancelled) break;

		const { ok } = await runSave({
			mangaSlug: input.mangaSlug,
			mangaId: input.mangaId,
			mangaName: input.mangaName,
			chapterSlug: ch.slug,
			chapterNumber: ch.number,
			chapterTitle: ch.title,
		});
		// A batch survives a bad chapter — aborting 200 downloads over one 404 is worse.
		if (ok) batch.done++;
		else batch.failed++;
	}

	const { done, failed } = batch;
	const cancelled = batchCancelled;
	batch = null;

	if (cancelled) showToast(`Stopped — ${done} chapter${done === 1 ? '' : 's'} saved.`);
	else if (failed) showToast(`Saved ${done}, ${failed} failed. Run it again to retry the rest.`);
	else showToast(`All ${done} chapter${done === 1 ? '' : 's'} saved for offline.`);
}

export function cancelBatch(): void {
	if (!batch) return;
	batchCancelled = true;
	if (batchCurrentKey) controllers.get(batchCurrentKey)?.abort();
}

export function cancelSave(key: string): void {
	controllers.get(key)?.abort();
}

export async function removeChapterOffline(key: string): Promise<void> {
	const entry = entries[key];
	delete entries[key];
	await removeChapter(key);
	if (entry) showToast(`Ch. ${entry.chapterNumber} removed from offline.`);
}

export async function removeMangaOffline(mangaSlug: string): Promise<void> {
	const doomed = Object.values(entries).filter((entry) => entry.mangaSlug === mangaSlug);
	if (!doomed.length) return;

	const name = doomed[0].mangaName;
	for (const entry of doomed) delete entries[entry.key];
	await removeManga(mangaSlug);
	showToast(`Removed ${doomed.length} chapter${doomed.length === 1 ? '' : 's'} of ${name}.`);
}

export async function removeAllOffline(): Promise<void> {
	for (const controller of controllers.values()) controller.abort();
	entries = {};
	await removeAllChapters();
	showToast('Offline library cleared.');
}
