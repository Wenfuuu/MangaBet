<script lang="ts">
	import { goto } from '$app/navigation';
	import { mangaDetailUrl } from '$lib/api';
	import ContinueCard from '$lib/components/ContinueCard.svelte';
	import type { ContinueItem } from '$lib/types';
	import type { MangaSearchDTO } from '$lib/types';

	let continueItems = $state<ContinueItem[]>([]);

	$effect(() => {
		const items: ContinueItem[] = [];
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			const match = key?.match(/^mangabet:reader:(.+):(\d+)$/);
			if (match) {
				const [, slug, ch] = match;
				const raw = localStorage.getItem(`mangabet:manga:${slug}`);
				if (!raw) continue;
				const manga: MangaSearchDTO = JSON.parse(raw);
				const p = parseInt(localStorage.getItem(key!) ?? '1', 10) || 1;
				items.push({ manga, chapter: parseInt(ch, 10), page: p });
			}
		}
		items.sort((a, b) => b.chapter - a.chapter);
		continueItems = items.slice(0, 3);
	});
</script>

<div class="max-w-[1400px] mx-auto px-4 sm:px-8 py-12 sm:py-16 pb-24">
	<div class="mb-12">
		<div class="font-mono text-[11px] text-[var(--text-faint)] tracking-[0.18em] uppercase mb-2.5">Welcome back</div>
		<h1 class="font-serif text-4xl sm:text-5xl font-semibold text-[var(--text)] m-0 tracking-[-0.02em]">Find your next chapter.</h1>
		<p class="font-sans text-[15px] text-[var(--text-soft)] mt-3 max-w-[560px]">
			Search any title above to begin reading. Your place is kept on this device for the session.
		</p>
	</div>

	<section>
		<div class="mb-6 flex items-baseline justify-between">
			<div>
				<h2 class="font-serif text-2xl sm:text-[28px] font-semibold text-[var(--text)] m-0 tracking-[-0.015em]">Continue reading</h2>
				<p class="font-sans text-[13px] text-[var(--text-faint)] mt-1 mb-0">Where you left off this session</p>
			</div>
		</div>

		{#if continueItems.length > 0}
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
				{#each continueItems as item}
					<ContinueCard
						manga={item.manga}
						chapter={item.chapter}
						page={item.page}
						onclick={() => goto(mangaDetailUrl(item.manga))}
					/>
				{/each}
			</div>
		{:else}
			<div class="px-6 sm:px-8 py-12 bg-[var(--surface)] border border-dashed border-[rgba(160,130,100,0.18)] rounded-[10px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
				<div>
					<h3 class="font-serif text-xl sm:text-[22px] font-medium text-[var(--text)] m-0 mb-1.5">Nothing on the shelf yet.</h3>
					<p class="font-sans text-sm text-[var(--text-faint)] max-w-[480px] m-0">
						Search for a title to begin reading. Your place will be saved on this device until the session ends.
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
