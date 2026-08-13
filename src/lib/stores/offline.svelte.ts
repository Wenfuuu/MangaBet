import {
	offlineKey,
	readManifest,
	removeAllChapters,
	removeChapter,
	saveChapter,
} from '$lib/offline';
import { showToast } from '$lib/stores/toast.svelte';
import type { SaveChapterInput, SaveProgress, SavedChapter } from '$lib/types';

let entries = $state<Record<string, SavedChapter>>({});
let progress = $state<Record<string, SaveProgress>>({});
let loaded = false;
const controllers = new Map<string, AbortController>();

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

export async function saveChapterOffline(input: SaveChapterInput): Promise<void> {
	const key = offlineKey(input.mangaSlug, input.mangaId, input.chapterSlug);
	if (entries[key] || key in progress) return;

	const controller = new AbortController();
	controllers.set(key, controller);
	progress[key] = { done: 0, total: 0 };

	try {
		const entry = await saveChapter(input, {
			signal: controller.signal,
			onProgress: (p) => {
				progress[key] = p;
			},
		});
		entries[key] = entry;
		showToast(`Ch. ${entry.chapterNumber} saved for offline reading.`);
	} catch (err) {
		if (controller.signal.aborted) {
			showToast(`Download of Ch. ${input.chapterNumber} cancelled.`);
		} else {
			console.warn('[offline] save failed', err);
			showToast(err instanceof Error ? err.message : 'Could not save this chapter offline.');
		}
	} finally {
		controllers.delete(key);
		delete progress[key];
	}
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

export async function removeAllOffline(): Promise<void> {
	for (const controller of controllers.values()) controller.abort();
	entries = {};
	await removeAllChapters();
	showToast('Offline library cleared.');
}
