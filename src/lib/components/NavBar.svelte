<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { MANGA_LIBRARY, COVER_PALETTES } from '$lib/data';

	let query = $state('');
	let focused = $state(false);
	let inputEl: HTMLInputElement | undefined = $state(undefined);
	let wrapEl: HTMLDivElement | undefined = $state(undefined);

	let results = $derived(
		query.trim()
			? MANGA_LIBRARY.filter(
					(m) =>
						m.title.toLowerCase().includes(query.toLowerCase()) ||
						m.author.toLowerCase().includes(query.toLowerCase()) ||
						m.genres.some((g) => g.toLowerCase().includes(query.toLowerCase()))
				).slice(0, 6)
			: []
	);

	let activePage = $derived(
		page.url.pathname === '/'
			? 'home'
			: page.url.pathname.startsWith('/search')
				? 'browse'
				: ''
	);

	function submitSearch(e?: SubmitEvent) {
		e?.preventDefault();
		if (!query.trim()) return;
		focused = false;
		goto(`/search?q=${encodeURIComponent(query.trim())}`);
	}

	function navigateToManga(id: string) {
		focused = false;
		query = '';
		goto(`/manga/${id}`);
	}

	$effect(() => {
		const handler = (e: MouseEvent) => {
			if (wrapEl && !wrapEl.contains(e.target as Node)) focused = false;
		};
		document.addEventListener('mousedown', handler);
		return () => document.removeEventListener('mousedown', handler);
	});

	$effect(() => {
		const onKey = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
				e.preventDefault();
				inputEl?.focus();
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});
</script>

<header class="navbar">
	<div class="inner">
		<!-- Logo -->
		<button class="logo" onclick={() => goto('/')}>
			<div class="logo-mark">M</div>
			<span class="logo-text">MangaBet</span>
		</button>

		<!-- Nav links -->
		<nav class="nav-links">
			<button class="nav-link" class:active={activePage === 'home'} onclick={() => goto('/')}>
				Home
			</button>
			<button
				class="nav-link"
				class:active={activePage === 'browse'}
				onclick={() => goto('/search')}
			>
				Browse
			</button>
		</nav>

		<!-- Search box -->
		<div class="search-wrap" bind:this={wrapEl}>
			<form onsubmit={submitSearch}>
				<div class="search-box" class:focused>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="var(--text-faint)"
						stroke-width="2"
					>
						<circle cx="11" cy="11" r="7" />
						<path d="m20 20-3.5-3.5" />
					</svg>
					<input
						bind:this={inputEl}
						bind:value={query}
						onfocus={() => (focused = true)}
						placeholder="Search titles, authors, genres…"
						class="search-input"
					/>
					<kbd class="search-kbd">⌘K</kbd>
				</div>
			</form>

			{#if focused && results.length > 0}
				<div class="dropdown">
					{#each results as m}
						{@const palette = COVER_PALETTES[m.cover % COVER_PALETTES.length]}
						<button
							class="dropdown-result"
							onmousedown={(e) => {
								e.preventDefault();
								navigateToManga(m.id);
							}}
						>
							<div
								class="result-cover"
								style="background: linear-gradient(160deg, {palette[0]}, {palette[1]}, {palette[2]});"
							></div>
							<div class="result-info">
								<div class="result-title">{m.title}</div>
								<div class="result-meta">{m.author} · {m.genres[0]}</div>
							</div>
							<span class="result-chapters">Ch.{m.chapters}</span>
						</button>
					{/each}
					<button
						class="dropdown-footer"
						onmousedown={(e) => {
							e.preventDefault();
							submitSearch();
						}}
					>
						See all results for "{query}" →
					</button>
				</div>
			{/if}
		</div>

		<!-- Guest pill -->
		<div class="guest-pill">
			<div class="guest-avatar">
				<svg
					width="12"
					height="12"
					viewBox="0 0 24 24"
					fill="none"
					stroke="#c9a37a"
					stroke-width="2"
				>
					<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
					<circle cx="12" cy="7" r="4" />
				</svg>
			</div>
			<span class="guest-label">Guest</span>
		</div>
	</div>
</header>

<style>
	.navbar {
		position: sticky;
		top: 0;
		z-index: 50;
		background: rgba(11, 9, 8, 0.88);
		backdrop-filter: blur(14px);
		border-bottom: 1px solid var(--border-faint);
	}

	.inner {
		max-width: 1400px;
		margin: 0 auto;
		padding: 14px 32px;
		display: flex;
		align-items: center;
		gap: 32px;
	}

	.logo {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		display: flex;
		align-items: center;
		gap: 10px;
		flex-shrink: 0;
	}

	.logo-mark {
		width: 28px;
		height: 28px;
		border-radius: 4px;
		background: linear-gradient(135deg, #6b4324, #a06a3c);
		display: grid;
		place-items: center;
		font-family: 'Source Serif 4', serif;
		font-weight: 700;
		font-size: 17px;
		color: #1a0f08;
	}

	.logo-text {
		font-family: 'Source Serif 4', serif;
		font-weight: 600;
		font-size: 20px;
		color: var(--text);
		letter-spacing: -0.01em;
	}

	.nav-links {
		display: flex;
		gap: 4px;
	}

	.nav-link {
		background: none;
		border: none;
		cursor: pointer;
		padding: 8px 14px;
		border-radius: 6px;
		font-family: 'Inter', sans-serif;
		font-size: 14px;
		font-weight: 500;
		color: var(--text-faint);
		transition: color 150ms;
	}

	.nav-link:hover,
	.nav-link.active {
		color: var(--text);
	}

	.search-wrap {
		flex: 1;
		max-width: 480px;
		margin-left: auto;
		position: relative;
	}

	.search-box {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 14px;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 8px;
		transition: all 150ms;
	}

	.search-box.focused {
		background: var(--surface-2);
		border-color: rgba(160, 130, 100, 0.45);
	}

	.search-input {
		flex: 1;
		background: none;
		border: none;
		outline: none;
		font-family: 'Inter', sans-serif;
		font-size: 14px;
		color: var(--text);
	}

	.search-input::placeholder {
		color: var(--text-faint);
	}

	.search-kbd {
		font-family: 'JetBrains Mono', monospace;
		font-size: 11px;
		color: var(--text-faint);
		padding: 2px 6px;
		border: 1px solid rgba(160, 130, 100, 0.2);
		border-radius: 4px;
	}

	.dropdown {
		position: absolute;
		top: calc(100% + 6px);
		left: 0;
		right: 0;
		background: var(--surface);
		border: 1px solid rgba(160, 130, 100, 0.18);
		border-radius: 10px;
		box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6);
		overflow: hidden;
		max-height: 460px;
		overflow-y: auto;
		z-index: 10;
	}

	.dropdown-result {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		padding: 10px 12px;
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
		transition: background 120ms;
	}

	.dropdown-result:hover {
		background: rgba(107, 67, 36, 0.12);
	}

	.result-cover {
		width: 38px;
		height: 56px;
		flex-shrink: 0;
		border-radius: 3px;
	}

	.result-info {
		flex: 1;
		min-width: 0;
	}

	.result-title {
		font-family: 'Source Serif 4', serif;
		font-size: 15px;
		font-weight: 500;
		color: var(--text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.result-meta {
		font-family: 'Inter', sans-serif;
		font-size: 12px;
		color: var(--text-faint);
		margin-top: 2px;
	}

	.result-chapters {
		font-family: 'JetBrains Mono', monospace;
		font-size: 11px;
		color: var(--text-soft);
		flex-shrink: 0;
	}

	.dropdown-footer {
		display: block;
		width: 100%;
		padding: 12px;
		background: rgba(107, 67, 36, 0.06);
		border: none;
		border-top: 1px solid rgba(160, 130, 100, 0.12);
		cursor: pointer;
		font-family: 'Inter', sans-serif;
		font-size: 13px;
		color: var(--accent);
		text-align: center;
	}

	.guest-pill {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 12px 6px 8px;
		background: rgba(232, 220, 203, 0.04);
		border: 1px solid var(--border);
		border-radius: 999px;
		flex-shrink: 0;
	}

	.guest-avatar {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: linear-gradient(135deg, #3a2a1f, #1a0f08);
		border: 1px solid var(--border-strong);
		display: grid;
		place-items: center;
	}

	.guest-label {
		font-family: 'Inter', sans-serif;
		font-size: 12px;
		color: var(--text-soft);
		letter-spacing: 0.02em;
	}
</style>
