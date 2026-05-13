<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { MANGA_LIBRARY, generateChapters } from '$lib/data';
	import type { ReaderMode } from '$lib/types';
	import type { PageData } from './$types';
	import ReaderViewport from '$lib/components/ReaderViewport.svelte';
	import ReaderSidebar from '$lib/components/ReaderSidebar.svelte';

	let { data }: { data: PageData } = $props();

	let manga = $derived(
		MANGA_LIBRARY.find((m) => m.id === page.params.slug) ?? MANGA_LIBRARY[0]
	);
	let chapterNum = $derived(parseInt(page.params.n ?? '1', 10));
	let allChapters = $derived(generateChapters(manga.chapters));
	let currentCh = $derived(
		allChapters.find((c) => c.number === chapterNum) ?? allChapters[allChapters.length - 1]
	);
	let totalPages = $derived(data.pages.length);

	let chapterIdx = $derived(allChapters.findIndex((c) => c.number === chapterNum));
	let prevChapter = $derived(allChapters[chapterIdx + 1]);
	let nextChapter = $derived(allChapters[chapterIdx - 1]);

	let currentPage = $state(1);
	let mode = $state<ReaderMode>('single');
	let sidebarOpen = $state(false);
	let chromeVisible = $state(true);

	// Restore page from localStorage
	$effect(() => {
		const key = `mangabet:reader:${page.params.slug}:${chapterNum}`;
		const saved = parseInt(localStorage.getItem(key) ?? '1', 10);
		currentPage = saved > 0 && saved <= totalPages ? saved : 1;
	});

	// Persist page to localStorage
	$effect(() => {
		localStorage.setItem(`mangabet:reader:${page.params.slug}:${chapterNum}`, String(currentPage));
	});

	// Restore reader mode from localStorage
	$effect(() => {
		const saved = localStorage.getItem('mangabet:reader:mode') as ReaderMode | null;
		if (saved && ['single', 'double', 'long', 'wide'].includes(saved)) {
			mode = saved;
		}
	});

	// Persist reader mode
	$effect(() => {
		localStorage.setItem('mangabet:reader:mode', mode);
	});

	function goNext() {
		const step = mode === 'double' ? 2 : 1;
		currentPage = Math.min(currentPage + step, totalPages);
	}

	function goPrev() {
		const step = mode === 'double' ? 2 : 1;
		currentPage = Math.max(currentPage - step, 1);
	}

	// Keyboard navigation
	$effect(() => {
		const handleKey = (e: KeyboardEvent) => {
			if (mode === 'wide') return;
			if (e.key === 'ArrowRight' || e.key === ' ') {
				e.preventDefault();
				goNext();
			} else if (e.key === 'ArrowLeft') {
				e.preventDefault();
				goPrev();
			} else if (e.key === 's' || e.key === 'S') {
				sidebarOpen = !sidebarOpen;
			} else if (e.key === 'h' || e.key === 'H') {
				chromeVisible = !chromeVisible;
			}
		};
		window.addEventListener('keydown', handleKey);
		return () => window.removeEventListener('keydown', handleKey);
	});

	let progressPct = $derived((currentPage / totalPages) * 100);
	let backUrl = $derived(`/manga/${page.params.slug}/${page.params.id}`);
</script>

<div class="reader">
	<!-- Top bar -->
	<div class="top-bar" style="transform: {chromeVisible ? 'translateY(0)' : 'translateY(-100%)'};">
		<div class="bar-inner">
			<button class="back-btn" onclick={() => goto(backUrl)}>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<polyline points="15 18 9 12 15 6" />
				</svg>
				Back
			</button>

			<div class="bar-divider"></div>

			<div class="title-block">
				<div class="manga-title">{data.detail.name}</div>
				<div class="chapter-sub">Chapter {chapterNum}</div>
			</div>

			<div class="bar-spacer"></div>

			<div class="progress-info">
				<span class="page-count">{currentPage} / {totalPages}</span>
				<div class="progress-track">
					<div class="progress-fill" style="width: {progressPct}%;"></div>
				</div>
			</div>

			<div class="bar-divider"></div>

			<button
				class="settings-btn"
				class:active={sidebarOpen}
				onclick={() => (sidebarOpen = !sidebarOpen)}
			>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="3" />
					<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
				</svg>
				Settings
			</button>
		</div>
	</div>

	<!-- Viewport -->
	<ReaderViewport
		{mode}
		page={currentPage}
		{totalPages}
		{manga}
		chapter={currentCh.number}
		imageUrls={data.pages}
		next={goNext}
		prev={goPrev}
		toggleChrome={() => (chromeVisible = !chromeVisible)}
		{prevChapter}
		{nextChapter}
	/>

	<!-- Bottom bar (hidden in long & wide mode) -->
	<div
		class="bottom-bar"
		style="transform: {chromeVisible && mode !== 'long' && mode !== 'wide' ? 'translateY(0)' : 'translateY(100%)'};"
	>
		<div class="bar-inner">
			<button class="nav-btn" disabled={currentPage === 1} onclick={goPrev}>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<polyline points="15 18 9 12 15 6" />
				</svg>
				Previous
			</button>

			<div class="slider-wrap">
				<span class="slider-num">1</span>
				<input
					type="range"
					min={1}
					max={totalPages}
					value={currentPage}
					oninput={(e) => (currentPage = parseInt((e.target as HTMLInputElement).value))}
					class="page-slider"
				/>
				<span class="slider-num right">{totalPages}</span>
			</div>

			<button class="nav-btn" disabled={currentPage >= totalPages} onclick={goNext}>
				Next
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<polyline points="9 18 15 12 9 6" />
				</svg>
			</button>
		</div>
	</div>

	<!-- Settings sidebar -->
	{#if sidebarOpen}
		<ReaderSidebar
			{manga}
			mangaSlug={page.params.slug}
			mangaId={page.params.id}
			currentCh={currentCh}
			{allChapters}
			page={currentPage}
			setPage={(p) => (currentPage = p)}
			{totalPages}
			{mode}
			setMode={(m) => (mode = m)}
			onclose={() => (sidebarOpen = false)}
		/>
	{/if}
</div>

<style>
	.reader {
		background: var(--ink-deep);
		min-height: 100vh;
		color: var(--text);
		user-select: none;
	}

	.top-bar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 40;
		background: rgba(11, 9, 8, 0.92);
		backdrop-filter: blur(14px);
		border-bottom: 1px solid var(--border-faint);
		transition: transform 250ms;
	}

	.bottom-bar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 40;
		background: rgba(11, 9, 8, 0.92);
		backdrop-filter: blur(14px);
		border-top: 1px solid var(--border-faint);
		transition: transform 250ms;
	}

	.bar-inner {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 14px 24px;
	}

	.bottom-bar .bar-inner {
		padding: 12px 24px;
		gap: 12px;
	}

	.back-btn {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text-soft);
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-family: 'Inter', sans-serif;
		font-size: 13px;
		flex-shrink: 0;
	}

	.back-btn:hover { color: var(--text); }

	.bar-divider {
		width: 1px;
		height: 18px;
		background: rgba(160, 130, 100, 0.15);
		flex-shrink: 0;
	}

	.title-block { min-width: 0; }

	.manga-title {
		font-family: 'Source Serif 4', serif;
		font-size: 15px;
		font-weight: 500;
		color: var(--text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.chapter-sub {
		font-family: 'Inter', sans-serif;
		font-size: 11px;
		color: var(--text-faint);
		margin-top: 1px;
	}

	.bar-spacer { flex: 1; }

	.progress-info {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-shrink: 0;
	}

	.page-count {
		font-family: 'JetBrains Mono', monospace;
		font-size: 12px;
		color: var(--text-soft);
	}

	.progress-track {
		width: 200px;
		height: 3px;
		background: rgba(160, 130, 100, 0.15);
		border-radius: 2px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: var(--accent);
		transition: width 200ms;
	}

	.settings-btn {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 8px 14px;
		background: rgba(232, 220, 203, 0.05);
		border: 1px solid rgba(232, 220, 203, 0.12);
		color: var(--text);
		border-radius: 6px;
		cursor: pointer;
		font-family: 'Inter', sans-serif;
		font-size: 13px;
		font-weight: 500;
		flex-shrink: 0;
		transition: all 120ms;
	}

	.settings-btn.active {
		background: rgba(201, 163, 122, 0.15);
		border-color: rgba(201, 163, 122, 0.35);
	}

	.nav-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 9px 16px;
		background: rgba(232, 220, 203, 0.05);
		border: 1px solid rgba(232, 220, 203, 0.12);
		color: var(--text);
		border-radius: 6px;
		cursor: pointer;
		font-family: 'Inter', sans-serif;
		font-size: 13px;
		font-weight: 500;
		flex-shrink: 0;
		transition: opacity 150ms;
	}

	.nav-btn:disabled {
		opacity: 0.35;
		cursor: not-allowed;
		color: var(--text-quiet);
	}

	.slider-wrap {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 0 16px;
	}

	.slider-num {
		font-family: 'JetBrains Mono', monospace;
		font-size: 11px;
		color: var(--text-faint);
		min-width: 24px;
	}

	.slider-num.right {
		text-align: right;
		min-width: 30px;
	}

	.page-slider {
		flex: 1;
		accent-color: var(--accent);
	}
</style>
