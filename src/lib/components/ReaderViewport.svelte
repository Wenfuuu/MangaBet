<script lang="ts">
	import type { Chapter, ReaderMode } from '$lib/types';
	import ChapterEndPanel from './ChapterEndPanel.svelte';
	import ReaderPageFallback from './ReaderPageFallback.svelte';
	import { proxyImage } from '$lib/api';

	let wideScrollEl = $state<HTMLDivElement | undefined>(undefined);

	// Per-page load recovery. The CDN drops requests when a chapter fires all its
	// images at once, so a failed page retries a few times on a backoff before
	// giving up and offering a manual retry.
	const MAX_AUTO_RETRIES = 3;
	const RETRY_DELAYS_MS = [400, 1200, 3000];

	let attempts = $state<number[]>([]);
	let reloadKeys = $state<number[]>([]);
	let givenUp = $state<boolean[]>([]);
	const retryTimers = new Map<number, ReturnType<typeof setTimeout>>();

	function pageStatus(i: number): 'ok' | 'retrying' | 'failed' {
		if (givenUp[i]) return 'failed';
		if ((attempts[i] ?? 0) > 0) return 'retrying';
		return 'ok';
	}

	function srcFor(url: string, i: number): string {
		return proxyImage(url, reloadKeys[i] ?? 0);
	}

	function handleError(i: number) {
		const attempt = (attempts[i] ?? 0) + 1;
		attempts[i] = attempt;

		if (attempt > MAX_AUTO_RETRIES) {
			givenUp[i] = true;
			return;
		}

		const delay = RETRY_DELAYS_MS[attempt - 1] ?? 3000;
		retryTimers.set(
			i,
			setTimeout(() => {
				retryTimers.delete(i);
				reloadKeys[i] = (reloadKeys[i] ?? 0) + 1;
			}, delay)
		);
	}

	function handleLoad(i: number) {
		if (attempts[i]) attempts[i] = 0;
		if (givenUp[i]) givenUp[i] = false;
	}

	function retryNow(i: number) {
		clearTimeout(retryTimers.get(i));
		retryTimers.delete(i);
		attempts[i] = 0;
		givenUp[i] = false;
		reloadKeys[i] = (reloadKeys[i] ?? 0) + 1;
	}

	$effect(() => () => {
		for (const timer of retryTimers.values()) clearTimeout(timer);
		retryTimers.clear();
	});

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

		const SCROLL_SPEED = 36; // px per frame (~2160px/s at 60fps)
		let scrollDir = 0;
		let rafId = 0;

		const step = () => {
			if (scrollDir === 0) {
				rafId = 0;
				return;
			}
			el.scrollLeft += scrollDir * SCROLL_SPEED;
			rafId = requestAnimationFrame(step);
		};

		const keyDownHandler = (e: KeyboardEvent) => {
			if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
			e.preventDefault();
			scrollDir = e.key === 'ArrowRight' ? 1 : -1;
			if (!rafId) rafId = requestAnimationFrame(step);
		};

		const keyUpHandler = (e: KeyboardEvent) => {
			if (
				(e.key === 'ArrowRight' && scrollDir === 1) ||
				(e.key === 'ArrowLeft' && scrollDir === -1)
			) {
				scrollDir = 0;
			}
		};

		window.addEventListener('keydown', keyDownHandler);
		window.addEventListener('keyup', keyUpHandler);

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
			window.removeEventListener('keydown', keyDownHandler);
			window.removeEventListener('keyup', keyUpHandler);
			el.removeEventListener('scroll', scrollHandler);
			if (rafId) cancelAnimationFrame(rafId);
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
			{#each imageUrls as url, i}
				{@const status = pageStatus(i)}
				<!-- The img stays mounted while the fallback shows: a display:none image
				     still loads, so its onload can clear the error state. -->
				<img
					class="long-img"
					class:hidden={status !== 'ok'}
					src={srcFor(url, i)}
					alt="Page {i + 1}"
					loading="lazy"
					onerror={() => handleError(i)}
					onload={() => handleLoad(i)}
				/>
				{#if status !== 'ok'}
					<ReaderPageFallback
						pageNumber={i + 1}
						{status}
						attempt={attempts[i] ?? 0}
						maxAttempts={MAX_AUTO_RETRIES}
						variant="long"
						onretry={() => retryNow(i)}
					/>
				{/if}
			{/each}
			<ChapterEndPanel {mangaSlug} {mangaId} {nextChapter} />
		</div>
	</div>
{:else if mode === 'wide'}
	<div class="wide-wrap">
		<div class="wide-scroll" bind:this={wideScrollEl}>
			<div class="wide-inner" class:manga={mangaMode}>
				{#each imageUrls as url, i}
					{@const status = pageStatus(i)}
					<div class="wide-page">
						<img
							class="page-img"
							class:hidden={status !== 'ok'}
							src={srcFor(url, i)}
							alt=""
							loading="lazy"
							onerror={() => handleError(i)}
							onload={() => handleLoad(i)}
						/>
						{#if status !== 'ok'}
							<ReaderPageFallback
								pageNumber={i + 1}
								{status}
								attempt={attempts[i] ?? 0}
								maxAttempts={MAX_AUTO_RETRIES}
								variant="fill"
								onretry={() => retryNow(i)}
							/>
						{/if}
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
				{@const status = pageStatus(i)}
				<div class="page-slot" class:active={i === page - 1 || (mode === 'double' && i === page)}>
					<img
						class="page-img"
						class:hidden={status !== 'ok'}
						src={srcFor(url, i)}
						alt="Page {i + 1}"
						onerror={() => handleError(i)}
						onload={() => handleLoad(i)}
					/>
					{#if status !== 'ok'}
						<ReaderPageFallback
							pageNumber={i + 1}
							{status}
							attempt={attempts[i] ?? 0}
							maxAttempts={MAX_AUTO_RETRIES}
							variant="fill"
							onretry={() => retryNow(i)}
						/>
					{/if}
				</div>
			{/each}
		</div>
	</div>
{/if}

<style>
	.long-img {
		width: 100%;
		display: block;
	}

	/* Kept in the DOM so the load can still resolve behind the fallback. */
	.long-img.hidden,
	.page-img.hidden {
		display: none;
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

	/* Visibility lives on the slot, not the img — the fallback is a child component
	   and scoped selectors cannot reach inside it. */
	.page-slot {
		display: none;
		width: 100%;
		height: 100%;
	}

	.page-slot.active {
		display: block;
	}

	.double-spread .page-slot {
		flex: 1;
		min-width: 0;
	}
</style>
