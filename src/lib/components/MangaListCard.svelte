<script lang="ts">
	import type { MangaListItemDTO } from '$lib/types';
	import { proxyImage } from '$lib/api';

	let {
		manga,
		href,
	}: {
		manga: MangaListItemDTO;
		href: string;
	} = $props();
</script>

<div
	class="group flex gap-4 w-full bg-surface hover:bg-fg/4 border border-edge/15 hover:border-edge/25 rounded-lg p-3 sm:p-4 transition-colors duration-150 relative"
>
	<a class="absolute inset-0" aria-label={manga.name} {href}></a>

	<div class="w-[72px] sm:w-[88px] aspect-[2/3] shrink-0 overflow-hidden rounded-md relative bg-surface-2 z-[1] pointer-events-none">
		<img class="absolute inset-0 w-full h-full object-fill" src={proxyImage(manga.thumb)} alt={manga.name} loading="lazy" />
	</div>

	<div class="flex-1 min-w-0 flex flex-col gap-1.5 py-0.5 z-[1] pointer-events-none">
		<div class="font-serif text-[15px] sm:text-base font-medium text-fg leading-[1.25] line-clamp-2">{manga.name}</div>
		{#if manga.chapterLatest}
			<div class="font-mono text-[11px] text-accent mt-auto">latest · {manga.chapterLatest}</div>
		{/if}
	</div>
</div>
