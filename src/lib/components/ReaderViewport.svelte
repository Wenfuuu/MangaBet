<script lang="ts">
	import type { Chapter, Manga, ReaderMode } from '$lib/types';
	import ChapterEndPanel from './ChapterEndPanel.svelte';
	import { proxyImage } from '$lib/api';

	let {
		mode,
		page,
		totalPages,
		manga,
		chapter,
		imageUrls,
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
		imageUrls: string[];
		next: () => void;
		prev: () => void;
		toggleChrome: () => void;
		prevChapter?: Chapter;
		nextChapter?: Chapter;
	} = $props();
</script>

{#if mode === 'long'}
	<div class="long-wrap">
		<div class="long-inner">
			{#each imageUrls as url}
				<img class="long-img" src={proxyImage(url)} alt="" loading="lazy" />
			{/each}
			<ChapterEndPanel {manga} {nextChapter} />
		</div>
	</div>
{:else if mode === 'wide'}
	<div class="wide-wrap">
		<div class="wide-scroll">
			<div class="wide-inner">
				{#each imageUrls as url}
					<div class="wide-page">
						<img class="page-img" src={proxyImage(url)} alt="" loading="lazy" />
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
				<img class="page-img" src={proxyImage(imageUrls[page - 1])} alt="Page {page}" />
			</div>
		{:else}
			<div class="double-spread">
				<div class="spread-page">
					<img class="page-img" src={proxyImage(imageUrls[page - 1])} alt="Page {page}" />
				</div>
				{#if page + 1 <= totalPages}
					<div class="spread-page">
						<img class="page-img" src={proxyImage(imageUrls[page])} alt="Page {page + 1}" />
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}

<style>
	.long-img {
		width: 100%;
		display: block;
	}

	.page-img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		display: block;
	}

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
