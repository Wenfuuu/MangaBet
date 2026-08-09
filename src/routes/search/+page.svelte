<script lang="ts">
	import type { PageData } from './$types';
	import SearchResultCard from '$lib/components/SearchResultCard.svelte';
	import RateLimitNotice from '$lib/components/RateLimitNotice.svelte';
	import { mangaDetailUrl, saveMangaDTO } from '$lib/api';

	let { data }: { data: PageData } = $props();

	let pageTitle = $derived(
		data.q.trim() ? `Search: ${data.q} · MangaBet` : 'Popular right now · MangaBet'
	);
</script>

<svelte:head><title>{pageTitle}</title></svelte:head>

<div class="max-w-[1400px] mx-auto px-4 sm:px-8 pt-9 pb-24">
	<div class="mb-9">
		<div class="font-mono text-[11px] text-fg-faint tracking-[0.18em] uppercase mb-2.5">
			{data.q.trim() ? 'Search results' : 'Trending'}
		</div>
		<h1 class="font-serif text-3xl sm:text-[44px] font-semibold text-fg m-0 tracking-[-0.02em]">
			{#if data.q.trim()}
				Results for "<span class="text-accent">{data.q}</span>"
			{:else}
				Popular right now
			{/if}
		</h1>
		{#if !data.rateLimited}
			<div class="font-sans text-sm text-fg-faint mt-2">
				{data.results.length}
				{data.results.length === 1 ? 'title' : 'titles'} found
			</div>
		{/if}
	</div>

	{#if data.rateLimited}
		<RateLimitNotice />
	{:else if data.results.length === 0}
		<div class="py-20 text-center font-serif text-2xl text-fg-faint">
			{#if data.q.trim()}
				{data.page > 1 ? `No more results for "${data.q}".` : `No titles found for "${data.q}".`}
			{:else}
				Search for a manga title above.
			{/if}
		</div>
	{:else}
		{#key `${data.q}:${data.page}`}
			<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-5 sm:gap-x-7 gap-y-8 sm:gap-y-9">
				{#each data.results as m}
					<SearchResultCard manga={m} href={mangaDetailUrl(m)} onclick={() => saveMangaDTO(m)} />
				{/each}
			</div>
		{/key}
	{/if}

	{#if data.q.trim() && !data.rateLimited}
		<div class="mt-12 flex items-center justify-center gap-3">
			{#if data.page > 1}
				<a
					href="/search?q={encodeURIComponent(data.q)}&page={data.page - 1}"
					class="inline-flex items-center gap-2 px-4 py-2.5 bg-surface border border-edge/15 rounded-lg font-sans text-sm text-fg-soft hover:text-fg hover:border-edge/25 transition-colors duration-150"
				>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="15 18 9 12 15 6" />
					</svg>
					Previous
				</a>
			{/if}

			<span class="font-mono text-[11px] text-fg-faint tracking-[0.12em] px-2">
				PAGE {data.page}
			</span>

			{#if data.results.length > 0}
				<a
					href="/search?q={encodeURIComponent(data.q)}&page={data.page + 1}"
					class="inline-flex items-center gap-2 px-4 py-2.5 bg-surface border border-edge/15 rounded-lg font-sans text-sm text-fg-soft hover:text-fg hover:border-edge/25 transition-colors duration-150"
				>
					Next
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="9 18 15 12 9 6" />
					</svg>
				</a>
			{/if}
		</div>
	{/if}
</div>
