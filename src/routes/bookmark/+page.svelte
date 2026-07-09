<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { PageData } from './$types';
	import type { BookmarkItem, MalSyncResult, MalListEntry } from '$lib/types';
	import BookmarkCard from '$lib/components/BookmarkCard.svelte';
	import RateLimitNotice from '$lib/components/RateLimitNotice.svelte';
	import { getMalOverride, getCachedMalId, cacheMalId } from '$lib/api';
	import { showToast } from '$lib/stores/toast.svelte';

	let { data }: { data: PageData } = $props();
	let removingIds = $state(new Set<number>());

	let syncing = $state(false);
	let syncDone = $state(0);
	let syncTotal = $state(0);

	async function massSyncToMal() {
		if (syncing) return;
		syncing = true;
		syncDone = 0;
		syncTotal = 0;

		try {
			const [bookmarksRes, listRes] = await Promise.all([
				fetch('/api/bookmarks'),
				fetch('/api/mal/list'),
			]);
			if (!bookmarksRes.ok) throw new Error(`bookmarks fetch failed: ${bookmarksRes.status}`);
			if (listRes.status === 401) {
				showToast('MAL session expired — reconnect in the account menu.');
				return;
			}
			if (!listRes.ok) throw new Error(`MAL list fetch failed: ${listRes.status}`);
			const items: BookmarkItem[] = await bookmarksRes.json();
			const listEntries: MalListEntry[] = await listRes.json();
			const malList = new Map(listEntries.map((e) => [e.malId, e]));
			syncTotal = items.length;
			if (items.length === 0) {
				showToast('No bookmarks to sync.');
				return;
			}

			let synced = 0;
			let noMatch = 0;
			let failed = 0;
			let rateLimited = 0;
			let skipped = 0;
			let sessionExpired = false;

			// Diff against the MAL list first: anything already up to date is settled
			// locally with zero requests. Only real changes and unknown mappings go out.
			const queue: { item: BookmarkItem; attempts: number }[] = [];
			for (const item of items) {
				const override = getMalOverride(item.mangaSlug);
				// User marked "not on MAL" — settle without syncing.
				if (override?.malId === null) {
					skipped++;
					syncDone++;
					continue;
				}
				const knownId = override?.malId ?? getCachedMalId(item.mangaSlug);
				const entry = knownId !== null ? malList.get(knownId) : undefined;
				if (entry) {
					const chapter = item.viewedChapter ? Math.floor(item.viewedChapter.number) : 0;
					// Progress already there, or on the list in any status for unread items.
					if (chapter < 1 || entry.chaptersRead >= chapter) {
						synced++;
						syncDone++;
						continue;
					}
				}
				queue.push({ item, attempts: 0 });
			}

			const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
			const MAX_ATTEMPTS = 4;
			// When any request gets a 429, all workers pause until this timestamp.
			let pauseUntil = 0;
			const worker = async () => {
				while (queue.length > 0 && !sessionExpired) {
					const wait = pauseUntil - Date.now();
					if (wait > 0) {
						await sleep(wait);
						continue;
					}
					const entry = queue.shift();
					if (!entry) break;
					const { item } = entry;
					try {
						const override = getMalOverride(item.mangaSlug);
						const cachedId = override ? null : getCachedMalId(item.mangaSlug);
						const chapter = item.viewedChapter ? Math.floor(item.viewedChapter.number) : 0;
						const r = await fetch('/api/mal/sync', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								slug: item.mangaSlug,
								title: item.title,
								...(override ? { malId: override.malId, trusted: true } : {}),
								...(cachedId ? { malId: cachedId } : {}),
								...(chapter >= 1 ? { chapter } : { planToRead: true }),
							}),
						});
						if (r.status === 401) {
							sessionExpired = true;
							return;
						}
						if (r.status === 429) {
							entry.attempts++;
							if (entry.attempts >= MAX_ATTEMPTS) {
								rateLimited++;
								syncDone++;
								continue;
							}
							// Exponential backoff shared by all workers, then retry the item.
							pauseUntil = Date.now() + Math.min(15000, 2000 * 2 ** entry.attempts);
							queue.push(entry);
							continue;
						}
						if (!r.ok) throw new Error(`sync failed: ${r.status}`);
						const result: MalSyncResult = await r.json();
						if (result.synced) {
							synced++;
							if (result.malId) cacheMalId(item.mangaSlug, result.malId);
						} else {
							noMatch++; // unmapped or suspect oneshot mapping
						}
						syncDone++;
					} catch (err) {
						console.warn(`[mal-mass-sync] "${item.mangaSlug}" failed`, err);
						failed++;
						syncDone++;
					}
					await sleep(150);
				}
			};
			await Promise.all(Array.from({ length: 2 }, worker));

			if (sessionExpired) {
				showToast('MAL session expired — reconnect in the account menu.');
				return;
			}
			const parts = [`${synced} synced`];
			if (noMatch > 0) parts.push(`${noMatch} no MAL match`);
			if (skipped > 0) parts.push(`${skipped} skipped (not on MAL)`);
			if (rateLimited > 0) parts.push(`${rateLimited} rate-limited (run again in a minute)`);
			if (failed > 0) parts.push(`${failed} failed`);
			showToast(`MAL sync: ${parts.join(' · ')}`);
		} catch (err) {
			console.warn('[mal-mass-sync] failed', err);
			showToast('MAL sync failed — could not load bookmarks or MAL list.');
		} finally {
			syncing = false;
		}
	}
</script>

<svelte:head><title>Bookmarks · MangaBet</title></svelte:head>

<div class="max-w-[1400px] mx-auto px-4 sm:px-8 pt-9 pb-24">
	<div class="mb-9">
		<div class="font-mono text-[11px] text-[var(--text-faint)] tracking-[0.18em] uppercase mb-2.5">
			My library
		</div>
		<h1 class="font-serif text-3xl sm:text-[44px] font-semibold text-[var(--text)] m-0 tracking-[-0.02em]">
			Bookmarks
		</h1>
		{#if !data.rateLimited}
			<div class="font-sans text-sm text-[var(--text-faint)] mt-2">
				{data.bookmarks.totalStories} {data.bookmarks.totalStories === 1 ? 'title' : 'titles'} saved
			</div>
			{#if page.data.malConnected && data.bookmarks.totalStories > 0}
				<button
					class="inline-flex items-center gap-2 mt-4 px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg font-sans text-sm text-[var(--text-soft)] cursor-pointer hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-colors duration-150 disabled:opacity-60 disabled:cursor-wait"
					disabled={syncing}
					onclick={massSyncToMal}
				>
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						class={syncing ? 'animate-spin' : ''}
					>
						<path d="M21 12a9 9 0 1 1-2.64-6.36" />
						<polyline points="21 3 21 9 15 9" />
					</svg>
					{syncing
						? `Syncing${syncTotal > 0 ? ` ${syncDone}/${syncTotal}` : ''}…`
						: 'Sync all to MAL'}
				</button>
			{/if}
		{/if}
	</div>

	{#if data.rateLimited}
		<RateLimitNotice />
	{:else if data.bookmarks.items.length === 0}
		<div class="py-20 text-center font-serif text-2xl text-[var(--text-faint)]">
			{data.bookmarks.page > 1 ? 'No bookmarks on this page.' : 'No bookmarks yet.'}
		</div>
	{:else}
		{#key data.bookmarks.page}
			<div class="flex flex-col gap-3 max-w-[760px] mx-auto">
				{#each data.bookmarks.items as b (b.mangaId)}
					{#if !removingIds.has(b.mangaId)}
						<BookmarkCard
							bookmark={b}
							onclick={() => goto(`/manga/${b.mangaSlug}/${b.mangaId}`)}
							onRemoveStart={() => removingIds.add(b.mangaId)}
							onRemoveError={() => removingIds.delete(b.mangaId)}
						/>
					{/if}
				{/each}
			</div>
		{/key}
	{/if}

	{#if !data.rateLimited && data.bookmarks.totalPages > 1}
		<div class="mt-12 flex items-center justify-center gap-3">
			{#if data.bookmarks.page > 1}
				<a
					href="/bookmark?page={data.bookmarks.page - 1}"
					class="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg font-sans text-sm text-[var(--text-soft)] hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-colors duration-150"
				>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="15 18 9 12 15 6" />
					</svg>
					Previous
				</a>
			{/if}

			<span class="font-mono text-[11px] text-[var(--text-faint)] tracking-[0.12em] px-2">
				PAGE {data.bookmarks.page} / {data.bookmarks.totalPages}
			</span>

			{#if data.bookmarks.page < data.bookmarks.totalPages}
				<a
					href="/bookmark?page={data.bookmarks.page + 1}"
					class="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg font-sans text-sm text-[var(--text-soft)] hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-colors duration-150"
				>
					Next
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="9 18 15 12 9 6" />
					</svg>
				</a>
			{/if}
		</div>
	{/if}
</div>
