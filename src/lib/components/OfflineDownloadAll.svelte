<script lang="ts">
	import type { Chapter } from '$lib/types';
	import { cancelBatch, getBatch, saveAllOffline, savedCountForManga } from '$lib/stores/offline.svelte';

	let {
		mangaSlug,
		mangaId,
		mangaName,
		chapters,
	}: {
		mangaSlug: string;
		mangaId: string;
		mangaName: string;
		chapters: Chapter[];
	} = $props();

	let batch = $derived(getBatch());
	let running = $derived(batch?.mangaSlug === mangaSlug ? batch : null);
	// A batch elsewhere still blocks this one — they would contend for the same
	// upstream budget, which is the thing the pacing exists to protect.
	let blocked = $derived(!!batch && batch.mangaSlug !== mangaSlug);
	let remaining = $derived(chapters.length - savedCountForManga(mangaSlug));

	function start() {
		saveAllOffline({
			mangaSlug,
			mangaId,
			mangaName,
			chapters: chapters.map((ch) => ({ slug: ch.slug, number: ch.number, title: ch.title })),
		});
	}
</script>

{#if running}
	<div class="inline-flex items-center gap-2 shrink-0">
		<div class="inline-flex items-center gap-2 px-3 py-1.5 bg-accent/12 border border-accent/35 rounded-md font-sans text-xs text-accent">
			<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin">
				<path d="M21 12a9 9 0 1 1-9-9" />
			</svg>
			Saving {running.done + running.failed + 1} / {running.total}
		</div>
		<button
			class="px-3 py-1.5 bg-transparent border border-edge/20 rounded-md font-sans text-xs text-fg-soft cursor-pointer hover:text-fg transition-colors duration-150"
			onclick={cancelBatch}
		>
			Stop
		</button>
	</div>
{:else if remaining > 0}
	<button
		class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-transparent border border-edge/20 rounded-md font-sans text-xs text-fg-soft cursor-pointer hover:text-fg transition-colors duration-150 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
		disabled={blocked}
		title={blocked ? `Already saving ${batch?.mangaName}` : `Save ${remaining} chapters for offline reading`}
		onclick={start}
	>
		<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M12 3v11" />
			<polyline points="8 10 12 14 16 10" />
			<path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
		</svg>
		Download {remaining === chapters.length ? 'all' : remaining}
	</button>
{:else}
	<div class="inline-flex items-center gap-1.5 px-3 py-1.5 font-sans text-xs text-accent shrink-0">
		<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M21 12a9 9 0 1 1-9-9" />
			<polyline points="9 11 12 14 21 5" />
		</svg>
		All saved
	</div>
{/if}
