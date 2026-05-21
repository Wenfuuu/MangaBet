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
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;

	let isLoggedIn = $derived(Boolean(page.data?.isLoggedIn));

	async function logout() {
		accountOpen = false;
		await fetch('/api/logout', { method: 'POST' });
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
				: ''
	);

	function submitSearch(e?: SubmitEvent) {
		e?.preventDefault();
		if (!query.trim()) return;
		focused = false;
		goto(`/search?q=${encodeURIComponent(query.trim())}`);
	}

	function navigateToManga(manga: MangaSearchDTO) {
		focused = false;
		query = '';
		saveMangaDTO(manga);
		goto(mangaDetailUrl(manga));
	}

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

<header class="sticky top-0 z-50 bg-[rgba(11,9,8,0.88)] backdrop-blur-[14px] border-b border-[var(--border-faint)]">
	<div class="max-w-[1400px] mx-auto px-4 sm:px-8 py-3.5 flex items-center gap-4 sm:gap-8">
		<!-- Logo -->
		<button
			class="flex items-center gap-2.5 shrink-0 bg-transparent border-none cursor-pointer p-0"
			onclick={() => goto('/')}
		>
			<span class="hidden sm:block font-serif font-semibold text-xl text-[var(--text)] tracking-[-0.01em]">MangaBet</span>
		</button>

		<!-- Nav links — desktop -->
		<nav class="hidden sm:flex gap-1">
			<button
				class="bg-transparent border-none cursor-pointer px-3.5 py-2 rounded-md font-sans text-sm font-medium transition-colors duration-150 {activePage === 'home' ? 'text-[var(--text)]' : 'text-[var(--text-faint)] hover:text-[var(--text)]'}"
				onclick={() => goto('/')}
			>Home</button>
			<button
				class="bg-transparent border-none cursor-pointer px-3.5 py-2 rounded-md font-sans text-sm font-medium transition-colors duration-150 {activePage === 'browse' ? 'text-[var(--text)]' : 'text-[var(--text-faint)] hover:text-[var(--text)]'}"
				onclick={() => goto('/search')}
			>Browse</button>
		</nav>

		<!-- Search box -->
		<div class="flex-1 max-w-[280px] sm:max-w-[480px] ml-auto relative" bind:this={wrapEl}>
			<form onsubmit={submitSearch}>
				<div class="flex items-center gap-2.5 px-3.5 py-2.5 border rounded-lg transition-all duration-150 {focused ? 'bg-[var(--surface-2)] border-[rgba(160,130,100,0.45)]' : 'bg-[var(--surface)] border-[var(--border)]'}">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" stroke-width="2" class="shrink-0">
						<circle cx="11" cy="11" r="7" />
						<path d="m20 20-3.5-3.5" />
					</svg>
					<input
						bind:this={inputEl}
						bind:value={query}
						onfocus={() => (focused = true)}
						placeholder="Search titles…"
						class="flex-1 min-w-0 bg-transparent border-none outline-none font-sans text-sm text-[var(--text)] placeholder:text-[var(--text-faint)]"
					/>
					<kbd class="hidden sm:block font-mono text-[11px] text-[var(--text-faint)] px-1.5 py-0.5 border border-[rgba(160,130,100,0.2)] rounded">⌘K</kbd>
				</div>
			</form>

			{#if focused && results.length > 0}
				<div class="absolute top-[calc(100%+6px)] left-0 right-0 bg-[var(--surface)] border border-[rgba(160,130,100,0.18)] rounded-[10px] shadow-[0_24px_60px_rgba(0,0,0,0.6)] overflow-y-auto max-h-[460px] z-10">
					{#each results as m}
						<button
							class="flex items-center gap-3 w-full px-3 py-2.5 bg-transparent border-none cursor-pointer text-left hover:bg-[rgba(107,67,36,0.12)] transition-colors duration-[120ms]"
							onmousedown={(e) => {
								e.preventDefault();
								navigateToManga(m);
							}}
						>
							<img class="w-[38px] h-14 shrink-0 rounded-[3px] object-cover bg-[var(--surface)]" src={proxyImage(m.thumb)} alt={m.name} loading="lazy" />
							<div class="flex-1 min-w-0">
								<div class="font-serif text-[15px] font-medium text-[var(--text)] truncate">{m.name}</div>
								<div class="font-sans text-xs text-[var(--text-faint)] mt-0.5">{m.author}</div>
							</div>
							<span class="font-mono text-[11px] text-[var(--text-soft)] shrink-0">{m.chapterLatest}</span>
						</button>
					{/each}
					<button
						class="block w-full px-3 py-3 bg-[rgba(107,67,36,0.06)] border-none border-t border-[rgba(160,130,100,0.12)] cursor-pointer font-sans text-[13px] text-[var(--accent)] text-center"
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

		<!-- Account pill — desktop -->
		<div class="hidden sm:block relative shrink-0" bind:this={accountWrapEl}>
			<button
				class="flex items-center gap-2 py-1.5 pl-2 pr-3 bg-[rgba(232,220,203,0.04)] border border-[var(--border)] rounded-full cursor-pointer hover:bg-[rgba(232,220,203,0.08)] transition-colors duration-150"
				onclick={() => (accountOpen = !accountOpen)}
			>
				<div class="w-6 h-6 rounded-full bg-gradient-to-br from-[#3a2a1f] to-[#1a0f08] border border-[var(--border-strong)] grid place-items-center">
					<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#c9a37a" stroke-width="2">
						<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
						<circle cx="12" cy="7" r="4" />
					</svg>
				</div>
				<span class="font-sans text-xs text-[var(--text-soft)] tracking-[0.02em]">{isLoggedIn ? 'Account' : 'Guest'}</span>
			</button>

			{#if accountOpen}
				<div class="absolute top-[calc(100%+6px)] right-0 min-w-[140px] bg-[var(--surface)] border border-[rgba(160,130,100,0.18)] rounded-[10px] shadow-[0_24px_60px_rgba(0,0,0,0.6)] overflow-hidden z-10">
					{#if isLoggedIn}
						<button
							class="w-full text-left px-3.5 py-2.5 bg-transparent border-none cursor-pointer font-sans text-sm text-[var(--text)] hover:bg-[rgba(107,67,36,0.12)]"
							onclick={logout}
						>Logout</button>
					{:else}
						<button
							class="w-full text-left px-3.5 py-2.5 bg-transparent border-none cursor-pointer font-sans text-sm text-[var(--text)] hover:bg-[rgba(107,67,36,0.12)]"
							onclick={() => { accountOpen = false; goto('/login'); }}
						>Login</button>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Hamburger — mobile -->
		<button
			class="sm:hidden flex items-center justify-center w-8 h-8 bg-transparent border-none cursor-pointer text-[var(--text-faint)] shrink-0"
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
		<nav class="sm:hidden border-t border-[var(--border-faint)] px-4 py-3 flex flex-col gap-1">
			<button
				class="w-full text-left px-3 py-2.5 rounded-md font-sans text-sm font-medium bg-transparent border-none cursor-pointer {activePage === 'home' ? 'text-[var(--text)]' : 'text-[var(--text-faint)]'}"
				onclick={() => { menuOpen = false; goto('/'); }}
			>Home</button>
			<button
				class="w-full text-left px-3 py-2.5 rounded-md font-sans text-sm font-medium bg-transparent border-none cursor-pointer {activePage === 'browse' ? 'text-[var(--text)]' : 'text-[var(--text-faint)]'}"
				onclick={() => { menuOpen = false; goto('/search'); }}
			>Browse</button>
			{#if isLoggedIn}
				<button
					class="w-full text-left px-3 py-2.5 rounded-md font-sans text-sm font-medium bg-transparent border-none cursor-pointer text-[var(--text-faint)]"
					onclick={() => { menuOpen = false; logout(); }}
				>Logout</button>
			{:else}
				<button
					class="w-full text-left px-3 py-2.5 rounded-md font-sans text-sm font-medium bg-transparent border-none cursor-pointer text-[var(--text-faint)]"
					onclick={() => { menuOpen = false; goto('/login'); }}
				>Login</button>
			{/if}
		</nav>
	{/if}
</header>
