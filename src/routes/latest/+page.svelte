<script lang="ts">
	import type { PageData } from './$types';
	import MangaListCard from '$lib/components/MangaListCard.svelte';
	import RateLimitNotice from '$lib/components/RateLimitNotice.svelte';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Latest Manga · MangaBet</title></svelte:head>

<div class="max-w-[1400px] mx-auto px-4 sm:px-8 pt-9 pb-24">
	<div class="mb-9">
		<div class="font-mono text-[11px] text-fg-faint tracking-[0.18em] uppercase mb-2.5">
			Just updated
		</div>
		<h1 class="font-serif text-3xl sm:text-[44px] font-semibold text-fg m-0 tracking-[-0.02em]">
			Latest Manga
		</h1>
		{#if !data.rateLimited}
			<div class="font-sans text-sm text-fg-faint mt-2">
				{data.latest.totalStories.toLocaleString()} {data.latest.totalStories === 1 ? 'title' : 'titles'}
			</div>
		{/if}
	</div>

	{#if data.rateLimited}
		<RateLimitNotice />
	{:else if data.latest.items.length === 0}
		<div class="py-20 text-center font-serif text-2xl text-fg-faint">
			No manga on this page.
		</div>
	{:else}
		{#key data.latest.page}
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-[1100px] mx-auto">
				{#each data.latest.items as m (m.id)}
					<MangaListCard manga={m} href="/manga/{m.slug}/{m.id}" />
				{/each}
			</div>
		{/key}
	{/if}

	{#if !data.rateLimited && data.latest.totalPages > 1}
		<div class="mt-12 flex items-center justify-center gap-3">
			{#if data.latest.page > 1}
				<a
					href="/latest?page={data.latest.page - 1}"
					class="inline-flex items-center gap-2 px-4 py-2.5 bg-surface border border-edge/15 rounded-lg font-sans text-sm text-fg-soft hover:text-fg hover:border-edge/25 transition-colors duration-150"
				>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="15 18 9 12 15 6" />
					</svg>
					Previous
				</a>
			{/if}

			<span class="font-mono text-[11px] text-fg-faint tracking-[0.12em] px-2">
				PAGE {data.latest.page} / {data.latest.totalPages}
			</span>

			{#if data.latest.page < data.latest.totalPages}
				<a
					href="/latest?page={data.latest.page + 1}"
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
