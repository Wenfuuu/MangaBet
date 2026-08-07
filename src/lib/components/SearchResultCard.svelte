<script lang="ts">
	import type { MangaSearchDTO } from '$lib/types';
	import { proxyImage } from '$lib/api';

	// onclick is a side effect only — navigation is the anchor's job, so it must not preventDefault.
	let { manga, href, onclick }: { manga: MangaSearchDTO; href: string; onclick?: () => void } =
		$props();
</script>

<a class="group text-left flex flex-col gap-2.5 w-full" {href} {onclick}>
	<div class="aspect-[2/3] overflow-hidden rounded-md relative bg-surface transition-transform duration-200 group-hover:-translate-y-1">
		<img class="absolute inset-0 w-full h-full object-fill" src={proxyImage(manga.thumb)} alt={manga.name} loading="lazy" />
	</div>
	<div class="font-serif text-[15px] font-medium text-fg leading-[1.25] tracking-[-0.005em] line-clamp-2">{manga.name}</div>
	<div class="font-sans text-xs text-fg-faint -mt-1 truncate">{manga.author}</div>
	<div class="font-mono text-[11px] text-fg-faint">{manga.chapterLatest}</div>
</a>
