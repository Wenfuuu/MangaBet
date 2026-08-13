<script lang="ts">
	import { offlineKey } from '$lib/offline';
	import {
		cancelSave,
		getSaveProgress,
		getSavedChapter,
		isSaving,
		removeChapterOffline,
		saveChapterOffline,
	} from '$lib/stores/offline.svelte';

	let {
		mangaSlug,
		mangaId,
		mangaName,
		chapter,
		imageUrls,
		variant = 'row',
	}: {
		mangaSlug: string;
		mangaId: string;
		mangaName: string;
		chapter: { slug: string; number: number; title: string };
		imageUrls?: string[];
		variant?: 'row' | 'bar';
	} = $props();

	let key = $derived(offlineKey(mangaSlug, mangaId, chapter.slug));
	let saved = $derived(getSavedChapter(key));
	let saving = $derived(isSaving(key));
	let progress = $derived(getSaveProgress(key));
	let pct = $derived(progress?.total ? Math.round((progress.done / progress.total) * 100) : 0);

	let label = $derived(saving ? `Cancel download (${pct}%)` : saved ? 'Remove offline copy' : 'Save for offline');

	function handleClick(event: MouseEvent) {
		// The row variant sits inside a link — never let the click navigate.
		event.preventDefault();
		event.stopPropagation();

		if (saving) cancelSave(key);
		else if (saved) removeChapterOffline(key);
		else
			saveChapterOffline({
				mangaSlug,
				mangaId,
				mangaName,
				chapterSlug: chapter.slug,
				chapterNumber: chapter.number,
				chapterTitle: chapter.title,
				imageUrls,
			});
	}
</script>

<button
	type="button"
	title={label}
	aria-label={label}
	onclick={handleClick}
	class="relative inline-flex shrink-0 items-center justify-center gap-2 cursor-pointer rounded-md border transition-colors duration-150
		{variant === 'bar' ? 'px-3 py-2 font-sans text-[13px] font-medium' : 'w-8 h-8'}
		{saved
		? 'bg-accent/15 text-accent border-accent/35'
		: 'bg-fg/5 text-fg-soft border-fg/12 hover:text-fg'}"
>
	{#if saving}
		<span
			class="absolute inset-0 rounded-md opacity-30"
			style="background: conic-gradient(var(--accent) {pct * 3.6}deg, transparent 0deg);"
		></span>
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="relative">
			<rect x="6" y="6" width="12" height="12" rx="2" />
		</svg>
	{:else if saved}
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M21 12a9 9 0 1 1-9-9" />
			<polyline points="9 11 12 14 21 5" />
		</svg>
	{:else}
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M12 3v11" />
			<polyline points="8 10 12 14 16 10" />
			<path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
		</svg>
	{/if}

	{#if variant === 'bar'}
		<span class="relative max-sm:hidden">
			{saving ? `${pct}%` : saved ? 'Saved' : 'Save offline'}
		</span>
	{/if}
</button>
