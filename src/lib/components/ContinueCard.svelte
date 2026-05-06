<script lang="ts">
	import type { Manga } from '$lib/types';
	import { COVER_PALETTES } from '$lib/data';

	let {
		manga,
		chapter,
		page,
		onclick,
	}: { manga: Manga; chapter: number; page: number; onclick: () => void } = $props();

	let progress = $derived(chapter / manga.chapters);
	let palette = $derived(COVER_PALETTES[manga.cover % COVER_PALETTES.length]);
</script>

<button
	class="flex gap-4 p-4 bg-[var(--surface)] border border-[var(--border-faint)] rounded-[10px] cursor-pointer text-left transition-all duration-200 w-full hover:bg-[var(--surface-2)] hover:border-[var(--border-strong)]"
	{onclick}
>
	<div
		class="w-[76px] h-[114px] shrink-0 rounded-[4px]"
		style="background: linear-gradient(160deg, {palette[0]}, {palette[1]}, {palette[2]});"
	></div>
	<div class="flex-1 flex flex-col justify-between min-w-0">
		<div>
			<div class="font-mono text-[10px] text-[var(--text-faint)] tracking-[0.12em] uppercase mb-1">
				Chapter {chapter} · Page {page}
			</div>
			<div class="font-serif text-[17px] font-medium text-[var(--text)] leading-[1.2] mb-1.5 truncate">{manga.title}</div>
			<div class="font-sans text-xs text-[var(--text-faint)]">{manga.author}</div>
		</div>
		<div>
			<div class="h-[3px] bg-[rgba(160,130,100,0.15)] rounded-[2px] overflow-hidden mb-1.5">
				<div class="h-full bg-[var(--accent)]" style="width: {progress * 100}%;"></div>
			</div>
			<div class="font-mono text-[10px] text-[var(--text-faint)]">Resume reading →</div>
		</div>
	</div>
</button>
