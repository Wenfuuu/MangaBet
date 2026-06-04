<script lang="ts">
	import type { Chapter, ReaderMode } from '$lib/types';
	import ChapterEndPanel from './ChapterEndPanel.svelte';
	import { proxyImage } from '$lib/api';

	let wideScrollEl = $state<HTMLDivElement | undefined>(undefined);

	$effect(() => {
		if (!wideScrollEl) return;
		const el = wideScrollEl;

		const wheelHandler = (e: WheelEvent) => {
			if (e.deltaY !== 0) {
				e.preventDefault();
				el.scrollLeft += mangaMode ? -e.deltaY : e.deltaY;
			}
		};
		el.addEventListener('wheel', wheelHandler, { passive: false });

		const keyHandler = (e: KeyboardEvent) => {
			if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
			e.preventDefault();
			const pageWidth = el.clientHeight * (2 / 3);
			const forward = e.key === 'ArrowRight';
			const delta = (forward ? pageWidth : -pageWidth) * (mangaMode ? -1 : 1);
			el.scrollBy({ left: delta, behavior: 'smooth' });
		};
		window.addEventListener('keydown', keyHandler);

		const scrollHandler = () => {
			const scrollable = el.scrollWidth - el.clientWidth;
			if (scrollable <= 0 || !onPageChange) return;
			const ratio = mangaMode ? 1 - el.scrollLeft / scrollable : el.scrollLeft / scrollable;
			const p = Math.max(1, Math.min(totalPages, Math.round(ratio * (totalPages - 1)) + 1));
			onPageChange(p);
		};
		el.addEventListener('scroll', scrollHandler, { passive: true });

		return () => {
			el.removeEventListener('wheel', wheelHandler);
			window.removeEventListener('keydown', keyHandler);
			el.removeEventListener('scroll', scrollHandler);
		};
	});

	// Snap wide-mode scroll to the correct edge when entering wide mode or toggling manga mode.
	$effect(() => {
		if (mode !== 'wide' || !wideScrollEl) return;
		const el = wideScrollEl;
		const rtl = mangaMode;
		requestAnimationFrame(() => {
			const scrollable = el.scrollWidth - el.clientWidth;
			if (scrollable <= 0) return;
			el.scrollLeft = rtl ? scrollable : 0;
		});
	});

	$effect(() => {
		if (mode !== 'long') return;

		const handleScroll = () => {
			if (!onPageChange) return;
			const scrollable = document.documentElement.scrollHeight - window.innerHeight;
			if (scrollable <= 0) return;
			const p = Math.max(1, Math.min(totalPages, Math.round((window.scrollY / scrollable) * (totalPages - 1)) + 1));
			onPageChange(p);
		};

		window.addEventListener('scroll', handleScroll, { passive: true });
		return () => window.removeEventListener('scroll', handleScroll);
	});

	let {
		mode,
		mangaMode = false,
		page,
		totalPages,
		mangaSlug,
		mangaId,
		chapter,
		imageUrls,
		next,
		prev,
		toggleChrome,
		prevChapter,
		nextChapter,
		onPageChange,
	}: {
		mode: ReaderMode;
		mangaMode?: boolean;
		page: number;
		totalPages: number;
		mangaSlug: string;
		mangaId: string;
		chapter: number;
		imageUrls: string[];
		next: () => void;
		prev: () => void;
		toggleChrome: () => void;
		prevChapter?: Chapter;
		nextChapter?: Chapter;
		onPageChange?: (page: number) => void;
	} = $props();
</script>

{#if mode === 'long'}
	<div class="long-wrap">
		<div class="long-inner">
			{#each imageUrls as url}
				<img class="long-img" src={proxyImage(url)} alt="" loading="lazy" />
			{/each}
			<ChapterEndPanel {mangaSlug} {mangaId} {nextChapter} />
		</div>
	</div>
{:else if mode === 'wide'}
	<div class="wide-wrap">
		<div class="wide-scroll" bind:this={wideScrollEl}>
			<div class="wide-inner" class:manga={mangaMode}>
				{#each imageUrls as url}
					<div class="wide-page">
						<img class="page-img" src={proxyImage(url)} alt="" loading="lazy" />
					</div>
				{/each}
				<div class="wide-end">
					<ChapterEndPanel {mangaSlug} {mangaId} {nextChapter} />
				</div>
			</div>
		</div>
	</div>
{:else}
	<!-- Single / Double -->
	<div class="paged-wrap">
		<!-- Click zones -->
		<div class="zone zone-prev" role="button" tabindex="-1" aria-label="Previous page" onclick={prev} onmousedown={(e) => e.preventDefault()} onkeydown={(e) => e.key === 'ArrowLeft' && prev()}></div>
		<div class="zone zone-mid" role="button" tabindex="-1" aria-label="Toggle UI" onclick={toggleChrome} onmousedown={(e) => e.preventDefault()} onkeydown={(e) => e.key === 'Enter' && toggleChrome()}></div>
		<div class="zone zone-next" role="button" tabindex="-1" aria-label="Next page" onclick={next} onmousedown={(e) => e.preventDefault()} onkeydown={(e) => e.key === 'ArrowRight' && next()}></div>

		<div
			class:single-page={mode === 'single'}
			class:double-spread={mode === 'double'}
			class:manga={mode === 'double' && mangaMode}
		>
			{#each imageUrls as url, i}
				<img
					class="page-img"
					class:active={i === page - 1 || (mode === 'double' && i === page)}
					src={proxyImage(url)}
					alt="Page {i + 1}"
				/>
			{/each}
		</div>
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
		gap: 0;
		height: 100%;
		align-items: center;
		width: max-content;
	}

	.wide-inner.manga {
		flex-direction: row-reverse;
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
		max-height: calc(100vh - 160px);
		max-width: 100%;
		aspect-ratio: 2 / 3;
	}

	.double-spread {
		max-height: calc(100vh - 160px);
		max-width: 100%;
		aspect-ratio: 4 / 3;
		display: flex;
	}

	.double-spread.manga {
		flex-direction: row-reverse;
	}

	.single-page .page-img,
	.double-spread .page-img {
		display: none;
	}

	.single-page .page-img.active,
	.double-spread .page-img.active {
		display: block;
	}

	.double-spread .page-img {
		flex: 1;
		min-width: 0;
	}
</style>
