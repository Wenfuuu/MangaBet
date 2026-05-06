<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import SearchResultCard from '$lib/components/SearchResultCard.svelte';

	let { data }: { data: PageData } = $props();
</script>

<div class="max-w-[1400px] mx-auto px-4 sm:px-8 pt-9 pb-24">
	<div class="mb-9">
		<div class="font-mono text-[11px] text-[var(--text-faint)] tracking-[0.18em] uppercase mb-2.5">
			{data.q.trim() ? 'Search results' : 'Browse'}
		</div>
		<h1 class="font-serif text-3xl sm:text-[44px] font-semibold text-[var(--text)] m-0 tracking-[-0.02em]">
			{#if data.q.trim()}
				Results for "<span class="text-[var(--accent)]">{data.q}</span>"
			{:else}
				The complete shelf
			{/if}
		</h1>
		<div class="font-sans text-sm text-[var(--text-faint)] mt-2">
			{data.results.length}
			{data.results.length === 1 ? 'title' : 'titles'} found
		</div>
	</div>

	{#if data.results.length === 0}
		<div class="py-20 text-center font-serif text-2xl text-[var(--text-faint)]">
			{#if data.q.trim()}
				No titles found for "{data.q}".
			{:else}
				Search for a manga title, author, or genre above.
			{/if}
		</div>
	{:else}
		<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-5 sm:gap-x-7 gap-y-8 sm:gap-y-9">
			{#each data.results as m}
				<SearchResultCard manga={m} onclick={() => goto(`/manga/${m.slug}`)} />
			{/each}
		</div>
	{/if}
</div>
