<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { MANGA_LIBRARY } from '$lib/data';
	import SearchResultCard from '$lib/components/SearchResultCard.svelte';
	import FilterGroup from '$lib/components/FilterGroup.svelte';

	let genre = $state('All');
	let status = $state('All');
	let sort = $state('Relevance');

	let urlQuery = $derived(page.url.searchParams.get('q') ?? '');

	let allGenres = $derived.by(() => {
		const s = new Set<string>();
		MANGA_LIBRARY.forEach((m) => m.genres.forEach((g) => s.add(g)));
		return ['All', ...Array.from(s).sort()];
	});

	let results = $derived.by(() => {
		let list = [...MANGA_LIBRARY];
		if (urlQuery.trim()) {
			const q = urlQuery.toLowerCase();
			list = list.filter(
				(m) =>
					m.title.toLowerCase().includes(q) ||
					m.author.toLowerCase().includes(q) ||
					m.genres.some((g) => g.toLowerCase().includes(q))
			);
		}
		if (genre !== 'All') list = list.filter((m) => m.genres.includes(genre));
		if (status !== 'All') list = list.filter((m) => m.status === status);
		if (sort === 'Rating') list.sort((a, b) => b.rating - a.rating);
		else if (sort === 'Newest') list.sort((a, b) => b.year - a.year);
		else if (sort === 'Chapters') list.sort((a, b) => b.chapters - a.chapters);
		return list;
	});
</script>

<div class="page">
	<!-- Header -->
	<div class="header">
		<div class="eyebrow">{urlQuery.trim() ? 'Search results' : 'Browse'}</div>
		<h1 class="headline">
			{#if urlQuery.trim()}
				Results for "<span class="query-highlight">{urlQuery}</span>"
			{:else}
				The complete shelf
			{/if}
		</h1>
		<div class="count">{results.length} {results.length === 1 ? 'title' : 'titles'} found</div>
	</div>

	<!-- Filter bar -->
	<div class="filter-bar">
		<FilterGroup label="Genre" value={genre} options={allGenres} onchange={(v) => (genre = v)} />
		<div class="divider"></div>
		<FilterGroup
			label="Status"
			value={status}
			options={['All', 'Ongoing', 'Completed']}
			onchange={(v) => (status = v)}
		/>
		<div class="divider"></div>
		<FilterGroup
			label="Sort"
			value={sort}
			options={['Relevance', 'Rating', 'Newest', 'Chapters']}
			onchange={(v) => (sort = v)}
		/>
	</div>

	<!-- Results -->
	{#if results.length === 0}
		<div class="empty">No titles match those filters.</div>
	{:else}
		<div class="grid">
			{#each results as m}
				<SearchResultCard manga={m} onclick={() => goto(`/manga/${m.id}`)} />
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
		margin-bottom: 32px;
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

	.filter-bar {
		display: flex;
		gap: 24px;
		align-items: center;
		flex-wrap: wrap;
		padding: 20px 24px;
		background: var(--surface);
		border: 1px solid rgba(160, 130, 100, 0.12);
		border-radius: 10px;
		margin-bottom: 36px;
	}

	.divider {
		width: 1px;
		align-self: stretch;
		background: rgba(160, 130, 100, 0.12);
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
