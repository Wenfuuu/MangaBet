<script lang="ts">
	import type { MangaSearchDTO } from '$lib/types';
	import { proxyImage } from '$lib/api';

	let {
		manga,
		chapterSlug,
		onclick,
		onRemove,
	}: {
		manga: MangaSearchDTO;
		chapterSlug: string;
		onclick: () => void;
		onRemove: () => void;
	} = $props();
</script>

<div
	class="relative flex gap-4 p-4 bg-[var(--surface)] border border-[var(--border-faint)] rounded-[10px] transition-all duration-200 w-full hover:bg-[var(--surface-2)] hover:border-[var(--border-strong)]"
>
	<button
		class="absolute inset-0 cursor-pointer bg-transparent border-none p-0"
		aria-label={manga.name}
		{onclick}
	></button>

	<div class="w-[76px] h-[114px] shrink-0 rounded-[4px] overflow-hidden bg-[var(--surface)] z-[1] pointer-events-none">
		<img class="w-full h-full object-fill" src={proxyImage(manga.thumb)} alt={manga.name} loading="lazy" />
	</div>
	<div class="flex-1 flex flex-col justify-between min-w-0 z-[1] pointer-events-none">
		<div>
			<div class="font-mono text-[10px] text-[var(--text-faint)] tracking-[0.12em] uppercase mb-1">
				Chapter {chapterSlug.replace('-', '.')}
			</div>
			<div class="font-serif text-[17px] font-medium text-[var(--text)] leading-[1.2] mb-1.5 truncate pr-8">{manga.name}</div>
			<div class="font-sans text-xs text-[var(--text-faint)]">{manga.author}</div>
		</div>
		<div class="font-mono text-[10px] text-[var(--text-faint)]">Resume reading →</div>
	</div>

	<button
		type="button"
		onclick={onRemove}
		aria-label="Remove from history"
		title="Remove from history"
		class="absolute top-2 right-2 z-[2] w-7 h-7 grid place-items-center rounded-md bg-transparent hover:bg-[rgba(180,70,60,0.18)] text-[var(--text-faint)] hover:text-[#e8a09b] focus:text-[#e8a09b] border-none cursor-pointer transition-colors duration-150"
	>
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<polyline points="3 6 5 6 21 6" />
			<path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
			<path d="M10 11v6M14 11v6" />
		</svg>
	</button>
</div>
