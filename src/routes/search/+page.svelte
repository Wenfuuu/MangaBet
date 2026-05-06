<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import SearchResultCard from '$lib/components/SearchResultCard.svelte';

	let { data }: { data: PageData } = $props();
</script>

<div class="page">
	<!-- Header -->
	<div class="header">
		<div class="eyebrow">{data.q.trim() ? 'Search results' : 'Browse'}</div>
		<h1 class="headline">
			{#if data.q.trim()}
				Results for "<span class="query-highlight">{data.q}</span>"
			{:else}
				The complete shelf
			{/if}
		</h1>
		<div class="count">
			{data.results.length}
			{data.results.length === 1 ? 'title' : 'titles'} found
		</div>
	</div>

	<!-- Results -->
	{#if data.results.length === 0}
		<div class="empty">
			{#if data.q.trim()}
				No titles found for "{data.q}".
			{:else}
				Search for a manga title, author, or genre above.
			{/if}
		</div>
	{:else}
		<div class="grid">
			{#each data.results as m}
				<SearchResultCard manga={m} onclick={() => goto(`/manga/${m.slug}`)} />
			{/each}
		</div>
	{/if}
</div>

<style>
	.page {
		max-width: 1400px;
		margin: 0 auto;
		padding: 36px 32px 96px;
	}

	.header {
		margin-bottom: 36px;
	}

	.eyebrow {
		font-family: 'JetBrains Mono', monospace;
		font-size: 11px;
		color: var(--text-faint);
		letter-spacing: 0.18em;
		text-transform: uppercase;
		margin-bottom: 10px;
	}

	.headline {
		font-family: 'Source Serif 4', serif;
		font-size: 44px;
		font-weight: 600;
		color: var(--text);
		margin: 0;
		letter-spacing: -0.02em;
	}

	.query-highlight {
		color: var(--accent);
	}

	.count {
		font-family: 'Inter', sans-serif;
		font-size: 14px;
		color: var(--text-faint);
		margin-top: 8px;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		column-gap: 28px;
		row-gap: 36px;
	}

	.empty {
		padding: 80px 0;
		text-align: center;
		font-family: 'Source Serif 4', serif;
		font-size: 24px;
		color: var(--text-faint);
	}
</style>
