<script lang="ts">
	import type { Chapter } from '$lib/types';
	import { fmtDate } from '$lib/data';

	let { ch, isLast = false, onclick }: { ch: Chapter; isLast?: boolean; onclick: () => void } =
		$props();
</script>

<button
	class="flex items-center gap-5 px-5 py-4 bg-transparent border-none cursor-pointer text-left transition-colors duration-150 w-full hover:bg-[rgba(201,163,122,0.06)] {isLast
		? ''
		: 'border-b border-[rgba(160,130,100,0.08)]'}"
	{onclick}
>
	<div class="w-12 shrink-0 font-mono text-xs font-medium text-[var(--accent)]">
		#{ch.number.toString().padStart(3, '0')}
	</div>
	<div class="flex-1 min-w-0">
		<div class="font-serif text-base font-medium text-[var(--text)] leading-[1.3]">{ch.title}</div>
		<div class="font-sans text-xs text-[var(--text-faint)] mt-1 flex items-center gap-2 flex-wrap">
			<span>{ch.pages} pages</span>
			<span class="w-0.5 h-0.5 rounded-full bg-[var(--text-quiet)] shrink-0"></span>
			<span>{fmtDate(ch.date)}</span>
			{#if ch.isNew}
				<span class="px-1.5 py-0.5 bg-[rgba(201,163,122,0.18)] rounded-[3px] font-mono text-[10px] text-[var(--accent)] tracking-[0.06em]">NEW</span>
			{/if}
		</div>
	</div>
	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-quiet)" stroke-width="2" class="shrink-0">
		<polyline points="9 18 15 12 9 6" />
	</svg>
</button>
