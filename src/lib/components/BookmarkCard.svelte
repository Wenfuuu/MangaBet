<script lang="ts">
	import type { BookmarkItem } from '$lib/types';
	import { proxyImage } from '$lib/api';

	let { bookmark, onclick }: { bookmark: BookmarkItem; onclick: () => void } = $props();

	let unreadCount = $derived(
		bookmark.viewedChapter && bookmark.currentChapter
			? Math.max(0, Math.round(bookmark.currentChapter.number - bookmark.viewedChapter.number))
			: 0,
	);
</script>

<button
	class="flex gap-4 w-full bg-[var(--surface)] hover:bg-[rgba(232,220,203,0.04)] border border-[var(--border)] hover:border-[var(--border-strong)] rounded-lg p-3 sm:p-4 cursor-pointer text-left transition-colors duration-150"
	{onclick}
>
	<div class="w-[72px] sm:w-[88px] aspect-[2/3] shrink-0 overflow-hidden rounded-md relative bg-[var(--surface-2,rgba(11,9,8,0.5))]">
		<img
			class="absolute inset-0 w-full h-full object-cover"
			src={proxyImage(bookmark.thumb)}
			alt={bookmark.title}
			loading="lazy"
		/>
		{#if unreadCount > 0}
			<span class="absolute top-1 right-1 px-1.5 py-0.5 rounded-full bg-[rgba(201,163,122,0.92)] text-[#1a0f08] font-mono text-[10px] font-semibold tracking-wide">
				+{unreadCount}
			</span>
		{/if}
	</div>
	<div class="flex-1 min-w-0 flex flex-col gap-1.5 py-0.5">
		<div class="font-serif text-[15px] sm:text-base font-medium text-[var(--text)] leading-[1.25] line-clamp-2">{bookmark.title}</div>
		<div class="font-mono text-[11px] text-[var(--text-soft)] flex flex-wrap gap-x-3 gap-y-0.5">
			{#if bookmark.viewedChapter}<span>read · ch. {bookmark.viewedChapter.number}</span>{/if}
			{#if bookmark.currentChapter}<span class="text-[var(--accent)]">latest · ch. {bookmark.currentChapter.number}</span>{/if}
		</div>
		<div class="font-sans text-xs text-[var(--text-faint)] mt-auto">Updated {bookmark.lastUpdated}</div>
	</div>
</button>
