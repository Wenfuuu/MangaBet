<script lang="ts">
	import { page } from '$app/state';
	import type { MalMappingInfo, MalSearchCandidate, MalOverride } from '$lib/types';
	import { getMalOverride, setMalOverride, clearMalOverride } from '$lib/api';
	import { showToast } from '$lib/stores/toast.svelte';

	let { slug, mangaName }: { slug: string; mangaName: string } = $props();

	let malConnected = $derived(Boolean(page.data?.malConnected));

	let override = $state<MalOverride | null>(null);
	let autoMapping = $state<MalMappingInfo | null>(null);
	let loading = $state(true);

	// An override — of any kind — fully replaces the auto mapping. A cleared one
	// (malId null) therefore suppresses the auto match rather than falling through.
	let effectiveId = $derived(override ? override.malId : (autoMapping?.malId ?? null));
	let effectiveTitle = $derived(override ? override.title : (autoMapping?.title ?? null));
	let cleared = $derived(override !== null && override.malId === null);

	$effect(() => {
		override = getMalOverride(slug);
		loading = true;
		autoMapping = null;
		fetch(`/api/mal/resolve?slug=${encodeURIComponent(slug)}&title=${encodeURIComponent(mangaName)}`)
			.then((res) => (res.ok ? res.json() : null))
			.then((info) => (autoMapping = info))
			.catch(() => (autoMapping = null))
			.finally(() => (loading = false));
	});

	// --- picker modal ---
	let pickerOpen = $state(false);
	let query = $state('');
	let results = $state<MalSearchCandidate[]>([]);
	let searching = $state(false);
	let selected = $state<MalSearchCandidate | null>(null);
	let markOldCompleted = $state(false);
	let saving = $state(false);
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;

	// MAL search rejects queries over 64 chars, so prefill with a word-boundary
	// truncation — the box then shows exactly what is being searched.
	const MAL_QUERY_MAX = 64;
	function clampQuery(t: string): string {
		if (t.length <= MAL_QUERY_MAX) return t;
		let q = t.slice(0, MAL_QUERY_MAX);
		const lastSpace = q.lastIndexOf(' ');
		if (lastSpace > 20) q = q.slice(0, lastSpace);
		return q;
	}

	function openPicker() {
		query = clampQuery(mangaName);
		results = [];
		selected = null;
		markOldCompleted = false;
		pickerOpen = true;
	}

	$effect(() => {
		if (!pickerOpen) return;
		const q = query;
		clearTimeout(debounceTimer);
		if (q.trim().length < 3) {
			results = [];
			return;
		}
		searching = true;
		debounceTimer = setTimeout(async () => {
			try {
				const res = await fetch(`/api/mal/search?q=${encodeURIComponent(q.trim())}`);
				results = res.ok ? await res.json() : [];
			} catch {
				results = [];
			} finally {
				searching = false;
			}
		}, 300);
		return () => clearTimeout(debounceTimer);
	});

	function isOneshot(c: MalSearchCandidate): boolean {
		return c.mediaType === 'one_shot' || c.numChapters === 1;
	}

	function selectCandidate(c: MalSearchCandidate) {
		selected = c;
		// Pre-check "complete the old entry" only when we can tell it's a oneshot.
		const old = effectiveId !== null ? results.find((r) => r.id === effectiveId) : undefined;
		markOldCompleted = malConnected && Boolean(old && old.id !== c.id && isOneshot(old));
	}

	async function save() {
		if (!selected) return;
		saving = true;
		const oldId = effectiveId;
		setMalOverride(slug, { malId: selected.id, title: selected.title });
		override = { malId: selected.id, title: selected.title };

		if (markOldCompleted && oldId !== null && oldId !== selected.id) {
			try {
				const res = await fetch('/api/mal/sync', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ malId: oldId, chapter: 1, trusted: true }),
				});
				if (!res.ok) throw new Error(`${res.status}`);
				showToast(`MAL entry updated — previous entry marked completed.`);
			} catch {
				showToast('MAL entry updated, but completing the previous entry failed.');
			}
		} else {
			showToast('MAL entry updated.');
		}
		saving = false;
		pickerOpen = false;
	}

	function resetToAuto() {
		clearMalOverride(slug);
		override = null;
		showToast('MAL mapping reset to automatic.');
	}

	// Mark "no MAL entry" — stops the wrong auto-match (e.g. a fuzzy fallback)
	// from syncing. Persisted as a null-id override so auto never re-applies.
	function clearEntry() {
		setMalOverride(slug, { malId: null, title: null });
		override = { malId: null, title: null };
		showToast('MAL entry cleared — this manga won’t sync.');
	}
</script>

<div class="mt-6 inline-flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 bg-[rgba(232,220,203,0.03)] border border-[rgba(160,130,100,0.15)] rounded-lg">
	<span class="font-mono text-[10px] text-[var(--text-faint)] tracking-[0.14em] uppercase">MyAnimeList</span>
	{#if loading && !override}
		<span class="font-sans text-sm text-[var(--text-faint)]">Checking…</span>
	{:else if effectiveId !== null}
		<a
			class="font-sans text-sm text-[var(--accent)] hover:underline"
			href="https://myanimelist.net/manga/{effectiveId}"
			target="_blank"
			rel="noopener noreferrer"
		>{effectiveTitle ?? `#${effectiveId}`} ↗</a>
		{#if override}
			<span class="font-mono text-[10px] text-[var(--text-faint)] tracking-[0.1em] uppercase px-1.5 py-0.5 border border-[rgba(201,163,122,0.3)] rounded">corrected</span>
		{/if}
	{:else if cleared}
		<span class="font-sans text-sm text-[var(--text-faint)]">No entry — won’t sync</span>
	{:else}
		<span class="font-sans text-sm text-[var(--text-faint)]">No entry linked</span>
	{/if}
	<button
		class="font-sans text-xs text-[var(--text-soft)] bg-transparent border border-[rgba(160,130,100,0.25)] rounded-md px-2.5 py-1 cursor-pointer hover:text-[var(--text)] hover:border-[rgba(160,130,100,0.45)]"
		onclick={openPicker}
	>{effectiveId !== null ? 'Wrong entry?' : 'Link entry'}</button>
	{#if effectiveId !== null}
		<button
			class="font-sans text-xs text-[var(--text-soft)] bg-transparent border border-[rgba(160,130,100,0.25)] rounded-md px-2.5 py-1 cursor-pointer hover:text-[var(--text)] hover:border-[rgba(160,130,100,0.45)]"
			onclick={clearEntry}
		>Not on MAL</button>
	{/if}
	{#if override}
		<button
			class="font-sans text-xs text-[var(--text-faint)] bg-transparent border-none cursor-pointer hover:text-[var(--text-soft)] underline"
			onclick={resetToAuto}
		>reset</button>
	{/if}
	{#if !malConnected && effectiveId !== null}
		<span class="font-sans text-xs text-[var(--text-faint)]">— connect MAL in the account menu to auto-sync progress</span>
	{/if}
</div>

{#if pickerOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 bg-[rgba(11,9,8,0.8)] backdrop-blur-sm grid place-items-center p-4"
		onclick={(e) => { if (e.target === e.currentTarget) pickerOpen = false; }}
	>
		<div class="w-full max-w-[520px] max-h-[80vh] flex flex-col bg-[#0f0c0a] border border-[var(--border)] rounded-[10px] shadow-[0_24px_60px_rgba(0,0,0,0.6)] overflow-hidden">
			<div class="px-5 pt-4 pb-3 border-b border-[var(--border-faint)]">
				<div class="font-serif text-lg text-[var(--text)]">Pick the correct MAL entry</div>
				<div class="font-sans text-xs text-[var(--text-faint)] mt-0.5">Progress for this manga will sync to the entry you choose.</div>
				<input
					type="text"
					class="w-full mt-3 px-3 py-2 bg-[rgba(232,220,203,0.04)] border border-[rgba(160,130,100,0.2)] rounded-md font-sans text-sm text-[var(--text)] outline-none focus:border-[rgba(201,163,122,0.5)]"
					placeholder="Search MyAnimeList…"
					bind:value={query}
				/>
			</div>

			<div class="flex-1 min-h-0 overflow-y-auto">
				{#if searching}
					<div class="px-5 py-6 font-sans text-sm text-[var(--text-faint)] text-center">Searching…</div>
				{:else if results.length === 0}
					<div class="px-5 py-6 font-sans text-sm text-[var(--text-faint)] text-center">
						{query.trim().length < 3 ? 'Type at least 3 characters.' : 'No results.'}
					</div>
				{:else}
					{#each results as c (c.id)}
						<button
							class="w-full flex items-center gap-3 px-5 py-2.5 border-none border-b border-[rgba(160,130,100,0.06)] cursor-pointer text-left transition-colors duration-[120ms] {selected?.id === c.id ? 'bg-[rgba(107,67,36,0.28)]' : 'bg-transparent hover:bg-[rgba(107,67,36,0.12)]'}"
							onclick={() => selectCandidate(c)}
						>
							<div class="w-9 h-13 shrink-0 rounded overflow-hidden bg-[rgba(232,220,203,0.05)]" style="height: 52px;">
								{#if c.image}
									<img src={c.image} alt="" class="w-full h-full object-cover" loading="lazy" />
								{/if}
							</div>
							<div class="min-w-0 flex-1">
								<div class="font-sans text-sm text-[var(--text)] truncate">{c.title}</div>
								<div class="font-mono text-[10px] text-[var(--text-faint)] tracking-[0.06em] mt-0.5">
									#{c.id}{c.year ? ` · ${c.year}` : ''} · {isOneshot(c) ? 'ONESHOT' : c.mediaType.toUpperCase()}{c.numChapters > 0 ? ` · ${c.numChapters} ch` : ''}
								</div>
							</div>
							{#if c.id === effectiveId}
								<span class="font-mono text-[9px] text-[var(--accent)] tracking-[0.1em] uppercase shrink-0">current</span>
							{/if}
						</button>
					{/each}
				{/if}
			</div>

			<div class="px-5 py-4 border-t border-[var(--border-faint)] flex flex-col gap-3">
				{#if malConnected && selected && effectiveId !== null && selected.id !== effectiveId}
					<label class="flex items-start gap-2 font-sans text-xs text-[var(--text-soft)] cursor-pointer select-none">
						<input type="checkbox" bind:checked={markOldCompleted} class="mt-0.5 accent-[var(--accent)]" />
						<span>Also mark the previous entry (#{effectiveId}) as <strong>Completed</strong> on my list — useful when it's the oneshot version.</span>
					</label>
				{/if}
				<div class="flex justify-end gap-2">
					<button
						class="px-4 py-2 bg-transparent border border-[rgba(160,130,100,0.25)] rounded-md font-sans text-sm text-[var(--text-soft)] cursor-pointer"
						onclick={() => (pickerOpen = false)}
					>Cancel</button>
					<button
						class="px-4 py-2 bg-[var(--accent)] text-[var(--accent-on)] border-none rounded-md font-sans text-sm font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
						disabled={!selected || saving}
						onclick={save}
					>{saving ? 'Saving…' : 'Use this entry'}</button>
				</div>
			</div>
		</div>
	</div>
{/if}
