<script lang="ts">
	import type { Chapter, ReaderMode } from '$lib/types';
	import { goto } from '$app/navigation';

	let {
		mangaSlug,
		mangaId,
		currentCh,
		allChapters,
		page,
		setPage,
		totalPages,
		mode,
		setMode,
		mangaMode,
		setMangaMode,
		onclose,
	}: {
		mangaSlug: string;
		mangaId: string;
		currentCh: Chapter;
		allChapters: Chapter[];
		page: number;
		setPage: (p: number) => void;
		totalPages: number;
		mode: ReaderMode;
		setMode: (m: ReaderMode) => void;
		mangaMode: boolean;
		setMangaMode: (v: boolean) => void;
		onclose: () => void;
	} = $props();

	let mangaModeApplies = $derived(mode === 'double' || mode === 'wide');

	const modes: { id: ReaderMode; label: string; desc: string }[] = [
		{ id: 'long', label: 'Long strip', desc: 'Vertical scroll, webtoon style' },
		{ id: 'single', label: 'Single page', desc: 'One page at a time' },
		{ id: 'double', label: 'Double page', desc: 'Spread, two pages side-by-side' },
		{ id: 'wide', label: 'Wide strip', desc: 'Horizontal scroll, two pages side-by-side' },
	];

	function clampPage(v: number) {
		return Math.max(1, Math.min(totalPages, v));
	}
</script>

<!-- Backdrop -->
<div
	class="backdrop"
	role="button"
	tabindex="-1"
	aria-label="Close settings"
	onclick={onclose}
	onkeydown={(e) => e.key === 'Escape' && onclose()}
></div>

<!-- Sidebar panel -->
<aside class="sidebar">
	<div class="header">
		<h3 class="header-title">Reader settings</h3>
		<button class="close-btn" aria-label="Close settings" onclick={onclose}>
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<line x1="18" y1="6" x2="6" y2="18" />
				<line x1="6" y1="6" x2="18" y2="18" />
			</svg>
		</button>
	</div>

	<div class="body">
		<!-- Reading mode -->
		<section class="section">
			<div class="section-label">Reading mode</div>
			<div class="mode-list">
				{#each modes as m}
					<button
						class="mode-row"
						class:active={mode === m.id}
						onclick={() => setMode(m.id)}
					>
						<div class="mode-icon">
							{#if m.id === 'single'}
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
									<rect x="7" y="4" width="10" height="16" rx="1" />
								</svg>
							{:else if m.id === 'double'}
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
									<rect x="3" y="4" width="8" height="16" rx="1" />
									<rect x="13" y="4" width="8" height="16" rx="1" />
								</svg>
							{:else if m.id === 'long'}
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
									<rect x="7" y="3" width="10" height="6" rx="1" />
									<rect x="7" y="11" width="10" height="6" rx="1" />
									<rect x="7" y="19" width="10" height="2" rx="1" />
								</svg>
							{:else}
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
									<rect x="3" y="6" width="6" height="12" rx="1" />
									<rect x="11" y="6" width="6" height="12" rx="1" />
									<path d="M19 8v8" stroke-dasharray="2 2" />
								</svg>
							{/if}
						</div>
						<div class="mode-info">
							<div class="mode-label">{m.label}</div>
							<div class="mode-desc">{m.desc}</div>
						</div>
						{#if mode === m.id}
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c9a37a" stroke-width="2.5">
								<polyline points="20 6 9 17 4 12" />
							</svg>
						{/if}
					</button>
				{/each}
			</div>
		</section>

		<!-- Manga mode -->
		<section class="section">
			<div class="section-label">Manga mode</div>
			<button
				class="toggle-row"
				class:active={mangaMode}
				onclick={() => setMangaMode(!mangaMode)}
				aria-pressed={mangaMode}
			>
				<div class="toggle-icon">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
						<rect x="3" y="4" width="8" height="16" rx="1" />
						<rect x="13" y="4" width="8" height="16" rx="1" />
						<polyline points="9 9 6 12 9 15" />
					</svg>
				</div>
				<div class="toggle-info">
					<div class="toggle-label">Right-to-left</div>
					<div class="toggle-desc">
						{mangaModeApplies
							? 'Japanese-style for double & wide'
							: 'Only affects double & wide modes'}
					</div>
				</div>
				<div class="switch" class:on={mangaMode}>
					<div class="switch-knob"></div>
				</div>
			</button>
		</section>

		<!-- Jump to page -->
		<section class="section">
			<div class="section-label">Jump to page</div>
			<div class="jump-row">
				<input
					type="number"
					min={1}
					max={totalPages}
					value={page}
					oninput={(e) => setPage(clampPage(parseInt((e.target as HTMLInputElement).value) || 1))}
					class="page-input"
				/>
				<span class="page-of">of {totalPages}</span>
			</div>
			<input
				type="range"
				min={1}
				max={totalPages}
				value={page}
				oninput={(e) => setPage(parseInt((e.target as HTMLInputElement).value))}
				class="page-slider"
			/>
		</section>

		<!-- Chapter list -->
		<section class="section">
			<div class="section-header-row">
				<div class="section-label">Chapter</div>
				<div class="chapter-count">{allChapters.length} total</div>
			</div>
			<div class="chapter-list">
				{#each allChapters as c}
					<button
						class="chapter-row"
						class:current={c.number === currentCh.number}
						onclick={() => {
							onclose();
							goto(`/manga/${mangaSlug}/${mangaId}/chapter/${c.slug}`);
						}}
					>
						<span class="chapter-num" class:current-num={c.number === currentCh.number}>
							#{c.number}
						</span>
						<span class="chapter-title">{c.title}</span>
					</button>
				{/each}
			</div>
		</section>

		<!-- Shortcuts -->
		<div class="shortcuts">
			<div class="section-label">Shortcuts</div>
			<div class="shortcuts-grid">
				<span class="key">← / →</span><span class="action">Page nav</span>
				<span class="key">S</span><span class="action">Settings</span>
				<span class="key">H</span><span class="action">Hide UI</span>
				<span class="key">Space</span><span class="action">Next page</span>
			</div>
		</div>
	</div>
</aside>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.55);
		z-index: 60;
	}

	.sidebar {
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		width: 380px;
		background: #0f0c0a;
		border-left: 1px solid var(--border);
		z-index: 61;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
	}

	.header {
		padding: 20px 24px;
		border-bottom: 1px solid var(--border-faint);
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-shrink: 0;
	}

	.header-title {
		font-family: 'Source Serif 4', serif;
		font-size: 20px;
		font-weight: 500;
		color: var(--text);
		margin: 0;
	}

	.close-btn {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text-faint);
		padding: 4px;
		display: grid;
		place-items: center;
	}

	.close-btn:hover {
		color: var(--text);
	}

	.body {
		padding: 24px;
		display: flex;
		flex-direction: column;
		gap: 28px;
	}

	.section-label {
		font-family: 'JetBrains Mono', monospace;
		font-size: 10px;
		color: var(--text-faint);
		letter-spacing: 0.16em;
		text-transform: uppercase;
		margin-bottom: 12px;
	}

	.mode-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.mode-row {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 12px 14px;
		background: transparent;
		border: 1px solid rgba(160, 130, 100, 0.1);
		border-radius: 8px;
		cursor: pointer;
		text-align: left;
		transition: all 120ms;
		width: 100%;
	}

	.mode-row:hover {
		background: rgba(201, 163, 122, 0.06);
	}

	.mode-row.active {
		background: rgba(201, 163, 122, 0.12);
		border-color: rgba(201, 163, 122, 0.35);
	}

	.mode-icon {
		width: 36px;
		height: 36px;
		border-radius: 6px;
		background: rgba(11, 9, 8, 0.6);
		display: grid;
		place-items: center;
		flex-shrink: 0;
		color: var(--text-faint);
	}

	.mode-row.active .mode-icon {
		color: var(--accent);
	}

	.mode-info {
		flex: 1;
		min-width: 0;
	}

	.mode-label {
		font-family: 'Inter', sans-serif;
		font-size: 14px;
		font-weight: 500;
		color: var(--text-muted);
	}

	.mode-row.active .mode-label {
		color: var(--text);
	}

	.mode-desc {
		font-family: 'Inter', sans-serif;
		font-size: 11.5px;
		color: var(--text-faint);
		margin-top: 2px;
	}

	.toggle-row {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 12px 14px;
		background: transparent;
		border: 1px solid rgba(160, 130, 100, 0.1);
		border-radius: 8px;
		cursor: pointer;
		text-align: left;
		transition: all 120ms;
		width: 100%;
	}

	.toggle-row:hover {
		background: rgba(201, 163, 122, 0.06);
	}

	.toggle-row.active {
		background: rgba(201, 163, 122, 0.12);
		border-color: rgba(201, 163, 122, 0.35);
	}

	.toggle-icon {
		width: 36px;
		height: 36px;
		border-radius: 6px;
		background: rgba(11, 9, 8, 0.6);
		display: grid;
		place-items: center;
		flex-shrink: 0;
		color: var(--text-faint);
	}

	.toggle-row.active .toggle-icon {
		color: var(--accent);
	}

	.toggle-info {
		flex: 1;
		min-width: 0;
	}

	.toggle-label {
		font-family: 'Inter', sans-serif;
		font-size: 14px;
		font-weight: 500;
		color: var(--text-muted);
	}

	.toggle-row.active .toggle-label {
		color: var(--text);
	}

	.toggle-desc {
		font-family: 'Inter', sans-serif;
		font-size: 11.5px;
		color: var(--text-faint);
		margin-top: 2px;
	}

	.switch {
		width: 32px;
		height: 18px;
		border-radius: 999px;
		background: rgba(160, 130, 100, 0.2);
		position: relative;
		flex-shrink: 0;
		transition: background 150ms;
	}

	.switch.on {
		background: var(--accent);
	}

	.switch-knob {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: #f5ecdd;
		transition: transform 150ms;
	}

	.switch.on .switch-knob {
		transform: translateX(14px);
	}

	.jump-row {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 10px;
	}

	.page-input {
		width: 72px;
		padding: 8px 10px;
		background: var(--surface);
		border: 1px solid rgba(160, 130, 100, 0.2);
		border-radius: 6px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 14px;
		color: var(--text);
		text-align: center;
		outline: none;
	}

	.page-of {
		font-family: 'Inter', sans-serif;
		font-size: 13px;
		color: var(--text-faint);
	}

	.page-slider {
		width: 100%;
		accent-color: var(--accent);
	}

	.section-header-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
	}

	.section-header-row .section-label {
		margin-bottom: 0;
	}

	.chapter-count {
		font-family: 'Inter', sans-serif;
		font-size: 11px;
		color: var(--text-faint);
	}

	.chapter-list {
		max-height: 280px;
		overflow-y: auto;
		border: 1px solid var(--border-faint);
		border-radius: 8px;
	}

	.chapter-row {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		padding: 10px 12px;
		background: transparent;
		border: none;
		border-bottom: 1px solid rgba(160, 130, 100, 0.06);
		cursor: pointer;
		text-align: left;
	}

	.chapter-row:last-child {
		border-bottom: none;
	}

	.chapter-row.current {
		background: rgba(201, 163, 122, 0.12);
	}

	.chapter-num {
		font-family: 'JetBrains Mono', monospace;
		font-size: 11px;
		color: var(--text-quiet);
		min-width: 32px;
		flex-shrink: 0;
	}

	.chapter-num.current-num {
		color: var(--accent);
	}

	.chapter-title {
		flex: 1;
		font-family: 'Inter', sans-serif;
		font-size: 13px;
		color: var(--text-soft);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.chapter-row.current .chapter-title {
		color: var(--text);
	}

	.shortcuts {
		padding: 14px;
		background: rgba(107, 67, 36, 0.06);
		border-radius: 8px;
	}

	.shortcuts-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
		font-family: 'Inter', sans-serif;
		font-size: 12px;
		color: var(--text-soft);
	}

	.key {
		color: var(--text-faint);
	}
</style>
