<script lang="ts">
	import type { MangaSearchDTO } from '$lib/types';
	import { proxyImage } from '$lib/api';

	let {
		manga,
		chapter,
		page,
		onclick,
	}: { manga: MangaSearchDTO; chapter: number; page: number; onclick: () => void } = $props();
</script>

<button
	class="flex gap-4 p-4 bg-[var(--surface)] border border-[var(--border-faint)] rounded-[10px] cursor-pointer text-left transition-all duration-200 w-full hover:bg-[var(--surface-2)] hover:border-[var(--border-strong)]"
	{onclick}
>
	<div class="w-[76px] h-[114px] shrink-0 rounded-[4px] overflow-hidden bg-[var(--surface)]">
		<img class="w-full h-full object-cover" src={proxyImage(manga.thumb)} alt={manga.name} loading="lazy" />
	</div>
	<div class="flex-1 flex flex-col justify-between min-w-0">
		<div>
			<div class="font-mono text-[10px] text-[var(--text-faint)] tracking-[0.12em] uppercase mb-1">
				Chapter {chapter} · Page {page}
			</div>
			<div class="font-serif text-[17px] font-medium text-[var(--text)] leading-[1.2] mb-1.5 truncate">{manga.name}</div>
			<div class="font-sans text-xs text-[var(--text-faint)]">{manga.author}</div>
		</div>
		<div class="font-mono text-[10px] text-[var(--text-faint)]">Resume reading →</div>
	</div>
</button>
