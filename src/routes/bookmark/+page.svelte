<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import BookmarkCard from '$lib/components/BookmarkCard.svelte';

	let { data }: { data: PageData } = $props();
	let removingIds = $state(new Set<number>());
</script>

<svelte:head><title>Bookmarks · MangaBet</title></svelte:head>

<div class="max-w-[1400px] mx-auto px-4 sm:px-8 pt-9 pb-24">
	<div class="mb-9">
		<div class="font-mono text-[11px] text-[var(--text-faint)] tracking-[0.18em] uppercase mb-2.5">
			My library
		</div>
		<h1 class="font-serif text-3xl sm:text-[44px] font-semibold text-[var(--text)] m-0 tracking-[-0.02em]">
			Bookmarks
		</h1>
		<div class="font-sans text-sm text-[var(--text-faint)] mt-2">
			{data.bookmarks.totalStories} {data.bookmarks.totalStories === 1 ? 'title' : 'titles'} saved
		</div>
	</div>

	{#if data.bookmarks.items.length === 0}
		<div class="py-20 text-center font-serif text-2xl text-[var(--text-faint)]">
			{data.bookmarks.page > 1 ? 'No bookmarks on this page.' : 'No bookmarks yet.'}
		</div>
	{:else}
		{#key data.bookmarks.page}
			<div class="flex flex-col gap-3 max-w-[760px] mx-auto">
				{#each data.bookmarks.items as b (b.mangaId)}
					{#if !removingIds.has(b.mangaId)}
						<BookmarkCard
							bookmark={b}
							onclick={() => goto(`/manga/${b.mangaSlug}/${b.mangaId}`)}
							onRemoveStart={() => removingIds.add(b.mangaId)}
							onRemoveError={() => removingIds.delete(b.mangaId)}
						/>
					{/if}
				{/each}
			</div>
		{/key}
	{/if}

	{#if data.bookmarks.totalPages > 1}
		<div class="mt-12 flex items-center justify-center gap-3">
			{#if data.bookmarks.page > 1}
				<a
					href="/bookmark?page={data.bookmarks.page - 1}"
					class="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg font-sans text-sm text-[var(--text-soft)] hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-colors duration-150"
				>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="15 18 9 12 15 6" />
					</svg>
					Previous
				</a>
			{/if}

			<span class="font-mono text-[11px] text-[var(--text-faint)] tracking-[0.12em] px-2">
				PAGE {data.bookmarks.page} / {data.bookmarks.totalPages}
			</span>

			{#if data.bookmarks.page < data.bookmarks.totalPages}
				<a
					href="/bookmark?page={data.bookmarks.page + 1}"
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
