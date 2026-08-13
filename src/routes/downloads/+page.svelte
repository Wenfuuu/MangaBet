<script lang="ts">
	import { fmtBytes, fmtDate } from '$lib/utils';
	import { proxyImage } from '$lib/api';
	import { storageEstimate } from '$lib/offline';
	import {
		listSavedChapters,
		loadOfflineLibrary,
		removeAllOffline,
		removeChapterOffline,
		removeMangaOffline,
		totalSavedBytes,
	} from '$lib/stores/offline.svelte';
	import type { SavedChapter } from '$lib/types';

	interface MangaGroup {
		slug: string;
		id: string;
		name: string;
		chapters: SavedChapter[];
		bytes: number;
		first: number;
		last: number;
	}

	let estimate = $state<{ usage: number; quota: number } | null>(null);
	let query = $state('');
	let open = $state<Record<string, boolean>>({});

	$effect(() => {
		loadOfflineLibrary();
		storageEstimate().then((result) => (estimate = result));
	});

	let chapters = $derived(listSavedChapters());
	let totalBytes = $derived(totalSavedBytes());

	let groups = $derived.by(() => {
		const byManga = new Map<string, MangaGroup>();
		for (const ch of chapters) {
			const group = byManga.get(ch.mangaSlug) ?? {
				slug: ch.mangaSlug,
				id: ch.mangaId,
				name: ch.mangaName,
				chapters: [],
				bytes: 0,
				first: Infinity,
				last: -Infinity,
			};
			group.chapters.push(ch);
			group.bytes += ch.bytes;
			group.first = Math.min(group.first, ch.chapterNumber);
			group.last = Math.max(group.last, ch.chapterNumber);
			byManga.set(ch.mangaSlug, group);
		}
		const list = [...byManga.values()];
		for (const group of list) group.chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
		return list.sort((a, b) => a.name.localeCompare(b.name));
	});

	// Covers are written by the manga page via saveMangaDTO; missing ones fall back
	// to the slug's gradient, which is also what happens offline before one is cached.
	let covers = $derived.by(() => {
		const found: Record<string, string> = {};
		if (typeof localStorage === 'undefined') return found;
		for (const group of groups) {
			try {
				const raw = localStorage.getItem(`mangabet:manga:${group.slug}`);
				const thumb = raw ? JSON.parse(raw)?.thumb : null;
				if (thumb) found[group.slug] = thumb;
			} catch {
				// Ignore unreadable entries — the gradient covers it.
			}
		}
		return found;
	});

	let q = $derived(query.trim().toLowerCase());

	let visible = $derived.by(() => {
		if (!q) return groups;
		const results: MangaGroup[] = [];
		for (const group of groups) {
			// A manga-name match keeps every chapter; otherwise narrow to matching ones.
			if (group.name.toLowerCase().includes(q)) {
				results.push(group);
				continue;
			}
			const matches = group.chapters.filter(
				(ch) =>
					String(ch.chapterNumber).includes(q) || ch.chapterTitle.toLowerCase().includes(q)
			);
			if (matches.length) results.push({ ...group, chapters: matches });
		}
		return results;
	});

	let matchCount = $derived(visible.reduce((sum, group) => sum + group.chapters.length, 0));
	// Searching expands everything — hiding a hit behind a click defeats the search.
	// Must return a real boolean: `undefined` makes Svelte drop aria-expanded entirely,
	// so a collapsed card would not announce itself as expandable.
	let isOpen = (slug: string) => !!q || !!open[slug];
	let allOpen = $derived(visible.length > 0 && visible.every((group) => isOpen(group.slug)));

	function toggleAll() {
		const next = !allOpen;
		for (const group of visible) open[group.slug] = next;
	}

	function chapterHref(ch: SavedChapter) {
		return `/manga/${ch.mangaSlug}/${ch.mangaId}/chapter/${ch.chapterSlug}`;
	}
</script>

<svelte:head><title>Downloads · MangaBet</title></svelte:head>

<div class="max-w-[1000px] mx-auto px-4 sm:px-8 pt-12 pb-24">
	<div class="flex items-baseline justify-between gap-4 flex-wrap mb-6">
		<div>
			<h1 class="font-serif text-3xl sm:text-[40px] font-semibold text-fg m-0 tracking-[-0.02em]">
				Downloads
			</h1>
			<p class="font-sans text-sm text-fg-faint mt-2 m-0">
				{#if chapters.length}
					{groups.length} title{groups.length === 1 ? '' : 's'} · {chapters.length} chapter{chapters.length === 1
						? ''
						: 's'} · {fmtBytes(totalBytes)} of manga saved
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

	{#if chapters.length}
		<div class="flex items-center gap-3 mb-6 flex-wrap">
			<div class="flex items-center gap-2.5 px-3.5 py-2.5 bg-surface border border-edge/15 rounded-lg flex-1 min-w-55 focus-within:border-edge/45 transition-colors duration-150">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" stroke-width="2" class="shrink-0">
					<circle cx="11" cy="11" r="7" />
					<path d="m20 20-3.5-3.5" />
				</svg>
				<input
					class="flex-1 bg-transparent border-none outline-none font-sans text-sm text-fg min-w-0 placeholder:text-fg-faint"
					type="text"
					placeholder="Filter by title or chapter…"
					bind:value={query}
				/>
				{#if q}
					<button
						class="shrink-0 font-mono text-[10px] text-fg-faint cursor-pointer bg-transparent border-none hover:text-fg"
						onclick={() => (query = '')}
					>
						CLEAR
					</button>
				{/if}
			</div>

			<button
				class="px-3.5 py-2.5 bg-transparent border border-edge/20 rounded-lg font-sans text-xs text-fg-soft cursor-pointer hover:text-fg transition-colors duration-150 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
				disabled={!!q || !visible.length}
				title={q ? 'Search already expands every match' : ''}
				onclick={toggleAll}
			>
				{allOpen ? 'Collapse all' : 'Expand all'}
			</button>
		</div>
	{/if}

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
	{:else if !visible.length}
		<div class="border border-edge/10 rounded-[10px] px-6 py-14 text-center">
			<div class="font-serif text-lg text-fg">No matches for "{query.trim()}"</div>
			<p class="font-sans text-sm text-fg-faint mt-2">Try a title, or a chapter number.</p>
		</div>
	{:else}
		{#if q}
			<p class="font-sans text-xs text-fg-faint mb-3">
				{matchCount} chapter{matchCount === 1 ? '' : 's'} in {visible.length} title{visible.length === 1 ? '' : 's'}
			</p>
		{/if}

		<div class="flex flex-col gap-3">
			{#each visible as group (group.slug)}
				<div class="bg-surface border border-edge/15 hover:border-edge/25 rounded-lg overflow-hidden transition-colors duration-150">
					<div class="flex items-center gap-3 pr-3">
						<button
							class="flex items-center gap-4 flex-1 min-w-0 p-3 sm:p-4 text-left bg-transparent border-none cursor-pointer"
							aria-expanded={isOpen(group.slug)}
							onclick={() => (open[group.slug] = !isOpen(group.slug))}
						>
							<div class="w-14 aspect-[2/3] shrink-0 overflow-hidden rounded-md relative bg-surface-2">
								{#if covers[group.slug]}
									<img
										class="absolute inset-0 w-full h-full object-fill"
										src={proxyImage(covers[group.slug])}
										alt=""
										loading="lazy"
									/>
								{/if}
							</div>

							<div class="flex-1 min-w-0">
								<div class="font-serif text-base sm:text-lg font-medium text-fg leading-tight truncate">
									{group.name}
								</div>
								<div class="font-sans text-xs text-fg-faint mt-1.5 flex items-center gap-2 flex-wrap">
									<span>{group.chapters.length} chapter{group.chapters.length === 1 ? '' : 's'}</span>
									<span class="w-0.5 h-0.5 rounded-full bg-fg-quiet shrink-0"></span>
									<span class="font-mono text-[11px] text-accent">
										{group.first === group.last ? `#${group.first}` : `#${group.first}–${group.last}`}
									</span>
									<span class="w-0.5 h-0.5 rounded-full bg-fg-quiet shrink-0"></span>
									<span>{fmtBytes(group.bytes)}</span>
								</div>
							</div>

							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="var(--text-quiet)"
								stroke-width="2"
								class="shrink-0"
								style="transform: rotate({isOpen(group.slug) ? 180 : 0}deg); transition: transform 200ms;"
							>
								<polyline points="6 9 12 15 18 9" />
							</svg>
						</button>

						<button
							class="inline-flex items-center justify-center w-8 h-8 shrink-0 bg-fg/5 text-fg-soft border border-fg/12 rounded-md cursor-pointer hover:text-fg transition-colors duration-150"
							title="Remove all saved chapters of {group.name}"
							aria-label="Remove all saved chapters of {group.name}"
							onclick={() => removeMangaOffline(group.slug)}
						>
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
								<path d="M5 7h14M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
							</svg>
						</button>
					</div>

					{#if isOpen(group.slug)}
						<div class="border-t border-edge/8">
							<div class="px-3 pt-2.5 pb-1">
								<a
									class="font-sans text-xs text-fg-faint hover:text-accent transition-colors duration-150"
									href="/manga/{group.slug}/{group.id}"
								>
									Open manga page →
								</a>
							</div>
							{#each group.chapters as ch (ch.key)}
								<div class="flex items-center gap-3 pr-3 transition-colors duration-150 hover:bg-accent/6">
									<a class="flex items-center gap-4 px-3 py-2.5 flex-1 min-w-0" href={chapterHref(ch)}>
										<div class="w-11 shrink-0 font-mono text-xs font-medium text-accent">
											#{ch.chapterNumber}
										</div>
										<div class="flex-1 min-w-0">
											<div class="font-serif text-[15px] font-medium text-fg leading-[1.3] truncate">
												{ch.chapterTitle}
											</div>
											<div class="font-sans text-xs text-fg-faint mt-0.5 flex items-center gap-2 flex-wrap">
												<span>{ch.pageCount} pages</span>
												<span class="w-0.5 h-0.5 rounded-full bg-fg-quiet shrink-0"></span>
												<span>{fmtBytes(ch.bytes)}</span>
												<span class="w-0.5 h-0.5 rounded-full bg-fg-quiet shrink-0"></span>
												<span>saved {fmtDate(new Date(ch.savedAt))}</span>
											</div>
										</div>
									</a>
									<button
										class="inline-flex items-center justify-center w-8 h-8 shrink-0 bg-transparent text-fg-quiet border border-transparent rounded-md cursor-pointer hover:text-fg hover:border-fg/12 transition-colors duration-150"
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
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
