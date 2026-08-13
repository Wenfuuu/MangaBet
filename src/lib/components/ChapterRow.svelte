<script lang="ts">
	import type { Chapter } from '$lib/types';
	import { fmtDate } from '$lib/utils';
	import OfflineToggle from './OfflineToggle.svelte';

	let {
		ch,
		isLast = false,
		href,
		mangaSlug,
		mangaId,
		mangaName,
	}: {
		ch: Chapter;
		isLast?: boolean;
		href: string;
		mangaSlug: string;
		mangaId: string;
		mangaName: string;
	} = $props();
</script>

<div
	class="flex items-center gap-3 pr-4 transition-colors duration-150 hover:bg-accent/6 {isLast
		? ''
		: 'border-b border-edge/8'}"
>
	<a class="flex items-center gap-5 px-5 py-4 text-left flex-1 min-w-0" {href}>
		<div class="w-12 shrink-0 font-mono text-xs font-medium text-accent">
			#{ch.number}
		</div>
		<div class="flex-1 min-w-0">
			<div class="font-serif text-base font-medium text-fg leading-[1.3]">{ch.title}</div>
			<div class="font-sans text-xs text-fg-faint mt-1 flex items-center gap-2 flex-wrap">
				{#if ch.pages != null}
					<span>{ch.pages} pages</span>
					<span class="w-0.5 h-0.5 rounded-full bg-fg-quiet shrink-0"></span>
				{/if}
				<span>{fmtDate(ch.date)}</span>
				{#if ch.isNew}
					<span class="px-1.5 py-0.5 bg-accent/18 rounded-[3px] font-mono text-[10px] text-accent tracking-[0.06em]">NEW</span>
				{/if}
			</div>
		</div>
	</a>

	<OfflineToggle {mangaSlug} {mangaId} {mangaName} chapter={ch} />

	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-quiet)" stroke-width="2" class="shrink-0">
		<polyline points="9 18 15 12 9 6" />
	</svg>
</div>
