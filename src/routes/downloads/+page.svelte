<script lang="ts">
	import { fmtBytes, fmtDate } from '$lib/utils';
	import { storageEstimate } from '$lib/offline';
	import {
		listSavedChapters,
		loadOfflineLibrary,
		removeAllOffline,
		removeChapterOffline,
		totalSavedBytes,
	} from '$lib/stores/offline.svelte';
	import type { SavedChapter } from '$lib/types';

	let estimate = $state<{ usage: number; quota: number } | null>(null);

	$effect(() => {
		loadOfflineLibrary();
		storageEstimate().then((result) => (estimate = result));
	});

	let chapters = $derived(listSavedChapters());
	let totalBytes = $derived(totalSavedBytes());

	let groups = $derived.by(() => {
		const byManga = new Map<string, { name: string; slug: string; id: string; chapters: SavedChapter[] }>();
		for (const ch of chapters) {
			const group = byManga.get(ch.mangaSlug) ?? {
				name: ch.mangaName,
				slug: ch.mangaSlug,
				id: ch.mangaId,
				chapters: [],
			};
			group.chapters.push(ch);
			byManga.set(ch.mangaSlug, group);
		}
		for (const group of byManga.values()) {
			group.chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
		}
		return [...byManga.values()];
	});
</script>

<svelte:head><title>Downloads · MangaBet</title></svelte:head>

<div class="max-w-[1000px] mx-auto px-4 sm:px-8 pt-12 pb-24">
	<div class="flex items-baseline justify-between gap-4 flex-wrap mb-8">
		<div>
			<h1 class="font-serif text-3xl sm:text-[40px] font-semibold text-fg m-0 tracking-[-0.02em]">
				Downloads
			</h1>
			<p class="font-sans text-sm text-fg-faint mt-2 m-0">
				{#if chapters.length}
					{chapters.length} chapter{chapters.length === 1 ? '' : 's'} · {fmtBytes(totalBytes)} of manga saved
					{#if estimate?.quota}
						<span class="text-fg-quiet">
							· MangaBet is using {fmtBytes(estimate.usage)} of {fmtBytes(estimate.quota)} available
						</span>
					{/if}
				{:else}
					Saved chapters stay readable with no connection.
				{/if}
			</p>
		</div>

		{#if chapters.length}
			<button
				class="px-4 py-2.5 bg-fg/5 text-fg-soft border border-fg/15 rounded-lg font-sans text-sm font-medium cursor-pointer hover:text-fg transition-colors duration-150"
				onclick={() => removeAllOffline()}
			>
				Remove all
			</button>
		{/if}
	</div>

	{#if !chapters.length}
		<div class="border border-edge/10 rounded-[10px] px-6 py-16 text-center">
			<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-quiet)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-4">
				<path d="M12 3v11" />
				<polyline points="8 10 12 14 16 10" />
				<path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
			</svg>
			<div class="font-serif text-lg text-fg">Nothing saved yet</div>
			<p class="font-sans text-sm text-fg-faint mt-2 max-w-[420px] mx-auto">
				Use the save icon on a chapter — in the list or in the reader — and it will be available
				here even without a connection.
			</p>
		</div>
	{:else}
		<div class="flex flex-col gap-8">
			{#each groups as group (group.slug)}
				<div>
					<a
						class="font-serif text-xl font-medium text-fg hover:text-accent transition-colors duration-150"
						href="/manga/{group.slug}/{group.id}"
					>
						{group.name}
					</a>
					<div class="border border-edge/10 rounded-[10px] overflow-hidden mt-3">
						{#each group.chapters as ch, i (ch.key)}
							<div
								class="flex items-center gap-3 pr-4 transition-colors duration-150 hover:bg-accent/6 {i ===
								group.chapters.length - 1
									? ''
									: 'border-b border-edge/8'}"
							>
								<a
									class="flex items-center gap-5 px-5 py-3.5 flex-1 min-w-0"
									href="/manga/{ch.mangaSlug}/{ch.mangaId}/chapter/{ch.chapterSlug}"
								>
									<div class="w-12 shrink-0 font-mono text-xs font-medium text-accent">
										#{ch.chapterNumber}
									</div>
									<div class="flex-1 min-w-0">
										<div class="font-serif text-[15px] font-medium text-fg leading-[1.3] truncate">
											{ch.chapterTitle}
										</div>
										<div class="font-sans text-xs text-fg-faint mt-1 flex items-center gap-2 flex-wrap">
											<span>{ch.pageCount} pages</span>
											<span class="w-0.5 h-0.5 rounded-full bg-fg-quiet shrink-0"></span>
											<span>{fmtBytes(ch.bytes)}</span>
											<span class="w-0.5 h-0.5 rounded-full bg-fg-quiet shrink-0"></span>
											<span>saved {fmtDate(new Date(ch.savedAt))}</span>
										</div>
									</div>
								</a>
								<button
									class="inline-flex items-center justify-center w-8 h-8 shrink-0 bg-fg/5 text-fg-soft border border-fg/12 rounded-md cursor-pointer hover:text-fg transition-colors duration-150"
									title="Remove offline copy"
									aria-label="Remove offline copy of chapter {ch.chapterNumber}"
									onclick={() => removeChapterOffline(ch.key)}
								>
									<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
										<path d="M5 7h14M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
									</svg>
								</button>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
