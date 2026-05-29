<script lang="ts">
	import type { MangaSearchDTO } from '$lib/types';
	import { proxyImage } from '$lib/api';

	let { manga, onclick }: { manga: MangaSearchDTO; onclick: () => void } = $props();
</script>

<button class="group bg-transparent border-none p-0 cursor-pointer text-left flex flex-col gap-2.5 w-full" {onclick}>
	<div class="aspect-[2/3] overflow-hidden rounded-md relative bg-[var(--surface)] transition-transform duration-200 group-hover:-translate-y-1">
		<img class="absolute inset-0 w-full h-full object-fill" src={proxyImage(manga.thumb)} alt={manga.name} loading="lazy" />
	</div>
	<div class="font-serif text-[15px] font-medium text-[var(--text)] leading-[1.25] tracking-[-0.005em] line-clamp-2">{manga.name}</div>
	<div class="font-sans text-xs text-[var(--text-faint)] -mt-1 truncate">{manga.author}</div>
	<div class="font-mono text-[11px] text-[var(--text-faint)]">{manga.chapterLatest}</div>
</button>
