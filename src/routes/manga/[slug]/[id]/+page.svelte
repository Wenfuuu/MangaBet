<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import { COVER_PALETTES, fmtDate, fmtViews } from '$lib/utils';
	import ChapterRow from '$lib/components/ChapterRow.svelte';
	import { proxyImage, saveMangaDTO } from '$lib/api';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let bookmarkOverride = $state<boolean | null>(null);
	let isBookmarked = $derived(bookmarkOverride ?? data.isBookmarked);
	let bookmarkPending = $state(false);

	let chapters = $derived(data.chapters);
	let order = $state<'desc' | 'asc'>('desc');
	let visible = $derived(
		chapters
			.slice()
			.sort((a, b) => (order === 'desc' ? b.number - a.number : a.number - b.number))
	);
	let firstChapter = $derived(chapters.slice().sort((a, b) => a.number - b.number)[0]);
	let paletteIdx = $derived(
		(page.params.slug ?? '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % COVER_PALETTES.length
	);
	let palette = $derived(COVER_PALETTES[paletteIdx]);

	let slug = $derived(page.params.slug);
	let id = $derived(page.params.id);
	let chapterUrl = (ch: { slug: string }) => `/manga/${slug}/${id}/chapter/${ch.slug}`;

	let copied = $state(false);
	async function copyLink() {
		await navigator.clipboard.writeText(page.url.href);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}

	$effect(() => {
		saveMangaDTO({
			id: Number(id),
			slug,
			name: data.detail.name,
			author: data.detail.author,
			chapterLatest: chapters[0]?.slug ?? '',
			url: '',
			thumb: data.detail.thumb,
		});
	});
</script>

<div>
	<!-- Hero -->
	<div class="relative border-b border-[var(--border-faint)] overflow-hidden">
		<div
			class="absolute inset-0 opacity-35"
			style="background: linear-gradient(160deg, {palette[0]}, {palette[1]}, {palette[2]});"
		></div>
		<div class="absolute inset-0 bg-gradient-to-b from-[rgba(11,9,8,0.7)] to-[rgba(11,9,8,1)]"></div>

		<div class="relative max-w-[1400px] mx-auto px-4 sm:px-8 pt-10 sm:pt-14 pb-10 sm:pb-12 flex flex-col sm:flex-row gap-8 sm:gap-12">
			<!-- Cover -->
			<div class="w-40 sm:w-[280px] self-center sm:self-start shrink-0 rounded-md shadow-[0_30px_80px_rgba(0,0,0,0.5)] overflow-hidden" style="aspect-ratio: 2/3;">
				{#if data.detail.thumb}
					<img class="w-full h-full object-fill" src={proxyImage(data.detail.thumb)} alt={data.detail.name} />
				{:else}
					<div class="w-full h-full" style="background: linear-gradient(160deg, {palette[0]}, {palette[1]}, {palette[2]});"></div>
				{/if}
			</div>

			<!-- Info -->
			<div class="flex-1 sm:pt-3">
				<h1 class="font-serif text-4xl sm:text-[56px] font-semibold text-[var(--text)] m-0 tracking-[-0.025em] leading-none text-balance">{data.detail.name}</h1>
				<div class="font-sans text-base text-[var(--text-soft)] mt-3.5">by <span class="text-[var(--text)]">{data.detail.author}</span></div>

				<div class="flex flex-wrap gap-6 sm:gap-8 mt-7">
					<div>
						<div class="font-mono text-[10px] text-[var(--text-faint)] tracking-[0.14em] uppercase mb-1">Rating</div>
						<div class="font-serif text-xl sm:text-[22px] font-medium text-[var(--text)]">
							<svg width="14" height="14" viewBox="0 0 24 24" fill="#c9a37a" class="inline align-middle mr-1">
								<path d="M12 2l3 7 7 .6-5.3 4.7L18 22l-6-3.7L6 22l1.3-7.7L2 9.6 9 9z" />
							</svg>{data.detail.rating}
						</div>
					</div>
					<div>
						<div class="font-mono text-[10px] text-[var(--text-faint)] tracking-[0.14em] uppercase mb-1">Chapters</div>
						<div class="font-serif text-xl sm:text-[22px] font-medium text-[var(--text)]">{chapters.length}</div>
					</div>
					<div>
						<div class="font-mono text-[10px] text-[var(--text-faint)] tracking-[0.14em] uppercase mb-1">Readers</div>
						<div class="font-serif text-xl sm:text-[22px] font-medium text-[var(--text)]">{fmtViews(data.detail.views)}</div>
					</div>
					<div>
						<div class="font-mono text-[10px] text-[var(--text-faint)] tracking-[0.14em] uppercase mb-1">Updated</div>
						<div class="font-serif text-xl sm:text-[22px] font-medium text-[var(--text)]">{fmtDate(new Date(data.detail.lastUpdated))}</div>
					</div>
					<div>
						<div class="font-mono text-[10px] text-[var(--text-faint)] tracking-[0.14em] uppercase mb-1">Status</div>
						<div class="font-serif text-xl sm:text-[22px] font-medium {data.detail.status === 'Ongoing' ? 'text-[var(--accent)]' : 'text-[var(--text)]'}">{data.detail.status}</div>
					</div>
				</div>

				<div class="flex flex-wrap gap-2 mt-6">
					{#each data.detail.genres as g}
						<span class="px-3 py-1 bg-[rgba(107,67,36,0.2)] border border-[rgba(201,163,122,0.2)] rounded-full font-sans text-xs text-[var(--accent)]">{g}</span>
					{/each}
				</div>

				<div class="flex flex-wrap gap-3 items-center mt-6">
						{#await data.progress then progress}
							{#if progress}
								<button
									class="inline-flex items-center gap-2 px-5 sm:px-7 py-3.5 bg-[var(--accent)] text-[var(--accent-on)] border-none rounded-lg font-sans text-sm font-semibold cursor-pointer"
									onclick={() => goto(chapterUrl({ slug: progress.slug }))}
								>
									<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
										<polygon points="5,3 19,12 5,21" />
									</svg>
									Continue · Ch. {progress.number}
								</button>
							{/if}
						{/await}
					<button
						class="inline-flex items-center gap-2 px-5 sm:px-7 py-3.5 bg-[var(--accent)] text-[var(--accent-on)] border-none rounded-lg font-sans text-sm font-semibold cursor-pointer"
						onclick={() => goto(chapterUrl(firstChapter))}
					>
						<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
							<polygon points="5,3 19,12 5,21" />
						</svg>
						Start from Ch. {firstChapter.number}
					</button>
					<button
						class="inline-flex items-center gap-2 px-4 sm:px-5 py-3.5 bg-[rgba(232,220,203,0.05)] text-[var(--text)] border border-[rgba(232,220,203,0.15)] rounded-lg font-sans text-sm font-medium cursor-pointer"
						onclick={() => goto(chapterUrl(chapters[0]))}
					>Latest chapter</button>
					{#if isBookmarked !== null}
						<form
							method="POST"
							action="?/toggleBookmark"
							use:enhance={() => {
								bookmarkOverride = !isBookmarked;
								bookmarkPending = true;
								return async ({ update }) => {
									await update({ reset: false });
									bookmarkOverride = null;
									bookmarkPending = false;
								};
							}}
						>
							<input type="hidden" name="action" value={isBookmarked ? 'remove' : 'add'} />
							<button
								type="submit"
								disabled={bookmarkPending}
								class="inline-flex items-center gap-2 px-4 sm:px-5 py-3.5 border rounded-lg font-sans text-sm font-medium cursor-pointer transition-colors duration-150 disabled:opacity-60 disabled:cursor-wait {isBookmarked ? 'bg-[rgba(201,163,122,0.15)] text-[var(--accent)] border-[rgba(201,163,122,0.4)]' : 'bg-[rgba(232,220,203,0.05)] text-[var(--text)] border-[rgba(232,220,203,0.15)]'}"
							>
								<svg width="14" height="14" viewBox="0 0 24 24" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="2">
									<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
								</svg>
								{isBookmarked ? 'Bookmarked' : 'Bookmark'}
							</button>
						</form>
					{/if}
					<button
						class="inline-flex items-center justify-center px-4 py-3.5 bg-[rgba(232,220,203,0.05)] text-[var(--text)] border border-[rgba(232,220,203,0.15)] rounded-lg cursor-pointer"
						aria-label={copied ? 'Link copied' : 'Copy link'}
						onclick={copyLink}
					>
						{#if copied}
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2">
								<polyline points="20 6 9 17 4 12" />
							</svg>
						{:else}
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<circle cx="18" cy="5" r="3" />
								<circle cx="6" cy="12" r="3" />
								<circle cx="18" cy="19" r="3" />
								<line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
								<line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
							</svg>
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Chapter list -->
	<div class="max-w-[1400px] mx-auto px-4 sm:px-8 pt-12 pb-24">
		<div class="flex items-baseline justify-between mb-6">
			<h2 class="font-serif text-2xl sm:text-[32px] font-semibold text-[var(--text)] m-0 tracking-[-0.015em]">
				Chapters
				<span class="font-sans text-base font-normal text-[var(--text-faint)] ml-3">{chapters.length} total</span>
			</h2>
			<button
				class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-transparent border border-[rgba(160,130,100,0.2)] rounded-md font-sans text-xs text-[var(--text-soft)] cursor-pointer shrink-0"
				onclick={() => (order = order === 'desc' ? 'asc' : 'desc')}
			>
				<svg
					width="12"
					height="12"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					style="transform: {order === 'asc' ? 'rotate(180deg)' : 'none'}; transition: transform 200ms;"
				>
					<line x1="12" y1="5" x2="12" y2="19" />
					<polyline points="19 12 12 19 5 12" />
				</svg>
				{order === 'desc' ? 'Newest first' : 'Oldest first'}
			</button>
		</div>

		<div class="border border-[var(--border-faint)] rounded-[10px] overflow-hidden">
			{#each visible as ch, i}
				<ChapterRow
					{ch}
					isLast={i === visible.length - 1}
					onclick={() => goto(chapterUrl(ch))}
				/>
			{/each}
		</div>
	</div>
</div>
