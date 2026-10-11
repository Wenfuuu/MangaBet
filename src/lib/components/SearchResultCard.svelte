<script lang="ts">
	import type { MangaSearchDTO } from '$lib/types';
	import { proxyImage } from '$lib/api';

	const HOVER_INTENT_MS = 250;

	// onclick is a side effect only — navigation is the anchor's job, so it must not preventDefault.
	let {
		manga,
		href,
		onclick,
		onpreview,
	}: {
		manga: MangaSearchDTO;
		href: string;
		onclick?: () => void;
		onpreview?: (point: { x: number; y: number } | null) => void;
	} = $props();

	let previewOpen = false;
	let pointer = { x: 0, y: 0 };
	let intentTimer: ReturnType<typeof setTimeout> | undefined;

	function onPointerEnter(e: PointerEvent) {
		if (e.pointerType !== 'mouse') return;
		pointer = { x: e.clientX, y: e.clientY };
		intentTimer = setTimeout(() => {
			previewOpen = true;
			onpreview?.(pointer);
		}, HOVER_INTENT_MS);
	}

	function onPointerMove(e: PointerEvent) {
		pointer = { x: e.clientX, y: e.clientY };
		if (previewOpen) onpreview?.(pointer);
	}

	function onPointerLeave() {
		clearTimeout(intentTimer);
		previewOpen = false;
		onpreview?.(null);
	}

	$effect(() => () => {
		clearTimeout(intentTimer);
		onpreview?.(null);
	});
</script>

<a
	class="group text-left flex flex-col gap-2.5 w-full"
	{href}
	{onclick}
	onpointerenter={onPointerEnter}
	onpointermove={onPointerMove}
	onpointerleave={onPointerLeave}
>
	<div class="aspect-[2/3] overflow-hidden rounded-md relative bg-surface transition-transform duration-200 group-hover:-translate-y-1">
		<img class="absolute inset-0 w-full h-full object-fill" src={proxyImage(manga.thumb)} alt={manga.name} loading="lazy" />
	</div>
	<div class="font-serif text-[15px] font-medium text-fg leading-[1.25] tracking-[-0.005em] line-clamp-2">{manga.name}</div>
	<div class="font-sans text-xs text-fg-faint -mt-1 truncate">{manga.author}</div>
	<div class="font-mono text-[11px] text-fg-faint">{manga.chapterLatest}</div>
</a>
