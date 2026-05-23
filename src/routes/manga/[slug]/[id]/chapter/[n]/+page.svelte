<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { PageData } from './$types';
	import ReaderViewport from '$lib/components/ReaderViewport.svelte';
	import ReaderSidebar from '$lib/components/ReaderSidebar.svelte';
	import type { ReaderMode } from '$lib/types';

	let { data }: { data: PageData } = $props();

	let chapterSlugParam = $derived(page.params.n ?? '');
	let allChapters = $derived(data.chapters);
	let currentCh = $derived(
		allChapters.find((c) => c.slug === chapterSlugParam) ?? allChapters[allChapters.length - 1]
	);
	let chapterNum = $derived(currentCh?.number ?? 0);
	let totalPages = $derived(data.pages.length);

	let chapterIdx = $derived(allChapters.findIndex((c) => c.slug === chapterSlugParam));
	let prevChapter = $derived(allChapters[chapterIdx + 1]);
	let nextChapter = $derived(allChapters[chapterIdx - 1]);

	let currentPage = $state(1);
	$effect(() => {
		chapterSlugParam;
		currentPage = 1;
	});
	let mode = $state<ReaderMode>('long');
	let sidebarOpen = $state(false);
	let chromeVisible = $state(true);
	let chapterMenuOpen = $state(false);
	let chapterFilter = $state('');
	let titleWrapEl = $state<HTMLDivElement>();
	let chapterListEl = $state<HTMLDivElement>();

	let filteredChapters = $derived(
		chapterFilter.trim()
			? allChapters.filter((c) => {
					const q = chapterFilter.toLowerCase();
					return c.number.toString().includes(q) || c.title.toLowerCase().includes(q);
				})
			: allChapters,
	);

	$effect(() => {
		if (!chapterMenuOpen) {
			chapterFilter = '';
			return;
		}
		requestAnimationFrame(() => {
			chapterListEl?.querySelector('.dd-chapter-row.current')?.scrollIntoView({ block: 'center' });
		});
	});

	$effect(() => {
		if (!chapterMenuOpen) return;
		const handler = (e: MouseEvent) => {
			if (titleWrapEl && !titleWrapEl.contains(e.target as Node)) chapterMenuOpen = false;
		};
		document.addEventListener('mousedown', handler);
		return () => document.removeEventListener('mousedown', handler);
	});

	// Track last-read chapter per manga
	$effect(() => {
		localStorage.setItem(`mangabet:reader:${mangaSlug}`, chapterSlugParam);
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
			} else if (e.key === 'Escape' && chapterMenuOpen) {
				chapterMenuOpen = false;
			}
		};
		window.addEventListener('keydown', handleKey);
		return () => window.removeEventListener('keydown', handleKey);
	});

	let progressPct = $derived((currentPage / totalPages) * 100);
	let mangaSlug = $derived(page.params.slug ?? '');
	let mangaId = $derived(page.params.id ?? '');
	let backUrl = $derived(`/manga/${mangaSlug}/${mangaId}`);

	function goToChapter(ch: { slug: string } | undefined) {
		if (!ch) return;
		goto(`/manga/${mangaSlug}/${mangaId}/chapter/${ch.slug}`);
	}
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

			<div class="title-wrap" bind:this={titleWrapEl}>
				<button
					class="title-block"
					class:open={chapterMenuOpen}
					onclick={() => (chapterMenuOpen = !chapterMenuOpen)}
					aria-expanded={chapterMenuOpen}
					aria-haspopup="menu"
				>
					<div class="title-text">
						<div class="manga-title">{data.mangaName}</div>
						<div class="chapter-sub">{data.chapterTitle}</div>
					</div>
					<svg class="title-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
						<polyline points="6 9 12 15 18 9" />
					</svg>
				</button>

				{#if chapterMenuOpen}
					<div class="chapter-dropdown" role="menu">
						<div class="dd-search">
							<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<circle cx="11" cy="11" r="7" />
								<path d="m20 20-3.5-3.5" />
							</svg>
							<input
								type="text"
								placeholder="Filter chapters…"
								bind:value={chapterFilter}
							/>
							<span class="dd-count">{filteredChapters.length} / {allChapters.length}</span>
						</div>
						<div class="dd-list" bind:this={chapterListEl}>
							{#each filteredChapters as c}
								<button
									class="dd-chapter-row"
									class:current={c.number === chapterNum}
									onclick={() => {
										chapterMenuOpen = false;
										goToChapter(c);
									}}
								>
									<span class="dd-chapter-num" class:current-num={c.number === chapterNum}>
										#{c.number}
									</span>
									<span class="dd-chapter-title">{c.title}</span>
								</button>
							{:else}
								<div class="dd-empty">No chapters match "{chapterFilter}"</div>
							{/each}
						</div>
					</div>
				{/if}
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
	{#key chapterSlugParam}
		<ReaderViewport
			{mode}
			page={currentPage}
			{totalPages}
			{mangaSlug}
			{mangaId}
			chapter={currentCh?.number ?? chapterNum}
			imageUrls={data.pages}
			next={goNext}
			prev={goPrev}
			toggleChrome={() => (chromeVisible = !chromeVisible)}
			{prevChapter}
			{nextChapter}
			onPageChange={(p) => (currentPage = p)}
		/>
	{/key}

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
			{mangaSlug}
			{mangaId}
			currentCh={currentCh ?? allChapters[0]}
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

	.title-wrap {
		position: relative;
		min-width: 0;
		flex: 1 1 auto;
		max-width: 360px;
	}

	.title-block {
		background: rgba(232, 220, 203, 0.03);
		border: 1px solid rgba(232, 220, 203, 0.08);
		color: inherit;
		padding: 4px 10px;
		border-radius: 6px;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		min-width: 0;
		text-align: left;
		transition: all 120ms;
	}

	.title-block:hover,
	.title-block.open {
		background: rgba(232, 220, 203, 0.08);
		border-color: rgba(232, 220, 203, 0.18);
	}

	.title-text {
		min-width: 0;
		flex: 1;
	}

	.title-chevron {
		color: var(--text-faint);
		transition: transform 150ms;
		flex-shrink: 0;
	}

	.title-block.open .title-chevron {
		transform: rotate(180deg);
		color: var(--text-soft);
	}

	.chapter-dropdown {
		position: absolute;
		top: calc(100% + 8px);
		left: 0;
		min-width: 300px;
		max-width: 420px;
		background: #0f0c0a;
		border: 1px solid var(--border);
		border-radius: 10px;
		box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6);
		z-index: 50;
		display: flex;
		flex-direction: column;
		max-height: min(60vh, 480px);
		overflow: hidden;
	}

	.dd-search {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 12px;
		border-bottom: 1px solid var(--border-faint);
		color: var(--text-faint);
		flex-shrink: 0;
	}

	.dd-search input {
		flex: 1;
		background: transparent;
		border: none;
		outline: none;
		font-family: 'Inter', sans-serif;
		font-size: 13px;
		color: var(--text);
		min-width: 0;
	}

	.dd-search input::placeholder {
		color: var(--text-faint);
	}

	.dd-count {
		font-family: 'JetBrains Mono', monospace;
		font-size: 10px;
		color: var(--text-faint);
		flex-shrink: 0;
	}

	.dd-list {
		overflow-y: auto;
		flex: 1;
		min-height: 0;
	}

	.dd-chapter-row {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		padding: 9px 12px;
		background: transparent;
		border: none;
		border-bottom: 1px solid rgba(160, 130, 100, 0.06);
		cursor: pointer;
		text-align: left;
		color: var(--text-soft);
	}

	.dd-chapter-row:last-child {
		border-bottom: none;
	}

	.dd-chapter-row:hover {
		background: rgba(232, 220, 203, 0.04);
		color: var(--text);
	}

	.dd-chapter-row.current {
		background: rgba(201, 163, 122, 0.12);
		color: var(--text);
	}

	.dd-chapter-num {
		font-family: 'JetBrains Mono', monospace;
		font-size: 11px;
		color: var(--text-quiet);
		min-width: 36px;
		flex-shrink: 0;
	}

	.dd-chapter-num.current-num {
		color: var(--accent);
	}

	.dd-chapter-title {
		flex: 1;
		font-family: 'Inter', sans-serif;
		font-size: 13px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.dd-empty {
		padding: 24px 12px;
		text-align: center;
		font-family: 'Inter', sans-serif;
		font-size: 13px;
		color: var(--text-faint);
	}

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

	@media (max-width: 640px) {
		.bar-inner {
			padding: 10px 12px;
			gap: 10px;
		}

		.bottom-bar .bar-inner {
			padding: 10px 12px;
			gap: 8px;
		}

		.bar-divider {
			display: none;
		}

		.progress-track {
			display: none;
		}

		.chapter-sub {
			display: none;
		}

		.manga-title {
			font-size: 13px;
		}

		.page-count {
			font-size: 11px;
		}

		.settings-btn {
			padding: 8px 10px;
			font-size: 0;
			gap: 0;
		}

		.settings-btn svg {
			width: 16px;
			height: 16px;
		}

		.back-btn {
			font-size: 0;
			gap: 0;
		}

		.back-btn svg {
			width: 16px;
			height: 16px;
		}

		.nav-btn {
			padding: 8px 10px;
			font-size: 0;
			gap: 0;
		}

		.nav-btn svg {
			width: 16px;
			height: 16px;
		}

		.slider-wrap {
			padding: 0 4px;
			gap: 8px;
		}

		.slider-num {
			font-size: 10px;
			min-width: 18px;
		}

		.title-wrap {
			max-width: none;
		}

		.title-block {
			padding: 4px 8px;
			gap: 6px;
		}

		.chapter-dropdown {
			position: fixed;
			top: 56px;
			left: 8px;
			right: 8px;
			min-width: 0;
			max-width: none;
			max-height: 70vh;
		}
	}
</style>
