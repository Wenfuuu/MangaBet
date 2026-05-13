<script lang="ts">
	import type { Chapter } from '$lib/types';
	import { goto } from '$app/navigation';

	let {
		mangaSlug,
		mangaId,
		nextChapter,
	}: {
		mangaSlug: string;
		mangaId: string;
		nextChapter?: Chapter;
	} = $props();
</script>

<div class="px-6 py-8 mt-3 bg-[var(--surface)] border border-[rgba(160,130,100,0.12)] rounded-[10px] text-center">
	<div class="font-mono text-[11px] text-[var(--text-faint)] tracking-[0.18em] uppercase mb-2">End of chapter</div>
	<h3 class="font-serif text-2xl font-medium text-[var(--text)] m-0 mb-5">Take a breath.</h3>
	<div class="flex gap-3 justify-center flex-wrap">
		{#if nextChapter}
			<button
				class="px-5 py-3 bg-[var(--accent)] text-[var(--accent-on)] border-none rounded-md font-sans text-[13px] font-semibold cursor-pointer"
				onclick={() => goto(`/manga/${mangaSlug}/${mangaId}/chapter/${nextChapter!.number}`)}
			>
				Next chapter →
			</button>
		{/if}
		<button
			class="px-5 py-3 bg-[rgba(232,220,203,0.08)] text-[var(--text)] border border-[rgba(232,220,203,0.15)] rounded-md font-sans text-[13px] font-medium cursor-pointer"
			onclick={() => goto(`/manga/${mangaSlug}/${mangaId}`)}
		>
			Back to chapters
		</button>
	</div>
</div>
