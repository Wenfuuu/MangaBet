<script lang="ts">
	import { enhance } from '$app/forms';
	import type { BookmarkItem } from '$lib/types';
	import { proxyImage } from '$lib/api';

	let {
		bookmark,
		href,
		onRemoveStart,
		onRemoveSuccess,
		onRemoveError,
	}: {
		bookmark: BookmarkItem;
		href: string;
		onRemoveStart?: () => void;
		onRemoveSuccess?: () => void;
		onRemoveError?: () => void;
	} = $props();

	let unreadCount = $derived(
		bookmark.viewedChapter && bookmark.currentChapter
			? Math.max(0, Math.round(bookmark.currentChapter.number - bookmark.viewedChapter.number))
			: 0,
	);
</script>

<div
	class="group flex gap-4 w-full bg-surface hover:bg-fg/4 border border-edge/15 hover:border-edge/25 rounded-lg p-3 sm:p-4 transition-colors duration-150 relative"
>
	<a class="absolute inset-0" aria-label={bookmark.title} {href}></a>

	<div class="w-[72px] sm:w-[88px] aspect-[2/3] shrink-0 overflow-hidden rounded-md relative bg-surface-2 z-[1] pointer-events-none">
		<img class="absolute inset-0 w-full h-full object-fill" src={proxyImage(bookmark.thumb)} alt={bookmark.title} loading="lazy" />
		{#if unreadCount > 0}
			<span class="absolute top-1 right-1 px-1.5 py-0.5 rounded-full bg-accent/92 text-accent-on font-mono text-[10px] font-semibold tracking-wide">
				+{unreadCount}
			</span>
		{/if}
	</div>

	<div class="flex-1 min-w-0 flex flex-col gap-1.5 py-0.5 z-[1] pointer-events-none">
		<div class="font-serif text-[15px] sm:text-base font-medium text-fg leading-[1.25] line-clamp-2 pr-8">{bookmark.title}</div>
		<div class="font-mono text-[11px] text-fg-soft flex flex-wrap gap-x-3 gap-y-0.5">
			{#if bookmark.viewedChapter}<span>read · ch. {bookmark.viewedChapter.number}</span>{/if}
			{#if bookmark.currentChapter}<span class="text-accent">latest · ch. {bookmark.currentChapter.number}</span>{/if}
		</div>
		<div class="font-sans text-xs text-fg-faint mt-auto">Updated {bookmark.lastUpdated}</div>
	</div>

	<form
		method="POST"
		action="/bookmark?/remove"
		class="absolute top-2 right-2 z-[2]"
		use:enhance={() => {
			onRemoveStart?.();
			return async ({ result, update }) => {
				// 'error' is an unhandled server exception — as much a failure as 'failure'.
				if (result.type === 'failure' || result.type === 'error') onRemoveError?.();
				else onRemoveSuccess?.();
				await update({ reset: false });
			};
		}}
	>
		<input type="hidden" name="id" value={bookmark.mangaId} />
		<button
			type="submit"
			aria-label="Remove bookmark"
			title="Remove bookmark"
			class="w-7 h-7 grid place-items-center rounded-md bg-transparent hover:bg-danger/18 text-fg-faint hover:text-danger-fg focus:text-danger-fg border-none cursor-pointer transition-colors duration-150"
		>
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<polyline points="3 6 5 6 21 6" />
				<path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
				<path d="M10 11v6M14 11v6" />
			</svg>
		</button>
	</form>
</div>
