<script lang="ts">
	import { mangaDetailUrl, getReaderIndex, removeFromReaderIndex } from '$lib/api';
	import ContinueCard from '$lib/components/ContinueCard.svelte';
	import type { ContinueItem } from '$lib/types';
	import type { MangaSearchDTO } from '$lib/types';
	import { showToast } from '$lib/stores/toast.svelte';

	const PAGE_SIZE = 9;

	let allItems = $state<ContinueItem[]>([]);
	let visibleCount = $state(PAGE_SIZE);

	let continueItems = $derived(allItems.slice(0, visibleCount));
	let hasMore = $derived(visibleCount < allItems.length);

	function readItems(): ContinueItem[] {
		const idx = getReaderIndex();
		const items: ContinueItem[] = [];
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			const match = key?.match(/^mangabet:reader:(.+)$/);
			if (!match) continue;
			const slug = match[1];
			if (slug === 'index' || slug === 'mode') continue;
			const raw = localStorage.getItem(`mangabet:manga:${slug}`);
			if (!raw) continue;
			let manga: MangaSearchDTO;
			try {
				manga = JSON.parse(raw);
			} catch {
				continue;
			}
			const chapterSlug = localStorage.getItem(key!) ?? '';
			if (!chapterSlug) continue;
			items.push({ manga, chapterSlug, readAt: idx[slug] ?? 0 });
		}
		items.sort((a, b) => b.readAt - a.readAt);
		return items;
	}

	$effect(() => {
		allItems = readItems();
	});

	function loadMore() {
		visibleCount += PAGE_SIZE;
	}

	const READER_PREF_KEYS = new Set(['mangabet:reader:mode', 'mangabet:reader:mangaMode']);

	function snapshot(keys: string[]): [string, string][] {
		return keys.flatMap((key) => {
			const value = localStorage.getItem(key);
			return value === null ? [] : [[key, value] as [string, string]];
		});
	}

	function offerUndo(message: string, saved: [string, string][]) {
		showToast(message, {
			durationMs: 6000,
			action: {
				label: 'Undo',
				onClick: () => {
					for (const [key, value] of saved) localStorage.setItem(key, value);
					allItems = readItems();
				},
			},
		});
	}

	function removeItem(slug: string) {
		const saved = snapshot([`mangabet:reader:${slug}`, `mangabet:manga:${slug}`, 'mangabet:reader:index']);
		const name = allItems.find((item) => item.manga.slug === slug)?.manga.name ?? 'Series';
		localStorage.removeItem(`mangabet:reader:${slug}`);
		localStorage.removeItem(`mangabet:manga:${slug}`);
		removeFromReaderIndex(slug);
		allItems = allItems.filter((item) => item.manga.slug !== slug);
		offerUndo(`${name} removed from history.`, saved);
	}

	function clearHistory() {
		const keysToRemove: string[] = [];
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (!key || READER_PREF_KEYS.has(key)) continue;
			if (key.startsWith('mangabet:reader:') || key.startsWith('mangabet:manga:')) {
				keysToRemove.push(key);
			}
		}
		const saved = snapshot(keysToRemove);
		for (const key of keysToRemove) localStorage.removeItem(key);
		allItems = [];
		offerUndo('Reading history cleared.', saved);
	}
</script>

<svelte:head><title>MangaBet</title></svelte:head>

<div class="max-w-[1400px] mx-auto px-4 sm:px-8 py-12 sm:py-16 pb-24">
	<h1 class="font-serif text-4xl sm:text-5xl font-semibold text-fg m-0 mb-10 tracking-[-0.02em]">Find your next chapter.</h1>

	<section>
		<div class="mb-6 flex items-baseline justify-between gap-4">
			<div>
				<h2 class="font-serif text-2xl sm:text-[28px] font-semibold text-fg m-0 tracking-[-0.015em]">Continue reading</h2>
				<p class="font-sans text-[13px] text-fg-faint mt-1 mb-0">Where you left off, saved on this device</p>
			</div>
			{#if continueItems.length > 0}
				<button
					onclick={clearHistory}
					class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-transparent border border-edge/20 rounded-md font-sans text-xs text-fg-soft hover:text-danger-fg hover:border-danger/35 hover:bg-danger/8 cursor-pointer shrink-0 transition-colors duration-150"
				>
					<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="3 6 5 6 21 6" />
						<path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
					</svg>
					Clear history
				</button>
			{/if}
		</div>

		{#if continueItems.length > 0}
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
				{#each continueItems as item}
					<ContinueCard
						manga={item.manga}
						chapterSlug={item.chapterSlug}
						href="{mangaDetailUrl(item.manga)}/chapter/{item.chapterSlug}"
						onRemove={() => removeItem(item.manga.slug)}
					/>
				{/each}
			</div>

			{#if hasMore}
				<div class="mt-8 flex justify-center">
					<button
						onclick={loadMore}
						class="inline-flex items-center gap-2 px-5 py-2.5 bg-surface border border-edge/20 rounded-lg font-sans text-[13px] font-medium text-fg-soft hover:text-fg hover:border-edge/35 cursor-pointer transition-colors duration-150"
					>
						Load more
						<span class="font-mono text-[11px] text-fg-faint">{continueItems.length} / {allItems.length}</span>
					</button>
				</div>
			{/if}
		{:else}
			<div class="px-6 sm:px-8 py-12 bg-surface border border-dashed border-edge/18 rounded-[10px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
				<div>
					<h3 class="font-serif text-xl sm:text-[22px] font-medium text-fg m-0 mb-1.5">Nothing on the shelf yet.</h3>
					<p class="font-sans text-sm text-fg-faint max-w-[480px] m-0">
						Start reading a manga and it'll appear here so you can jump back in.
					</p>
				</div>
				<a
					class="px-5 py-3 bg-accent text-accent-on rounded-lg font-sans text-[13px] font-semibold shrink-0"
					href="/search"
				>Browse manga →</a>
			</div>
		{/if}
	</section>
</div>
