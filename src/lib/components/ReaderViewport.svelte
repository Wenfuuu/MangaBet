<script lang="ts">
	import type { Chapter, Manga, ReaderMode } from '$lib/types';
	import MangaPagePlaceholder from './MangaPagePlaceholder.svelte';
	import ChapterEndPanel from './ChapterEndPanel.svelte';

	let {
		mode,
		page,
		totalPages,
		manga,
		chapter,
		next,
		prev,
		toggleChrome,
		prevChapter,
		nextChapter,
	}: {
		mode: ReaderMode;
		page: number;
		totalPages: number;
		manga: Manga;
		chapter: number;
		next: () => void;
		prev: () => void;
		toggleChrome: () => void;
		prevChapter?: Chapter;
		nextChapter?: Chapter;
	} = $props();

	let pages = $derived(Array.from({ length: totalPages }, (_, i) => i + 1));
</script>

{#if mode === 'long'}
	<div class="long-wrap">
		<div class="long-inner">
			{#each pages as p}
				<MangaPagePlaceholder
					pageNum={p}
					{totalPages}
					mangaTitle={manga.title}
					{chapter}
				/>
			{/each}
			<ChapterEndPanel {manga} {nextChapter} />
		</div>
	</div>
{:else if mode === 'wide'}
	<div class="wide-wrap">
		<div class="wide-scroll">
			<div class="wide-inner">
				{#each pages as p}
					<div class="wide-page">
						<MangaPagePlaceholder
							pageNum={p}
							{totalPages}
							mangaTitle={manga.title}
							{chapter}
							style="height: 100%; aspect-ratio: 2/3;"
						/>
					</div>
				{/each}
				<div class="wide-end">
					<ChapterEndPanel {manga} {nextChapter} />
				</div>
			</div>
		</div>
	</div>
{:else}
	<!-- Single / Double -->
	<div class="paged-wrap">
		<!-- Click zones -->
		<div class="zone zone-prev" role="button" tabindex="-1" aria-label="Previous page" onclick={prev} onkeydown={(e) => e.key === 'ArrowLeft' && prev()}></div>
		<div class="zone zone-mid" role="button" tabindex="-1" aria-label="Toggle UI" onclick={toggleChrome} onkeydown={(e) => e.key === 'Enter' && toggleChrome()}></div>
		<div class="zone zone-next" role="button" tabindex="-1" aria-label="Next page" onclick={next} onkeydown={(e) => e.key === 'ArrowRight' && next()}></div>

		{#if mode === 'single'}
			<div class="single-page">
				<MangaPagePlaceholder
					pageNum={page}
					{totalPages}
					mangaTitle={manga.title}
					{chapter}
					style="height: 100%;"
				/>
			</div>
		{:else}
			<div class="double-spread">
				<div class="spread-page">
					<MangaPagePlaceholder
						pageNum={page}
						{totalPages}
						mangaTitle={manga.title}
						{chapter}
						style="height: 100%;"
					/>
				</div>
				{#if page + 1 <= totalPages}
					<div class="spread-page">
						<MangaPagePlaceholder
							pageNum={page + 1}
							{totalPages}
							mangaTitle={manga.title}
							{chapter}
							style="height: 100%;"
						/>
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}

<style>
	/* Long strip */
	.long-wrap {
		padding-top: 70px;
		padding-bottom: 80px;
		min-height: 100vh;
	}

	.long-inner {
		max-width: 720px;
		margin: 0 auto;
		padding: 24px 16px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	/* Wide strip */
	.wide-wrap {
		padding-top: 70px;
		padding-bottom: 80px;
		height: 100vh;
		display: flex;
		align-items: center;
	}

	.wide-scroll {
		width: 100%;
		height: calc(100vh - 160px);
		overflow-x: auto;
		overflow-y: hidden;
		padding: 0 24px;
		scroll-snap-type: x mandatory;
	}

	.wide-inner {
		display: flex;
		gap: 8px;
		height: 100%;
		align-items: center;
		width: max-content;
	}

	.wide-page {
		height: 100%;
		aspect-ratio: 2 / 3;
		flex-shrink: 0;
		scroll-snap-align: start;
	}

	.wide-end {
		width: 480px;
		flex-shrink: 0;
		scroll-snap-align: start;
		display: flex;
		align-items: center;
	}

	/* Paged (single/double) */
	.paged-wrap {
		height: 100vh;
		padding-top: 70px;
		padding-bottom: 70px;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		overflow: hidden;
	}

	.zone {
		position: absolute;
		top: 70px;
		bottom: 70px;
		z-index: 5;
	}

	.zone-prev {
		left: 0;
		width: 30%;
		cursor: w-resize;
	}

	.zone-mid {
		left: 30%;
		right: 30%;
		cursor: pointer;
	}

	.zone-next {
		right: 0;
		width: 30%;
		cursor: e-resize;
	}

	.single-page {
		height: calc(100vh - 160px);
		aspect-ratio: 2 / 3;
	}

	.double-spread {
		height: calc(100vh - 160px);
		display: flex;
		gap: 6px;
	}

	.spread-page {
		height: 100%;
		aspect-ratio: 2 / 3;
	}
</style>
