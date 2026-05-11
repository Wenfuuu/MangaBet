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
				{data.page > 1 ? `No more results for "${data.q}".` : `No titles found for "${data.q}".`}
			{:else}
				Search for a manga title, author, or genre above.
			{/if}
		</div>
	{:else}
		<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-5 sm:gap-x-7 gap-y-8 sm:gap-y-9">
			{#each data.results as m}
				<SearchResultCard manga={m} onclick={() => goto(`/manga/${m.slug}`, { state: { id: m.id, name: m.name, author: m.author, thumb: m.thumb } })} />
			{/each}
		</div>
	{/if}

	{#if data.q.trim()}
		<div class="mt-12 flex items-center justify-center gap-3">
			{#if data.page > 1}
				<a
					href="/search?q={encodeURIComponent(data.q)}&page={data.page - 1}"
					class="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg font-sans text-sm text-[var(--text-soft)] hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-colors duration-150"
				>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="15 18 9 12 15 6" />
					</svg>
					Previous
				</a>
			{/if}

			<span class="font-mono text-[11px] text-[var(--text-faint)] tracking-[0.12em] px-2">
				PAGE {data.page}
			</span>

			{#if data.results.length > 0}
				<a
					href="/search?q={encodeURIComponent(data.q)}&page={data.page + 1}"
					class="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg font-sans text-sm text-[var(--text-soft)] hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-colors duration-150"
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
