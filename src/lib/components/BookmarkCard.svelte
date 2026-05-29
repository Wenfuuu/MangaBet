<script lang="ts">
	import { enhance } from '$app/forms';
	import type { BookmarkItem } from '$lib/types';
	import { proxyImage } from '$lib/api';

	let {
		bookmark,
		onclick,
		onRemoveStart,
		onRemoveError,
	}: {
		bookmark: BookmarkItem;
		onclick: () => void;
		onRemoveStart?: () => void;
		onRemoveError?: () => void;
	} = $props();

	let unreadCount = $derived(
		bookmark.viewedChapter && bookmark.currentChapter
			? Math.max(0, Math.round(bookmark.currentChapter.number - bookmark.viewedChapter.number))
			: 0,
	);
</script>

<div
	class="group flex gap-4 w-full bg-[var(--surface)] hover:bg-[rgba(232,220,203,0.04)] border border-[var(--border)] hover:border-[var(--border-strong)] rounded-lg p-3 sm:p-4 transition-colors duration-150 relative"
>
	<button class="absolute inset-0 cursor-pointer bg-transparent border-none p-0" aria-label={bookmark.title} {onclick}></button>

	<div class="w-[72px] sm:w-[88px] aspect-[2/3] shrink-0 overflow-hidden rounded-md relative bg-[var(--surface-2,rgba(11,9,8,0.5))] z-[1] pointer-events-none">
		<img class="absolute inset-0 w-full h-full object-fill" src={proxyImage(bookmark.thumb)} alt={bookmark.title} loading="lazy" />
		{#if unreadCount > 0}
			<span class="absolute top-1 right-1 px-1.5 py-0.5 rounded-full bg-[rgba(201,163,122,0.92)] text-[#1a0f08] font-mono text-[10px] font-semibold tracking-wide">
				+{unreadCount}
			</span>
		{/if}
	</div>

	<div class="flex-1 min-w-0 flex flex-col gap-1.5 py-0.5 z-[1] pointer-events-none">
		<div class="font-serif text-[15px] sm:text-base font-medium text-[var(--text)] leading-[1.25] line-clamp-2 pr-8">{bookmark.title}</div>
		<div class="font-mono text-[11px] text-[var(--text-soft)] flex flex-wrap gap-x-3 gap-y-0.5">
			{#if bookmark.viewedChapter}<span>read · ch. {bookmark.viewedChapter.number}</span>{/if}
			{#if bookmark.currentChapter}<span class="text-[var(--accent)]">latest · ch. {bookmark.currentChapter.number}</span>{/if}
		</div>
		<div class="font-sans text-xs text-[var(--text-faint)] mt-auto">Updated {bookmark.lastUpdated}</div>
	</div>

	<form
		method="POST"
		action="/bookmark?/remove"
		class="absolute top-2 right-2 z-[2]"
		use:enhance={() => {
			onRemoveStart?.();
			return async ({ result, update }) => {
				if (result.type === 'failure') onRemoveError?.();
				await update({ reset: false });
			};
		}}
	>
		<input type="hidden" name="id" value={bookmark.mangaId} />
		<button
			type="submit"
			aria-label="Remove bookmark"
			title="Remove bookmark"
			class="w-7 h-7 grid place-items-center rounded-md bg-transparent hover:bg-[rgba(180,70,60,0.18)] text-[var(--text-faint)] hover:text-[#e8a09b] focus:text-[#e8a09b] border-none cursor-pointer transition-colors duration-150"
		>
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<polyline points="3 6 5 6 21 6" />
				<path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
				<path d="M10 11v6M14 11v6" />
			</svg>
		</button>
	</form>
</div>
