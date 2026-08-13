<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { MangaSearchDTO } from '$lib/types';
	import { proxyImage, mangaDetailUrl, saveMangaDTO } from '$lib/api';

	let query = $state('');
	let focused = $state(false);
	let menuOpen = $state(false);
	let accountOpen = $state(false);
	let inputEl: HTMLInputElement | undefined = $state(undefined);
	let wrapEl: HTMLDivElement | undefined = $state(undefined);
	let accountWrapEl: HTMLDivElement | undefined = $state(undefined);
	let results = $state<MangaSearchDTO[]>([]);
	let highlightedIndex = $state(-1);
	let cardRefs = $state<(HTMLAnchorElement | undefined)[]>([]);
	let footerRef = $state<HTMLAnchorElement | undefined>(undefined);
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;

	let isLoggedIn = $derived(Boolean(page.data?.isLoggedIn));
	let displayname = $derived(page.data?.user?.displayname);
	let malConnected = $derived(Boolean(page.data?.malConnected));

	async function logout() {
		accountOpen = false;
		await fetch('/api/logout', { method: 'POST' });
		location.reload();
	}

	function connectMal() {
		accountOpen = false;
		menuOpen = false;
		// Full navigation — the endpoint 302s to MyAnimeList's consent page.
		location.href = `/api/mal/login?return=${encodeURIComponent(page.url.pathname + page.url.search)}`;
	}

	async function disconnectMal() {
		accountOpen = false;
		menuOpen = false;
		await fetch('/api/mal/logout', { method: 'POST' });
		location.reload();
	}

	$effect(() => {
		const q = query;
		clearTimeout(debounceTimer);
		if (!q.trim()) {
			results = [];
			return;
		}
		debounceTimer = setTimeout(async () => {
			try {
				const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
				if (res.ok) results = (await res.json()).slice(0, 6);
			} catch {
				results = [];
			}
		}, 280);
		return () => clearTimeout(debounceTimer);
	});

	let activePage = $derived(
		page.url.pathname === '/'
			? 'home'
			: page.url.pathname.startsWith('/search')
				? 'browse'
				: page.url.pathname.startsWith('/latest')
					? 'latest'
					: page.url.pathname.startsWith('/bookmark')
						? 'bookmarks'
						: page.url.pathname.startsWith('/downloads')
							? 'downloads'
							: ''
	);

	function submitSearch(e?: SubmitEvent) {
		e?.preventDefault();
		if (!query.trim()) return;
		focused = false;
		goto(`/search?q=${encodeURIComponent(query.trim())}`);
	}

	// A modified click opens a new tab, so the drawer stays open behind it.
	function closeMenu(e: MouseEvent) {
		if (e.ctrlKey || e.metaKey || e.shiftKey) return;
		menuOpen = false;
	}

	function clearSearch() {
		query = '';
		results = [];
		highlightedIndex = -1;
		inputEl?.focus();
	}

	// Keyboard (Enter) path — the mouse path goes through the anchors below.
	function navigateToManga(manga: MangaSearchDTO) {
		focused = false;
		query = '';
		saveMangaDTO(manga);
		goto(mangaDetailUrl(manga));
	}

	// Side effects only — the anchor handles navigation, so never preventDefault here.
	// A modified click opens a new tab, so the dropdown stays put.
	function onResultClick(e: MouseEvent, manga: MangaSearchDTO) {
		saveMangaDTO(manga);
		if (e.ctrlKey || e.metaKey || e.shiftKey) return;
		focused = false;
		query = '';
	}

	function handleKey(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			focused = false;
			return;
		}
		if (results.length === 0) return;
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			highlightedIndex = Math.min(highlightedIndex + 1, results.length);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			highlightedIndex = Math.max(highlightedIndex - 1, 0);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (highlightedIndex >= 0 && highlightedIndex < results.length) {
				navigateToManga(results[highlightedIndex]);
			} else {
				submitSearch();
			}
		}
	}

	// Clear highlight whenever results change — user must press an arrow key to engage.
	$effect(() => {
		results;
		highlightedIndex = -1;
	});

	// Keep the highlighted item scrolled into view during keyboard navigation.
	$effect(() => {
		const el = highlightedIndex < results.length ? cardRefs[highlightedIndex] : footerRef;
		el?.scrollIntoView({ block: 'nearest' });
	});

	$effect(() => {
		const handler = (e: MouseEvent) => {
			if (wrapEl && !wrapEl.contains(e.target as Node)) focused = false;
			if (accountWrapEl && !accountWrapEl.contains(e.target as Node)) accountOpen = false;
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

<header class="sticky top-0 z-50 bg-ink/88 backdrop-blur-[14px] border-b border-edge/10">
	<div class="max-w-[1400px] mx-auto px-4 sm:px-8 py-3.5 flex items-center gap-4 sm:gap-8">
		<!-- Logo -->
		<a class="flex items-center gap-2.5 shrink-0" href="/">
			<span class="hidden sm:block font-serif font-semibold text-xl text-fg tracking-[-0.01em]">MangaBet</span>
		</a>

		<!-- Nav links — desktop -->
		<nav class="hidden sm:flex gap-1">
			<a
				class="px-3.5 py-2 rounded-md font-sans text-sm font-medium transition-colors duration-150 {activePage === 'home' ? 'text-fg' : 'text-fg-faint hover:text-fg'}"
				href="/"
			>Home</a>
			<a
				class="px-3.5 py-2 rounded-md font-sans text-sm font-medium transition-colors duration-150 {activePage === 'browse' ? 'text-fg' : 'text-fg-faint hover:text-fg'}"
				href="/search"
			>Browse</a>
			<a
				class="px-3.5 py-2 rounded-md font-sans text-sm font-medium transition-colors duration-150 {activePage === 'latest' ? 'text-fg' : 'text-fg-faint hover:text-fg'}"
				href="/latest"
			>Latest Manga</a>
			{#if isLoggedIn}
				<a
					class="px-3.5 py-2 rounded-md font-sans text-sm font-medium transition-colors duration-150 {activePage === 'bookmarks' ? 'text-fg' : 'text-fg-faint hover:text-fg'}"
					href="/bookmark"
				>Bookmarks</a>
			{/if}
			<a
				class="px-3.5 py-2 rounded-md font-sans text-sm font-medium transition-colors duration-150 {activePage === 'downloads' ? 'text-fg' : 'text-fg-faint hover:text-fg'}"
				href="/downloads"
			>Downloads</a>
		</nav>

		<!-- Search box -->
		<div class="flex-1 max-w-[280px] sm:max-w-[480px] ml-auto relative" bind:this={wrapEl}>
			<form onsubmit={submitSearch}>
				<div class="flex items-center gap-2.5 px-3.5 py-2.5 border rounded-lg transition-all duration-150 {focused ? 'bg-surface-2 border-edge/45' : 'bg-surface border-edge/15'}">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" stroke-width="2" class="shrink-0">
						<circle cx="11" cy="11" r="7" />
						<path d="m20 20-3.5-3.5" />
					</svg>
					<input
						bind:this={inputEl}
						bind:value={query}
						onfocus={() => (focused = true)}
						onkeydown={handleKey}
						placeholder="Search titles…"
						class="flex-1 min-w-0 bg-transparent border-none outline-none font-sans text-sm text-fg placeholder:text-fg-faint"
					/>
					{#if query}
						<!-- type="button" — a bare button inside the form would submit the search. -->
						<button
							type="button"
							class="shrink-0 grid place-items-center w-5 h-5 rounded-full bg-transparent border-none cursor-pointer text-fg-faint hover:text-fg hover:bg-fg/8 transition-colors duration-[120ms]"
							onclick={clearSearch}
							aria-label="Clear search"
							title="Clear search"
						>
							<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
								<path d="M18 6 6 18M6 6l12 12" />
							</svg>
						</button>
					{:else}
						<kbd class="hidden sm:block font-mono text-[11px] text-fg-faint px-1.5 py-0.5 border border-edge/20 rounded">⌘K</kbd>
					{/if}
				</div>
			</form>

			{#if focused && results.length > 0}
				<div class="absolute top-[calc(100%+6px)] left-0 right-0 bg-surface border border-edge/18 rounded-[10px] shadow-[0_24px_60px_rgba(0,0,0,0.6)] overflow-y-auto max-h-[460px] z-10">
					{#each results as m, i}
						<a
							bind:this={cardRefs[i]}
							class="flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-tint/12 transition-colors duration-[120ms] {i === highlightedIndex ? 'bg-tint/12' : 'bg-transparent'}"
							href={mangaDetailUrl(m)}
							onmouseenter={() => (highlightedIndex = i)}
							onclick={(e) => onResultClick(e, m)}
						>
							<img class="w-[38px] h-14 shrink-0 rounded-[3px] object-fill bg-surface" src={proxyImage(m.thumb)} alt={m.name} loading="lazy" />
							<div class="flex-1 min-w-0">
								<div class="font-serif text-[15px] font-medium text-fg truncate">{m.name}</div>
								<div class="font-sans text-xs text-fg-faint mt-0.5">{m.author}</div>
							</div>
							<span class="font-mono text-[11px] text-fg-soft shrink-0">{m.chapterLatest}</span>
						</a>
					{/each}
					<a
						bind:this={footerRef}
						class="block w-full px-3 py-3 border-t border-edge/12 font-sans text-[13px] text-accent text-center {highlightedIndex === results.length ? 'bg-tint/12' : 'bg-tint/6'}"
						href="/search?q={encodeURIComponent(query.trim())}"
						onmouseenter={() => (highlightedIndex = results.length)}
						onclick={(e) => {
							if (e.ctrlKey || e.metaKey || e.shiftKey) return;
							focused = false;
						}}
					>
						See all results for "{query}" →
					</a>
				</div>
			{/if}
		</div>

		<!-- Account pill — desktop -->
		<div class="hidden sm:block relative shrink-0" bind:this={accountWrapEl}>
			<button
				class="flex items-center gap-2 py-1.5 pl-2 pr-3 bg-fg/4 border border-edge/15 rounded-full cursor-pointer hover:bg-fg/8 transition-colors duration-150"
				onclick={() => (accountOpen = !accountOpen)}
			>
				<div class="w-6 h-6 rounded-full bg-gradient-to-br from-surface-4 to-accent-on border border-edge/25 grid place-items-center">
					<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#c9a37a" stroke-width="2">
						<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
						<circle cx="12" cy="7" r="4" />
					</svg>
				</div>
				<span class="font-sans text-xs text-fg-soft tracking-[0.02em] truncate max-w-[140px]">{isLoggedIn ? (displayname || 'Account') : 'Guest'}</span>
			</button>

			{#if accountOpen}
				<div class="absolute top-[calc(100%+6px)] right-0 min-w-[140px] bg-surface border border-edge/18 rounded-[10px] shadow-[0_24px_60px_rgba(0,0,0,0.6)] overflow-hidden z-10">
					{#if isLoggedIn}
						<button
							class="w-full text-left px-3.5 py-2.5 bg-transparent border-none cursor-pointer font-sans text-sm text-fg hover:bg-tint/12"
							onclick={logout}
						>Logout</button>
					{:else}
						<a
							class="block w-full text-left px-3.5 py-2.5 font-sans text-sm text-fg hover:bg-tint/12"
							href="/login"
							onclick={() => (accountOpen = false)}
						>Login</a>
						<a
							class="block w-full text-left px-3.5 py-2.5 font-sans text-sm text-fg hover:bg-tint/12 border-t border-edge/12"
							href="/register"
							onclick={() => (accountOpen = false)}
						>Register</a>
					{/if}
					{#if malConnected}
						<button
							class="w-full text-left px-3.5 py-2.5 bg-transparent border-none cursor-pointer font-sans text-sm text-fg hover:bg-tint/12 border-t border-edge/12"
							onclick={disconnectMal}
						>Disconnect MAL</button>
					{:else}
						<button
							class="w-full text-left px-3.5 py-2.5 bg-transparent border-none cursor-pointer font-sans text-sm text-fg hover:bg-tint/12 border-t border-edge/12"
							onclick={connectMal}
						>Connect MyAnimeList</button>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Hamburger — mobile -->
		<button
			class="sm:hidden flex items-center justify-center w-8 h-8 bg-transparent border-none cursor-pointer text-fg-faint shrink-0"
			onclick={() => (menuOpen = !menuOpen)}
			aria-label="Toggle menu"
		>
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				{#if menuOpen}
					<path d="M18 6 6 18M6 6l12 12" />
				{:else}
					<path d="M4 6h16M4 12h16M4 18h16" />
				{/if}
			</svg>
		</button>
	</div>

	<!-- Mobile nav drawer -->
	{#if menuOpen}
		<nav class="sm:hidden border-t border-edge/10 px-4 py-3 flex flex-col gap-1">
			<a
				class="block w-full text-left px-3 py-2.5 rounded-md font-sans text-sm font-medium {activePage === 'home' ? 'text-fg' : 'text-fg-faint'}"
				href="/"
				onclick={closeMenu}
			>Home</a>
			<a
				class="block w-full text-left px-3 py-2.5 rounded-md font-sans text-sm font-medium {activePage === 'browse' ? 'text-fg' : 'text-fg-faint'}"
				href="/search"
				onclick={closeMenu}
			>Browse</a>
			<a
				class="block w-full text-left px-3 py-2.5 rounded-md font-sans text-sm font-medium {activePage === 'latest' ? 'text-fg' : 'text-fg-faint'}"
				href="/latest"
				onclick={closeMenu}
			>Latest Manga</a>
			{#if isLoggedIn}
				<a
					class="block w-full text-left px-3 py-2.5 rounded-md font-sans text-sm font-medium {activePage === 'bookmarks' ? 'text-fg' : 'text-fg-faint'}"
					href="/bookmark"
					onclick={closeMenu}
				>Bookmarks</a>
			{/if}
			<a
				class="block w-full text-left px-3 py-2.5 rounded-md font-sans text-sm font-medium {activePage === 'downloads' ? 'text-fg' : 'text-fg-faint'}"
				href="/downloads"
				onclick={closeMenu}
			>Downloads</a>
			{#if isLoggedIn}
				<button
					class="w-full text-left px-3 py-2.5 rounded-md font-sans text-sm font-medium bg-transparent border-none cursor-pointer text-fg-faint"
					onclick={() => { menuOpen = false; logout(); }}
				>Logout</button>
			{:else}
				<a
					class="block w-full text-left px-3 py-2.5 rounded-md font-sans text-sm font-medium text-fg-faint"
					href="/login"
					onclick={closeMenu}
				>Login</a>
				<a
					class="block w-full text-left px-3 py-2.5 rounded-md font-sans text-sm font-medium text-fg-faint"
					href="/register"
					onclick={closeMenu}
				>Register</a>
			{/if}
			{#if malConnected}
				<button
					class="w-full text-left px-3 py-2.5 rounded-md font-sans text-sm font-medium bg-transparent border-none cursor-pointer text-fg-faint"
					onclick={disconnectMal}
				>Disconnect MAL</button>
			{:else}
				<button
					class="w-full text-left px-3 py-2.5 rounded-md font-sans text-sm font-medium bg-transparent border-none cursor-pointer text-fg-faint"
					onclick={connectMal}
				>Connect MyAnimeList</button>
			{/if}
		</nav>
	{/if}
</header>
