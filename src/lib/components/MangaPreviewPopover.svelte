<script lang="ts">
	import { fade } from 'svelte/transition';
	import type { MangaPreviewDTO, MangaPreviewTarget } from '$lib/types';
	import { loadMangaPreview } from '$lib/mangaPreview';
	import { fmtDate, fmtViews } from '$lib/utils';

	const WIDTH = 296;
	const CURSOR_GAP = 16;
	const VIEWPORT_MARGIN = 8;

	let { target }: { target: MangaPreviewTarget | null } = $props();

	let preview = $state<MangaPreviewDTO | null>(null);
	let failed = $state(false);
	let viewportWidth = $state(0);
	let viewportHeight = $state(0);
	let height = $state(0);

	let slug = $derived(target?.slug ?? null);

	$effect(() => {
		preview = null;
		failed = false;
		if (!slug) return;
		let stale = false;
		loadMangaPreview(slug)
			.then((loaded) => {
				if (!stale) preview = loaded;
			})
			.catch(() => {
				if (!stale) failed = true;
			});
		return () => (stale = true);
	});

	let left = $derived.by(() => {
		if (!target) return 0;
		const right = target.x + CURSOR_GAP;
		const fitsRight = right + WIDTH <= viewportWidth - VIEWPORT_MARGIN;
		return Math.max(VIEWPORT_MARGIN, fitsRight ? right : target.x - CURSOR_GAP - WIDTH);
	});

	let top = $derived.by(() => {
		if (!target) return 0;
		const below = target.y + CURSOR_GAP;
		const fitsBelow = below + height <= viewportHeight - VIEWPORT_MARGIN;
		return Math.max(VIEWPORT_MARGIN, fitsBelow ? below : target.y - CURSOR_GAP - height);
	});

	let stats = $derived([
		{ label: 'Rating', value: preview && String(preview.rating), star: true },
		{ label: 'Chapters', value: preview && String(preview.chapterCount) },
		{ label: 'Readers', value: preview && fmtViews(preview.views) },
		{ label: 'Updated', value: preview && fmtDate(new Date(preview.lastUpdated)) },
		{ label: 'Status', value: preview?.status, accent: preview?.status === 'Ongoing' },
	]);
</script>

<svelte:window bind:innerWidth={viewportWidth} bind:innerHeight={viewportHeight} />

{#if target && !failed}
	<div
		class="fixed top-0 left-0 z-50 pointer-events-none rounded-lg border border-edge/20 bg-surface-2 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
		style="width: {WIDTH}px; transform: translate({left}px, {top}px);"
		bind:offsetHeight={height}
		transition:fade={{ duration: 120 }}
	>
		<dl class="grid grid-cols-3 gap-x-4 gap-y-3.5 m-0">
			{#each stats as stat}
				<div class="min-w-0">
					<dt class="font-mono text-[10px] text-fg-soft tracking-[0.14em] uppercase mb-1">{stat.label}</dt>
					<dd class="m-0 font-serif text-base font-medium truncate {stat.accent ? 'text-accent' : 'text-fg'}">
						{#if stat.value}
							{#if stat.star}
								<svg width="12" height="12" viewBox="0 0 24 24" fill="#c9a37a" class="inline align-baseline mr-1">
									<path d="M12 2l3 7 7 .6-5.3 4.7L18 22l-6-3.7L6 22l1.3-7.7L2 9.6 9 9z" />
								</svg>
							{/if}
							{stat.value}
						{:else}
							<span class="block h-6 w-10 rounded-sm bg-fg/10 animate-pulse"></span>
						{/if}
					</dd>
				</div>
			{/each}
		</dl>
	</div>
{/if}
