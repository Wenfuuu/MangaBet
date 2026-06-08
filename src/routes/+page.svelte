<script lang="ts">
	import { goto } from '$app/navigation';
	import { mangaDetailUrl, getReaderIndex, removeFromReaderIndex } from '$lib/api';
	import ContinueCard from '$lib/components/ContinueCard.svelte';
	import type { ContinueItem } from '$lib/types';
	import type { MangaSearchDTO } from '$lib/types';

	const PAGE_SIZE = 9;

	let allItems = $state<ContinueItem[]>([]);
	let visibleCount = $state(PAGE_SIZE);

	let continueItems = $derived(allItems.slice(0, visibleCount));
	let hasMore = $derived(visibleCount < allItems.length);

	$effect(() => {
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
			const manga: MangaSearchDTO = JSON.parse(raw);
			const chapterSlug = localStorage.getItem(key!) ?? '';
			if (!chapterSlug) continue;
			items.push({ manga, chapterSlug, readAt: idx[slug] ?? 0 });
		}
		items.sort((a, b) => b.readAt - a.readAt);
		allItems = items;
	});

	function loadMore() {
		visibleCount += PAGE_SIZE;
	}

	function removeItem(slug: string) {
		localStorage.removeItem(`mangabet:reader:${slug}`);
		localStorage.removeItem(`mangabet:manga:${slug}`);
		removeFromReaderIndex(slug);
		allItems = allItems.filter((item) => item.manga.slug !== slug);
	}

	function clearHistory() {
		const keysToRemove: string[] = [];
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key && (key.startsWith('mangabet:reader:') || key.startsWith('mangabet:manga:'))) {
				keysToRemove.push(key);
			}
		}
		for (const key of keysToRemove) localStorage.removeItem(key);
		allItems = [];
	}
</script>

<div class="max-w-[1400px] mx-auto px-4 sm:px-8 py-12 sm:py-16 pb-24">
	<div class="mb-12">
		<div class="font-mono text-[11px] text-[var(--text-faint)] tracking-[0.18em] uppercase mb-2.5">Welcome back</div>
		<h1 class="font-serif text-4xl sm:text-5xl font-semibold text-[var(--text)] m-0 tracking-[-0.02em]">Find your next chapter.</h1>
		<p class="font-sans text-[15px] text-[var(--text-soft)] mt-3 max-w-[560px]">
			Search any title above to begin reading.
		</p>
		<p class="font-sans text-[15px] text-[var(--text-soft)] mt-3 max-w-[560px]">
			Your reading progress is saved on this device, so you can pick up where you left off.
		</p>
	</div>

	<section>
		<div class="mb-6 flex items-baseline justify-between gap-4">
			<div>
				<h2 class="font-serif text-2xl sm:text-[28px] font-semibold text-[var(--text)] m-0 tracking-[-0.015em]">Continue reading</h2>
				<p class="font-sans text-[13px] text-[var(--text-faint)] mt-1 mb-0">Where you left off</p>
			</div>
			{#if continueItems.length > 0}
				<button
					onclick={clearHistory}
					class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-transparent border border-[rgba(160,130,100,0.2)] rounded-md font-sans text-xs text-[var(--text-soft)] hover:text-[#e8a09b] hover:border-[rgba(180,70,60,0.35)] hover:bg-[rgba(180,70,60,0.08)] cursor-pointer shrink-0 transition-colors duration-150"
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
						onclick={() => goto(`${mangaDetailUrl(item.manga)}/chapter/${item.chapterSlug}`)}
						onRemove={() => removeItem(item.manga.slug)}
					/>
				{/each}
			</div>

			{#if hasMore}
				<div class="mt-8 flex justify-center">
					<button
						onclick={loadMore}
						class="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--surface)] border border-[rgba(160,130,100,0.2)] rounded-lg font-sans text-[13px] font-medium text-[var(--text-soft)] hover:text-[var(--text)] hover:border-[rgba(160,130,100,0.35)] cursor-pointer transition-colors duration-150"
					>
						Load more
						<span class="font-mono text-[11px] text-[var(--text-faint)]">{continueItems.length} / {allItems.length}</span>
					</button>
				</div>
			{/if}
		{:else}
			<div class="px-6 sm:px-8 py-12 bg-[var(--surface)] border border-dashed border-[rgba(160,130,100,0.18)] rounded-[10px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
				<div>
					<h3 class="font-serif text-xl sm:text-[22px] font-medium text-[var(--text)] m-0 mb-1.5">Nothing on the shelf yet.</h3>
					<p class="font-sans text-sm text-[var(--text-faint)] max-w-[480px] m-0">
						Start reading a manga and it'll appear here so you can jump back in.
					</p>
				</div>
				<button
					class="px-5 py-3 bg-[var(--accent)] text-[var(--accent-on)] border-none rounded-lg font-sans text-[13px] font-semibold cursor-pointer shrink-0"
					onclick={() => goto('/search')}
				>Browse manga →</button>
			</div>
		{/if}
	</section>
</div>
