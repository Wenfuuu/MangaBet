<script lang="ts">
	import type { MangaListItemDTO } from '$lib/types';
	import { proxyImage } from '$lib/api';

	let {
		manga,
		onclick,
	}: {
		manga: MangaListItemDTO;
		onclick: () => void;
	} = $props();
</script>

<div
	class="group flex gap-4 w-full bg-[var(--surface)] hover:bg-[rgba(232,220,203,0.04)] border border-[var(--border)] hover:border-[var(--border-strong)] rounded-lg p-3 sm:p-4 transition-colors duration-150 relative"
>
	<button class="absolute inset-0 cursor-pointer bg-transparent border-none p-0" aria-label={manga.name} {onclick}></button>

	<div class="w-[72px] sm:w-[88px] aspect-[2/3] shrink-0 overflow-hidden rounded-md relative bg-[var(--surface-2,rgba(11,9,8,0.5))] z-[1] pointer-events-none">
		<img class="absolute inset-0 w-full h-full object-fill" src={proxyImage(manga.thumb)} alt={manga.name} loading="lazy" />
	</div>

	<div class="flex-1 min-w-0 flex flex-col gap-1.5 py-0.5 z-[1] pointer-events-none">
		<div class="font-serif text-[15px] sm:text-base font-medium text-[var(--text)] leading-[1.25] line-clamp-2">{manga.name}</div>
		{#if manga.chapterLatest}
			<div class="font-mono text-[11px] text-[var(--accent)] mt-auto">latest · {manga.chapterLatest}</div>
		{/if}
	</div>
</div>
